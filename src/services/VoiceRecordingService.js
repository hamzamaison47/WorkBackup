// services/VoiceRecordingService.js
/* eslint-disable curly */
/* eslint-disable no-unused-vars */
import AudioRecord from 'react-native-audio-record';
import {PermissionsAndroid, Platform} from 'react-native';
import RNFS from 'react-native-fs';
import {Buffer} from 'buffer';
import {
  AZURE_API_KEY,
  AZURE_SPEECH_REGION,
  AZURE_SPEECH_STT_ENDPOINT,
  AZURE_OPENAI_ENDPOINT, // Optional: for Whisper fallback
  AZURE_OPENAI_KEY, // Optional: for Whisper fallback
} from '@env';

global.Buffer = global.Buffer || Buffer;

class VoiceRecordingService {
  constructor() {
    this.isRecording = false;
    this.startTime = 0;
    this.audioFilePath = null;
    this.token = null;
    this.tokenExpMs = 0;
  }

  async getToken() {
    const now = Date.now();
    if (this.token && now < this.tokenExpMs) return this.token;

    const tokenUrl = `https://${AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_API_KEY,
        'Content-Length': '0',
      },
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Token error ${res.status}: ${t}`);
    }

    this.token = await res.text();
    this.tokenExpMs = now + 9 * 60 * 1000;
    return this.token;
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
      return res === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
      return false;
    }
  }

  async startRecording() {
    if (this.isRecording) {
      return {success: false, error: 'Already recording'};
    }

    const ok = await this.requestPermission();
    if (!ok) return {success: false, error: 'Permission denied'};

    try {
      AudioRecord.init({
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6, // MIC
        wavFile: 'speech_recording.wav',
      });

      this.startTime = Date.now();
      this.isRecording = true;
      AudioRecord.start();

      return {success: true};
    } catch (e) {
      this.isRecording = false;
      return {success: false, error: e?.message || 'Start failed'};
    }
  }

  async stopRecording() {
    if (!this.isRecording) {
      return {success: false, error: 'Not recording'};
    }

    try {
      const filePath = await AudioRecord.stop();
      const duration = (Date.now() - this.startTime) / 1000;
      this.isRecording = false;

      if (!filePath || !(await RNFS.exists(filePath))) {
        return {success: false, error: 'Audio file not created', duration};
      }

      const stat = await RNFS.stat(filePath);
      if (!stat?.size || Number(stat.size) < 2000) {
        return {success: false, error: 'Recording too short', duration};
      }

      console.log('🎯 Starting Speech-to-Text...');

      // Try multiple methods in parallel for speed and accuracy
      let result = null;

      // Method 1: Try Azure Whisper if available (best for multilingual)
      if (AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_KEY) {
        try {
          console.log('🎤 Trying Whisper API (auto-detect)...');
          result = await this.whisperTranscribe(filePath);
          if (result?.text) {
            console.log('✅ Whisper success:', result.text);
            return {
              success: true,
              text: result.text,
              duration,
              detectedLanguage: result.language || 'auto',
              methodUsed: 'whisper',
            };
          }
        } catch (whisperErr) {
          console.log('⚠️ Whisper failed:', whisperErr.message);
        }
      }

      // Method 2: Try multiple Azure Speech languages in PARALLEL
      console.log('🎤 Trying Azure Speech with multiple languages...');
      result = await this.tryMultipleLanguages(filePath);

      if (result?.text) {
        return {
          success: true,
          text: result.text,
          duration,
          detectedLanguage: result.language,
          methodUsed: result.method,
        };
      }

      throw new Error('Could not recognize speech in any language');
    } catch (e) {
      this.isRecording = false;
      console.error('❌ stopRecording error:', e?.message);
      return {success: false, error: e?.message || 'Recognition failed'};
    }
  }

  /**
   * Try multiple languages in PARALLEL - fastest approach
   */
  async tryMultipleLanguages(filePath) {
    const languages = [
      {code: 'en-US', name: 'English'},
      {code: 'ur-IN', name: 'Urdu'}, // Try Indian Urdu (often supported when PK isn't)
      {code: 'ar-SA', name: 'Arabic'},
      // {code: 'hi-IN', name: 'Hindi'}, // Hindi works for many Urdu speakers
      {code: 'ur-PK', name: 'Urdu-PK'}, // Try PK variant too
    ];

    // Create parallel promises
    const promises = languages.map(lang =>
      this.azureSpeechToTextREST(filePath, lang.code)
        .then(text => ({
          success: true,
          text,
          language: lang.code,
          name: lang.name,
        }))
        .catch(err => ({
          success: false,
          error: err.message,
          language: lang.code,
        })),
    );

    try {
      // Wait for all to complete (fastest wins)
      const results = await Promise.all(promises);

      // Filter successful ones with text
      const successful = results.filter(
        r => r.success && r.text && r.text.trim().length > 0,
      );

      if (successful.length === 0) {
        throw new Error('No successful recognition');
      }

      // Pick the best result (longest text usually means better recognition)
      // or you could implement confidence scoring here
      const best = successful.reduce((prev, current) =>
        prev.text.length > current.text.length ? prev : current,
      );

      console.log(
        `✅ Best result from ${best.name} (${best.language}):`,
        best.text,
      );

      // Map language codes to generic ones
      let langCode = 'en';
      if (best.language.startsWith('ur')) langCode = 'ur';
      else if (best.language.startsWith('ar')) langCode = 'ar';
      else if (best.language.startsWith('hi')) langCode = 'hi';

      return {
        text: best.text,
        language: langCode,
        method: 'azure-rest-parallel',
      };
    } catch (e) {
      throw new Error('All language attempts failed: ' + e.message);
    }
  }

  /**
   * Azure Speech REST API with specific language
   */
  async azureSpeechToTextREST(wavFilePath, language) {
    const token = await this.getToken();

    const baseEndpoint =
      (AZURE_SPEECH_STT_ENDPOINT || '').replace(/\/+$/, '') ||
      `https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com`;

    // Try both conversation and dictation endpoints for better language support
    const endpoints = [
      `${baseEndpoint}/speech/recognition/conversation/cognitiveservices/v1`,
      `${baseEndpoint}/speech/recognition/dictation/cognitiveservices/v1`,
    ];

    const base64Audio = await RNFS.readFile(wavFilePath, 'base64');
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    // Try each endpoint
    for (const endpoint of endpoints) {
      try {
        const url = `${endpoint}?language=${encodeURIComponent(
          language,
        )}&format=detailed&profanity=raw`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
            Accept: 'application/json',
          },
          body: audioBuffer,
        });

        if (!response.ok) {
          // If 400, this endpoint doesn't support this language, try next endpoint
          if (response.status === 400) continue;
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const status = data?.RecognitionStatus;

        // Must have both Success status AND actual text
        const nbest = Array.isArray(data?.NBest) ? data.NBest : [];
        const best = nbest[0] || {};
        const text = (
          best?.Display ||
          best?.ITN ||
          data?.DisplayText ||
          ''
        ).trim();

        if (status === 'Success' && text.length > 0) {
          return text;
        }

        // If status is Success but text is empty, it's actually a failure
        throw new Error('Empty transcription');
      } catch (e) {
        // If this endpoint failed, try next one
        if (endpoint === endpoints[endpoints.length - 1]) throw e;
      }
    }

    throw new Error('All endpoints failed');
  }

  async checkPermission() {
    if (Platform.OS !== 'android') return true;
    try {
      const res = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      return res === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
      return false;
    }
  }

  /**
   * Azure OpenAI Whisper API - Best for multilingual auto-detection
   */
  async whisperTranscribe(wavFilePath) {
    // Convert wav to mp3 or just send as is (Whisper accepts various formats)
    const audioData = await RNFS.readFile(wavFilePath, 'base64');

    // Create form data
    const formData = new FormData();
    formData.append('file', {
      uri: 'file://' + wavFilePath,
      type: 'audio/wav',
      name: 'audio.wav',
    });
    formData.append('model', 'whisper-1');
    formData.append('language', ''); // Empty for auto-detect, or remove this line
    formData.append('response_format', 'json');

    const response = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/whisper/audio/transcriptions?api-version=2024-06-01`,
      {
        method: 'POST',
        headers: {
          'api-key': AZURE_OPENAI_KEY,
          // Note: Don't set Content-Type header, fetch sets it with boundary for FormData
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Whisper error: ${err}`);
    }

    const data = await response.json();
    return {
      text: data.text,
      language: data.language || 'auto',
    };
  }

  async cancelRecording() {
    try {
      if (this.isRecording) {
        await AudioRecord.stop();
      }
    } catch (e) {}
    this.isRecording = false;
    return {success: true};
  }

  isCurrentlyRecording() {
    return this.isRecording;
  }
}

export default new VoiceRecordingService();
