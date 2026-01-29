/* eslint-disable curly */
// services/SpeechRecordingService.js
import AudioRecord from 'react-native-audio-record';
import {PermissionsAndroid, Platform} from 'react-native';
import RNFS from 'react-native-fs';

class SpeechRecordingService {
  constructor() {
    this.isRecording = false;
    this.startTime = 0;

    this._initialized = false;
    this._pcmChunks = 0;
    this._pcmChars = 0;

    this._fileName = 'speech.wav';
  }

  async requestPermission() {
    if (Platform.OS !== 'android') return true;

    try {
      const res = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs microphone access for speech recognition.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        },
      );

      const ok = res === PermissionsAndroid.RESULTS.GRANTED;
      console.log('🎙️ RECORD_AUDIO permission:', ok ? 'GRANTED' : 'DENIED');
      return ok;
    } catch (e) {
      console.log('❌ Permission request error:', e?.message);
      return false;
    }
  }

  _initIfNeeded() {
    if (this._initialized) return;

    console.log('🎛️ AudioRecord.init()');

    AudioRecord.init({
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      audioSource: 6,
      wavFile: this._fileName,
    });

    // IMPORTANT: attach data listener ONCE
    AudioRecord.on('data', data => {
      // data is base64 PCM chunk
      this._pcmChunks += 1;
      this._pcmChars += data?.length || 0;

      // log occasionally so you can see mic is working
      if (this._pcmChunks % 10 === 0) {
        console.log(
          `📈 PCM chunks: ${this._pcmChunks} (chars: ${this._pcmChars})`,
        );
      }
    });

    this._initialized = true;
  }

  async startRecording() {
    if (this.isRecording) {
      console.log('⚠️ Already recording');
      return {success: false, error: 'Already recording'};
    }

    const ok = await this.requestPermission();
    if (!ok) return {success: false, error: 'Permission denied'};

    try {
      this._initIfNeeded();

      this._pcmChunks = 0;
      this._pcmChars = 0;

      this.startTime = Date.now();
      this.isRecording = true;

      console.log('🎤 AudioRecord.start()');
      AudioRecord.start();

      // Give it a moment and verify we are receiving PCM
      await new Promise(r => setTimeout(r, 350));

      if (this._pcmChunks === 0) {
        // Not receiving audio frames => not recording
        this.isRecording = false;
        try {
          await AudioRecord.stop();
        } catch {}

        return {
          success: false,
          error:
            'Microphone is not capturing audio. Check emulator mic/device privacy settings or native module linking.',
        };
      }

      console.log('✅ Recording confirmed (PCM is flowing)');
      return {success: true};
    } catch (e) {
      this.isRecording = false;
      console.log('❌ startRecording error:', e?.message);
      return {success: false, error: e?.message || 'Start failed'};
    }
  }

  async stopRecording() {
    if (!this.isRecording) {
      console.log('⚠️ stopRecording called while not recording');
      return {success: false, error: 'Not recording'};
    }

    try {
      console.log('🛑 AudioRecord.stop()');

      const filePath = await AudioRecord.stop(); // should return full path
      const duration = (Date.now() - this.startTime) / 1000;

      this.isRecording = false;

      console.log('📁 Returned filePath:', filePath);
      console.log('⏱️ duration:', duration);

      const exists = filePath ? await RNFS.exists(filePath) : false;
      console.log('📄 File exists:', exists);

      if (!exists) {
        return {
          success: false,
          error:
            'Recorder stopped but WAV file was not created. This usually means native module/linking issue.',
          duration,
          filePath,
          pcmChunks: this._pcmChunks,
        };
      }

      // file size check (sometimes file exists but is 0 bytes)
      const stat = await RNFS.stat(filePath);
      console.log('📦 File size:', stat?.size);

      if (!stat?.size || Number(stat.size) < 2000) {
        return {
          success: false,
          error:
            'WAV file is too small/empty. Audio capture is failing on this device.',
          duration,
          filePath,
          size: stat?.size,
          pcmChunks: this._pcmChunks,
        };
      }

      return {
        success: true,
        filePath,
        duration,
      };
    } catch (e) {
      this.isRecording = false;
      console.log('❌ stopRecording error:', e?.message);
      return {success: false, error: e?.message || 'Stop failed'};
    }
  }

  async cancelRecording() {
    try {
      if (this.isRecording) {
        console.log('🧹 cancelRecording -> stop');
        await AudioRecord.stop();
      }
    } catch {}
    this.isRecording = false;
    return {success: true};
  }
}

export default new SpeechRecordingService();
