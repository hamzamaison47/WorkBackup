// services/VoiceRecordingService.js
import Voice from '@react-native-voice/voice';
import {PermissionsAndroid, Platform} from 'react-native';

class VoiceRecordingService {
  constructor() {
    this.isRecording = false;
    this.transcriptionResult = null;
    this.partialResults = [];
    this.recordingStartTime = null;
    this.currentLocale = 'en-US';
    this.onResultCallback = null;
  }

  setupVoiceListeners() {
    // Remove all existing listeners first
    Voice.removeAllListeners();

    Voice.onSpeechStart = () => {
      console.log('🎤 Speech started');
      this.isRecording = true;
    };

    Voice.onSpeechEnd = () => {
      console.log('🛑 Speech ended');
      // Don't set isRecording = false here - let stopRecording handle it
    };

    Voice.onSpeechError = e => {
      console.error('❌ Speech error:', e);
      this.isRecording = false;

      // Handle "no match" error gracefully
      if (e.error?.code === '7') {
        console.log('⚠️ No match error - speech not recognized');
        if (this.onResultCallback) {
          this.onResultCallback({
            success: false,
            error: 'Speech not recognized. Please try again.',
            code: 'no_match',
          });
        }
      } else if (this.onResultCallback) {
        this.onResultCallback({
          success: false,
          error: e.error?.message || 'Speech recognition failed',
        });
      }
    };

    Voice.onSpeechResults = e => {
      console.log('📝 Final results:', e);

      // Stop recording immediately when we get results
      this.stopRecordingInternal().then(() => {
        if (e.value && e.value.length > 0) {
          const result = e.value[0];
          console.log('✅ Transcription:', result);

          this.transcriptionResult = result;

          if (this.onResultCallback) {
            this.onResultCallback({
              success: true,
              text: result.trim(),
            });
          }
        } else if (this.onResultCallback) {
          this.onResultCallback({
            success: false,
            error: 'No speech detected',
          });
        }
      });
    };

    Voice.onSpeechPartialResults = e => {
      if (e.value && e.value.length > 0) {
        const partial = e.value[0];
        console.log('📝 Partial result:', partial);
        this.partialResults.push(partial);
        // Store the latest partial for potential use
        this.transcriptionResult = partial;
      }
    };

    Voice.onSpeechVolumeChanged = e => {
      // Optional: For debugging audio levels
      // console.log('🔊 Volume:', e.value);
    };
  }

  async requestPermissions() {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        const granted =
          grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
          PermissionsAndroid.RESULTS.GRANTED;

        console.log(
          '🎤 Microphone permission:',
          granted ? 'GRANTED' : 'DENIED',
        );
        return granted;
      } catch (err) {
        console.error('❌ Permission error:', err);
        return false;
      }
    }
    return true;
  }

  async startRecording() {
    try {
      console.log('🎤 Starting recording...');

      if (this.isRecording) {
        console.log('⚠️ Already recording');
        return {success: false, error: 'Already recording'};
      }

      // Check permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return {
          success: false,
          error: 'Microphone permission required',
        };
      }

      // Clean up previous session
      try {
        await Voice.destroy();
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (e) {
        console.log('⚠️ Cleanup warning:', e.message);
      }

      // Reset state
      this.isRecording = false;
      this.transcriptionResult = null;
      this.partialResults = [];
      this.recordingStartTime = Date.now();

      // Setup listeners
      this.setupVoiceListeners();

      // Start with SIMPLE config - like your working code
      try {
        await Voice.start(this.currentLocale, {
          EXTRA_PARTIAL_RESULTS: true,
          EXTRA_MAX_RESULTS: 3,
        });

        console.log('✅ Recording started');
        this.isRecording = true;

        return {
          success: true,
          message: 'Recording started',
        };
      } catch (startError) {
        console.error('❌ Voice.start failed:', startError);

        // Try without options as fallback
        try {
          await Voice.start(this.currentLocale);
          console.log('✅ Recording started (fallback)');
          this.isRecording = true;

          return {
            success: true,
            message: 'Recording started',
          };
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
          throw fallbackError;
        }
      }
    } catch (error) {
      console.error('❌ Start error:', error);
      this.isRecording = false;

      return {
        success: false,
        error: `Failed to start: ${error.message}`,
      };
    }
  }

  async stopRecordingInternal() {
    try {
      if (!this.isRecording) {
        return;
      }

      console.log('🛑 Stopping recording...');

      try {
        await Voice.stop();
      } catch (stopError) {
        console.error('Voice.stop error:', stopError);
      }

      this.isRecording = false;

      // Calculate duration if we have a start time
      if (this.recordingStartTime) {
        const duration = (Date.now() - this.recordingStartTime) / 1000;
        console.log(`⏱️ Recording duration: ${duration.toFixed(1)}s`);
        return duration;
      }

      return 0;
    } catch (error) {
      console.error('❌ Stop internal error:', error);
      this.isRecording = false;
      return 0;
    }
  }

  async stopRecording() {
    try {
      const duration = await this.stopRecordingInternal();

      // Wait a bit for any pending results
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the best result we have
      let finalText = this.transcriptionResult || '';

      // Check partials if no final result
      if (!finalText && this.partialResults.length > 0) {
        // Use the longest partial result
        finalText = this.partialResults.reduce((longest, current) => {
          return current.length > longest.length ? current : longest;
        }, '');
        console.log('📝 Using best partial result:', finalText);
      }

      if (!finalText || finalText.trim().length === 0) {
        return {
          success: false,
          error: 'No speech detected. Please try again.',
          duration,
        };
      }

      return {
        success: true,
        text: finalText.trim(),
        duration,
      };
    } catch (error) {
      console.error('❌ Stop recording error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async cancelRecording() {
    try {
      console.log('🗑️ Cancelling recording...');

      if (this.isRecording) {
        try {
          await Voice.cancel();
        } catch (cancelError) {
          console.error('Cancel error:', cancelError);
        }
      }

      this.isRecording = false;
      this.transcriptionResult = null;
      this.partialResults = [];
      this.recordingStartTime = null;
      this.onResultCallback = null;

      console.log('✅ Recording cancelled');
      return {success: true};
    } catch (error) {
      console.error('❌ Cancel error:', error);
      this.isRecording = false;
      return {success: false, error: error.message};
    }
  }

  // Set callback for real-time results (optional)
  setResultCallback(callback) {
    this.onResultCallback = callback;
  }

  // Check if speech recognition is available
  async isAvailable() {
    try {
      const available = await Voice.isAvailable();
      console.log('🎤 Speech recognition available:', available);
      return available;
    } catch (error) {
      console.error('❌ Availability check failed:', error);
      return false;
    }
  }

  // Get supported locales
  async getSupportedLocales() {
    try {
      const locales = await Voice.getSupportedLocales();
      console.log('🌍 Supported locales count:', locales?.locales?.length || 0);
      return locales?.locales || [];
    } catch (error) {
      console.error('❌ Failed to get locales:', error);
      return [];
    }
  }

  // Test microphone and speech recognition
  async testRecognition() {
    try {
      console.log('🧪 Testing speech recognition...');

      const available = await this.isAvailable();
      if (!available) {
        return {
          success: false,
          error: 'Speech recognition not available',
        };
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return {
          success: false,
          error: 'Microphone permission denied',
        };
      }

      const locales = await this.getSupportedLocales();

      return {
        success: true,
        available: true,
        hasPermission: true,
        localeCount: locales.length,
        defaultLocale: this.currentLocale,
      };
    } catch (error) {
      console.error('❌ Test failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  cleanup() {
    try {
      Voice.destroy();
      Voice.removeAllListeners();
    } catch (e) {
      console.error('Cleanup error:', e);
    }

    this.isRecording = false;
    this.transcriptionResult = null;
    this.partialResults = [];
    this.recordingStartTime = null;
    this.onResultCallback = null;

    console.log('✅ Service cleaned up');
  }

  isCurrentlyRecording() {
    return this.isRecording;
  }

  // Get partial results for real-time display
  getPartialResults() {
    return this.partialResults;
  }

  // Get current transcription
  getCurrentTranscription() {
    return this.transcriptionResult || '';
  }
}

// Export a singleton instance
const voiceRecordingService = new VoiceRecordingService();
export default voiceRecordingService;
