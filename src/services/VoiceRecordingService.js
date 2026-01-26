/* eslint-disable curly */
// services/VoiceRecordingService.js
import Voice from '@react-native-voice/voice';
import {PermissionsAndroid, Platform} from 'react-native';

class VoiceRecordingService {
  constructor() {
    this.isRecording = false;
    this.transcriptionResult = null;
    this.partialResults = [];
    this.recordingStartTime = null;
    this.recognitionStarted = false;
    this.setupVoiceListeners();
  }

  setupVoiceListeners() {
    // Remove all existing listeners first
    Voice.destroy().then(() => {
      Voice.removeAllListeners();
    });

    Voice.onSpeechStart = e => {
      console.log('🎤 Speech started');
      this.recognitionStarted = true;
    };

    Voice.onSpeechRecognized = e => {
      console.log('✅ Speech recognized');
    };

    Voice.onSpeechEnd = e => {
      console.log('🛑 Speech ended');
      this.recognitionStarted = false;
    };

    Voice.onSpeechError = e => {
      console.error('❌ Speech error:', e.error);
      // Don't immediately set isRecording to false - let stopRecording handle it
      if (e.error && e.error.code) {
        console.error('Error code:', e.error.code);
        console.error('Error message:', e.error.message);
      }
    };

    Voice.onSpeechResults = e => {
      console.log('📝 Final speech results:', e);
      if (e.value && e.value.length > 0) {
        this.transcriptionResult = e.value[0];
        console.log('✅ Final transcription:', this.transcriptionResult);
      }
    };

    Voice.onSpeechPartialResults = e => {
      if (e.value && e.value.length > 0) {
        const partial = e.value[0];
        console.log('📝 Partial result:', partial);
        this.partialResults.push(partial);
        // Store the latest partial as backup
        this.transcriptionResult = partial;
      }
    };

    Voice.onSpeechVolumeChanged = e => {
      // Uncomment for debugging: console.log('🔊 Volume:', e.value);
    };
  }

  async requestPermissions() {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);

        const audioGranted =
          grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
          PermissionsAndroid.RESULTS.GRANTED;

        console.log(
          '🎤 Microphone permission:',
          audioGranted ? 'GRANTED' : 'DENIED',
        );
        return audioGranted;
      } catch (err) {
        console.error('❌ Permission error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  }

  async startRecording() {
    try {
      console.log('🎤 Starting voice recording...');

      // Check if already recording
      if (this.isRecording) {
        console.warn('⚠️ Already recording');
        return {
          success: false,
          error: 'Already recording',
        };
      }

      // Check permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return {
          success: false,
          error: 'Microphone permission denied. Please enable it in Settings.',
        };
      }

      // Cleanup previous session
      try {
        await Voice.destroy();
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        console.log('⚠️ Cleanup warning:', e.message);
      }

      // Reset state
      this.transcriptionResult = null;
      this.partialResults = [];
      this.recognitionStarted = false;
      this.recordingStartTime = Date.now();

      // Re-setup listeners
      this.setupVoiceListeners();

      // Try multiple locales with different configurations
      const localeConfigs = [
        {
          locale: 'en-US',
          options: {
            EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 15000,
            EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,
            EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,
            EXTRA_MAX_RESULTS: 5,
            EXTRA_PARTIAL_RESULTS: true,
            EXTRA_PREFER_OFFLINE: false, // Use online recognition
          },
        },
        {
          locale: 'en-GB',
          options: {
            EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 15000,
            EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,
            EXTRA_MAX_RESULTS: 5,
            EXTRA_PARTIAL_RESULTS: true,
          },
        },
        {
          locale: 'en-IN',
          options: {
            EXTRA_PARTIAL_RESULTS: true,
            EXTRA_MAX_RESULTS: 5,
          },
        },
      ];

      let started = false;
      for (const config of localeConfigs) {
        try {
          console.log(`🔄 Trying locale: ${config.locale}`);
          await Voice.start(config.locale, config.options);
          this.isRecording = true;
          started = true;
          console.log(`✅ Voice recognition started with ${config.locale}`);
          return {
            success: true,
            message: 'Voice recognition started. Speak now...',
          };
        } catch (e) {
          console.error(`Failed with ${config.locale}:`, e.message);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (!started) {
        throw new Error('Failed to start voice recognition');
      }
    } catch (error) {
      console.error('❌ Start recording error:', error);
      this.isRecording = false;

      return {
        success: false,
        error: `Failed to start: ${error.message}. Please ensure your device has internet connection for voice recognition.`,
      };
    }
  }

  async stopRecording() {
    try {
      console.log('🛑 Stopping voice recording...');

      if (!this.isRecording) {
        console.warn('⚠️ No active recording');
        return {
          success: false,
          error: 'No active recording to stop',
        };
      }

      // Calculate duration
      const duration = this.recordingStartTime
        ? (Date.now() - this.recordingStartTime) / 1000
        : 0;

      console.log(`⏱️ Recording duration: ${duration.toFixed(1)}s`);

      // Check if recording was too short
      if (duration < 0.5) {
        this.isRecording = false;
        return {
          success: false,
          error: 'Recording too short. Please speak for at least 1 second.',
          duration,
        };
      }

      // Stop voice recognition
      try {
        await Voice.stop();
      } catch (stopError) {
        console.error('❌ Voice.stop error:', stopError);
        // Continue anyway - we might have partial results
      }

      // Wait longer for final results (especially important for "no match" errors)
      await new Promise(resolve => setTimeout(resolve, 1200));

      this.isRecording = false;

      // Get best transcription result
      let finalText = this.transcriptionResult || '';

      // If no final result, try to use the last partial result
      if (!finalText && this.partialResults.length > 0) {
        finalText = this.partialResults[this.partialResults.length - 1];
        console.log('📝 Using last partial result:', finalText);
      }

      console.log('✅ Stop recording complete:', {
        text: finalText?.substring(0, 100),
        textLength: finalText?.length || 0,
        duration: duration.toFixed(1),
        hasResult: !!finalText,
        partialResultsCount: this.partialResults.length,
      });

      // More helpful error message
      if (!finalText || finalText.trim().length === 0) {
        let errorMessage = 'No speech detected. ';

        if (duration < 2) {
          errorMessage += 'Try speaking for at least 2-3 seconds.';
        } else {
          errorMessage +=
            'Please speak louder and clearer. Make sure you have internet connection.';
        }

        return {
          success: false,
          error: errorMessage,
          duration,
          tip: 'Voice recognition works best in quiet environments with good internet connection.',
        };
      }

      return {
        success: true,
        text: finalText.trim(),
        duration,
        confidence: 1.0,
        alternatives: this.partialResults,
      };
    } catch (error) {
      console.error('❌ Stop recording error:', error);
      this.isRecording = false;

      return {
        success: false,
        error: `Failed to process: ${error.message}`,
      };
    }
  }

  async cancelRecording() {
    try {
      console.log('🗑️ Cancelling recording...');

      if (this.isRecording) {
        try {
          await Voice.cancel();
        } catch (e) {
          console.error('Cancel error:', e);
        }
      }

      this.isRecording = false;
      this.transcriptionResult = null;
      this.partialResults = [];
      this.recordingStartTime = null;
      this.recognitionStarted = false;

      console.log('✅ Recording cancelled');
      return {success: true};
    } catch (error) {
      console.error('❌ Cancel error:', error);
      this.isRecording = false;
      return {success: false, error: error.message};
    }
  }

  cleanup() {
    try {
      Voice.destroy()
        .then(() => {
          Voice.removeAllListeners();
          console.log('✅ Voice service cleaned up');
        })
        .catch(e => console.error('Cleanup error:', e));

      this.isRecording = false;
      this.transcriptionResult = null;
      this.partialResults = [];
      this.recordingStartTime = null;
      this.recognitionStarted = false;
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }

  getRecordingDuration() {
    if (!this.recordingStartTime) return '0:00';
    const seconds = Math.floor((Date.now() - this.recordingStartTime) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  isCurrentlyRecording() {
    return this.isRecording;
  }

  // Get current transcription (useful for real-time display)
  getCurrentTranscription() {
    return this.transcriptionResult || '';
  }

  // Get all partial results
  getPartialResults() {
    return this.partialResults;
  }

  async destroy() {
    this.cleanup();
  }
}

// Export singleton instance
export default new VoiceRecordingService();
