// /* eslint-disable curly */
// // services/VoiceRecordingService.js - AZURE SPEECH SDK VERSION
// import AudioRecord from 'react-native-audio-record';
// import {PermissionsAndroid, Platform} from 'react-native';
// import RNFS from 'react-native-fs';
// import {Buffer} from 'buffer';
// import {
//   AZURE_API_KEY,
//   AZURE_SPEECH_REGION,
//   AZURE_SPEECH_STT_ENDPOINT,
// } from '@env';
// import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

// global.Buffer = global.Buffer || Buffer;

// class VoiceRecordingService {
//   constructor() {
//     this.isRecording = false;
//     this.startTime = 0;
//     this.audioFilePath = null;
//     this.token = null;
//     this.tokenExpMs = 0;
//   }

//   async getToken() {
//     const now = Date.now();
//     if (this.token && now < this.tokenExpMs) return this.token;

//     const tokenUrl = `https://${AZURE_SPEECH_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;

//     const res = await fetch(tokenUrl, {
//       method: 'POST',
//       headers: {
//         'Ocp-Apim-Subscription-Key': AZURE_API_KEY,
//         'Content-Length': '0',
//       },
//     });

//     if (!res.ok) {
//       const t = await res.text();
//       throw new Error(`Token error ${res.status}: ${t}`);
//     }

//     this.token = await res.text();
//     this.tokenExpMs = now + 9 * 60 * 1000;
//     return this.token;
//   }

//   async requestPermission() {
//     if (Platform.OS !== 'android') return true;

//     try {
//       const res = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//         {
//           title: 'Microphone Permission',
//           message: 'This app needs microphone access for speech recognition.',
//           buttonPositive: 'OK',
//           buttonNegative: 'Cancel',
//         },
//       );

//       const ok = res === PermissionsAndroid.RESULTS.GRANTED;
//       console.log('🎙️ RECORD_AUDIO permission:', ok ? 'GRANTED' : 'DENIED');
//       return ok;
//     } catch (e) {
//       console.log('❌ Permission request error:', e?.message);
//       return false;
//     }
//   }

//   async startRecording() {
//     if (this.isRecording) {
//       console.log('⚠️ Already recording');
//       return {success: false, error: 'Already recording'};
//     }

//     const ok = await this.requestPermission();
//     if (!ok) return {success: false, error: 'Permission denied'};

//     try {
//       console.log('🎤 Starting recording...');

//       // Initialize audio recorder
//       AudioRecord.init({
//         sampleRate: 16000,
//         channels: 1,
//         bitsPerSample: 16,
//         audioSource: 6,
//         wavFile: 'speech_recording.wav',
//       });

//       this.startTime = Date.now();
//       this.isRecording = true;

//       AudioRecord.start();
//       console.log('✅ Recording started');

//       return {success: true};
//     } catch (e) {
//       this.isRecording = false;
//       console.log('❌ startRecording error:', e?.message);
//       return {success: false, error: e?.message || 'Start failed'};
//     }
//   }

//   async stopRecording() {
//     if (!this.isRecording) {
//       console.log('⚠️ stopRecording called while not recording');
//       return {success: false, error: 'Not recording'};
//     }

//     try {
//       console.log('🛑 Stopping recording...');

//       const filePath = await AudioRecord.stop();
//       const duration = (Date.now() - this.startTime) / 1000;

//       this.isRecording = false;

//       console.log('📁 Audio file:', filePath);
//       console.log('⏱️ Duration:', duration);

//       if (!filePath || !(await RNFS.exists(filePath))) {
//         return {
//           success: false,
//           error: 'Audio file not created',
//           duration,
//         };
//       }

//       const stat = await RNFS.stat(filePath);
//       console.log('📦 File size:', stat?.size);

//       if (!stat?.size || Number(stat.size) < 2000) {
//         return {
//           success: false,
//           error: 'Audio file is too small',
//           duration,
//         };
//       }

//       // ✅ NOW USE AZURE SPEECH-TO-TEXT WITH AUTO LANGUAGE DETECTION
//       console.log('🎯 Starting Azure Speech-to-Text...');

//       const text = await this.azureSpeechToText(filePath);

//       if (!text || text.trim().length === 0) {
//         return {
//           success: false,
//           error: 'No speech detected',
//           duration,
//         };
//       }

//       console.log('✅ Transcription successful:', text);

//       return {
//         success: true,
//         text: text.trim(),
//         duration,
//       };
//     } catch (e) {
//       this.isRecording = false;
//       console.log('❌ stopRecording error:', e?.message);
//       return {success: false, error: e?.message || 'Stop failed'};
//     }
//   }

//   /**
//    * ✅ AZURE SPEECH-TO-TEXT WITH AUTO LANGUAGE DETECTION
//    * Supports: English, Urdu, Arabic, and 100+ other languages
//    */
//   /**
//    * ✅ AZURE SPEECH-TO-TEXT (REST v1) WITH SAFE MULTI-LANGUAGE FALLBACK
//    * IMPORTANT:
//    * - REST v1 does NOT support language=ur-PK,ar-SA,en-US
//    * - So we try languages one-by-one and return best match
//    */
//   async azureSpeechToText(wavFilePath) {
//     const token = await this.getToken();

//     // Speech SDK needs region (not the full endpoint URL)
//     const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
//       token,
//       AZURE_SPEECH_REGION,
//     );

//     // Enable language auto-detect (Urdu + Arabic + English)
//     const autoDetect = SpeechSDK.AutoDetectSourceLanguageConfig.fromLanguages([
//       'ur-PK',
//       'ar-SA',
//       'en-US',
//     ]);

//     // Read wav bytes
//     const base64Audio = await RNFS.readFile(wavFilePath, 'base64');
//     const audioBuffer = Buffer.from(base64Audio, 'base64');

//     const pushStream = SpeechSDK.AudioInputStream.createPushStream();
//     pushStream.write(audioBuffer);
//     pushStream.close();

//     const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(pushStream);

//     return await new Promise((resolve, reject) => {
//       const recognizer = SpeechSDK.SpeechRecognizer.FromConfig(
//         speechConfig,
//         autoDetect,
//         audioConfig,
//       );

//       recognizer.recognizeOnceAsync(
//         result => {
//           recognizer.close();

//           if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
//             resolve((result.text || '').trim());
//             return;
//           }

//           // useful debugging
//           reject(new Error(`Speech SDK failed: ${result.reason}`));
//         },
//         err => {
//           recognizer.close();
//           reject(err);
//         },
//       );
//     });
//   }
//   // async azureSpeechToText(wavFilePath) {
//   //   const token = await this.getToken();

//   //   // ✅ REST v1 requires ONE language at a time
//   //   const candidateLanguages = ['ur-PK', 'ar-SA', 'en-US'];

//   //   // ✅ Use your env endpoint if provided, otherwise fallback
//   //   const baseEndpoint =
//   //     (AZURE_SPEECH_STT_ENDPOINT || '').replace(/\/+$/, '') ||
//   //     `https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com`;

//   //   // Read audio file once
//   //   const base64Audio = await RNFS.readFile(wavFilePath, 'base64');
//   //   const audioBuffer = Buffer.from(base64Audio, 'base64');

//   //   const tryOnce = async lang => {
//   //     const url =
//   //       `${baseEndpoint}` +
//   //       `/speech/recognition/conversation/cognitiveservices/v1` +
//   //       `?language=${encodeURIComponent(lang)}` +
//   //       `&format=detailed` +
//   //       `&profanity=raw`;

//   //     console.log('📤 Sending to Azure STT...');
//   //     console.log('🌐 Language:', lang);
//   //     console.log('🌐 URL:', url);

//   //     const response = await fetch(url, {
//   //       method: 'POST',
//   //       headers: {
//   //         Authorization: `Bearer ${token}`,
//   //         'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
//   //         Accept: 'application/json',
//   //         'Content-Length': String(audioBuffer.length),
//   //       },
//   //       body: audioBuffer,
//   //     });

//   //     const rawText = await response.text();

//   //     if (!response.ok) {
//   //       // keep the rawText, Azure often returns helpful JSON/message
//   //       throw new Error(`Azure STT failed (${response.status}): ${rawText}`);
//   //     }

//   //     let data;
//   //     try {
//   //       data = JSON.parse(rawText);
//   //     } catch (e) {
//   //       throw new Error(`STT JSON parse failed. Raw: ${rawText}`);
//   //     }

//   //     const status = data?.RecognitionStatus;
//   //     const nbest = Array.isArray(data?.NBest) ? data.NBest : [];
//   //     const best = nbest[0] || null;

//   //     const text = (
//   //       best?.Display ||
//   //       best?.ITN ||
//   //       data?.DisplayText ||
//   //       ''
//   //     ).trim();

//   //     const confidence =
//   //       typeof best?.Confidence === 'number' ? best.Confidence : text ? 0.2 : 0;

//   //     return {langTried: lang, status, text, confidence, raw: data};
//   //   };

//   //   // ✅ Try languages one-by-one
//   //   const results = [];
//   //   for (const lang of candidateLanguages) {
//   //     try {
//   //       const r = await tryOnce(lang);
//   //       console.log('📥 Azure response:', {
//   //         tried: r.langTried,
//   //         status: r.status,
//   //         textPreview: (r.text || '').slice(0, 60),
//   //         confidence: r.confidence,
//   //       });

//   //       // Accept only Success with non-empty text
//   //       if (r.status === 'Success' && r.text) {
//   //         results.push(r);
//   //       }
//   //     } catch (err) {
//   //       console.log(`❌ STT failed for ${lang}:`, err?.message);
//   //     }
//   //   }

//   //   if (results.length === 0) {
//   //     throw new Error('Recognition failed: NoMatch');
//   //   }

//   //   // ✅ Pick best by confidence (simple + reliable)
//   //   results.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
//   //   const winner = results[0];

//   //   console.log('🏆 STT WINNER:', {
//   //     languageTried: winner.langTried,
//   //     confidence: winner.confidence,
//   //     detectedByText: this.detectLanguageFromText(winner.text),
//   //   });

//   //   return winner.text;
//   // }

//   /**
//    * Detect language from text (for UI display)
//    */
//   detectLanguageFromText(text) {
//     if (!text) return 'en';

//     // Urdu has unique characters
//     if (/[ےںھگپچٹڈڑژ]/.test(text)) {
//       return 'ur';
//     }

//     // Arabic script (but not Urdu)
//     if (/[\u0600-\u06FF]/.test(text)) {
//       return 'ar';
//     }

//     // Default to English
//     return 'en';
//   }

//   async cancelRecording() {
//     try {
//       if (this.isRecording) {
//         console.log('🧹 Canceling recording...');
//         await AudioRecord.stop();
//       }
//     } catch (e) {
//       console.log('⚠️ Cancel error:', e?.message);
//     }
//     this.isRecording = false;
//     return {success: true};
//   }

//   isCurrentlyRecording() {
//     return this.isRecording;
//   }
// }

// const voiceRecordingService = new VoiceRecordingService();
// export default voiceRecordingService;

/* eslint-disable curly */
// services/VoiceRecordingService.js - AZURE SPEECH SDK + REST FALLBACK (RN SAFE)

import AudioRecord from 'react-native-audio-record';
import {PermissionsAndroid, Platform} from 'react-native';
import RNFS from 'react-native-fs';
import {Buffer} from 'buffer';
import {
  AZURE_API_KEY,
  AZURE_SPEECH_REGION,
  AZURE_SPEECH_STT_ENDPOINT,
} from '@env';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

global.Buffer = global.Buffer || Buffer;

class VoiceRecordingService {
  constructor() {
    this.isRecording = false;
    this.startTime = 0;
    this.audioFilePath = null;

    this.token = null;
    this.tokenExpMs = 0;
  }

  /* -------------------- Token -------------------- */
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
    this.tokenExpMs = now + 9 * 60 * 1000; // ~9 minutes
    return this.token;
  }

  /* -------------------- Permissions -------------------- */
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

  /* -------------------- Recording -------------------- */
  async startRecording() {
    if (this.isRecording) {
      console.log('⚠️ Already recording');
      return {success: false, error: 'Already recording'};
    }

    const ok = await this.requestPermission();
    if (!ok) return {success: false, error: 'Permission denied'};

    try {
      console.log('🎤 Starting recording...');

      AudioRecord.init({
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6,
        wavFile: 'speech_recording.wav',
      });

      this.startTime = Date.now();
      this.isRecording = true;

      AudioRecord.start();
      console.log('✅ Recording started');

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
      console.log('🛑 Stopping recording...');

      const filePath = await AudioRecord.stop();
      const duration = (Date.now() - this.startTime) / 1000;
      this.isRecording = false;

      console.log('📁 Audio file:', filePath);
      console.log('⏱️ Duration:', duration);

      if (!filePath || !(await RNFS.exists(filePath))) {
        return {success: false, error: 'Audio file not created', duration};
      }

      const stat = await RNFS.stat(filePath);
      console.log('📦 File size:', stat?.size);

      if (!stat?.size || Number(stat.size) < 2000) {
        return {success: false, error: 'Audio file is too small', duration};
      }

      console.log('🎯 Starting Azure Speech-to-Text...');

      // 1) Try Speech SDK auto-detect (best chance for Urdu)
      // 2) If it fails in RN, fallback to REST en-US (never 400 on ur-PK)
      let text = '';
      let detectedLanguage = 'unknown';
      let methodUsed = 'speechsdk';

      try {
        const sdkRes = await this.azureSpeechToTextSpeechSDK(filePath);
        text = (sdkRes?.text || '').trim();
        detectedLanguage = sdkRes?.language || 'unknown';
        methodUsed = sdkRes?.method || 'speechsdk';
      } catch (sdkErr) {
        console.log('⚠️ Speech SDK failed, falling back to REST en-US...');
        console.log('⚠️ Speech SDK error:', sdkErr?.message);

        methodUsed = 'rest';
        const restText = await this.azureSpeechToTextREST_EN(filePath);
        text = (restText || '').trim();
        detectedLanguage = this.detectLanguageFromText(text);
      }

      if (!text) {
        return {success: false, error: 'No speech detected', duration};
      }

      console.log('✅ Transcription successful:', text);
      console.log('🌍 Detected language:', detectedLanguage);
      console.log('🧠 STT method:', methodUsed);

      return {success: true, text, duration, detectedLanguage, methodUsed};
    } catch (e) {
      this.isRecording = false;
      console.log('❌ stopRecording error:', e?.message);
      return {success: false, error: e?.message || 'Stop failed'};
    }
  }

  /* -------------------- STT (Speech SDK - AutoDetect) -------------------- */
  async azureSpeechToTextSpeechSDK(wavFilePath) {
    const token = await this.getToken();

    // SpeechConfig needs region (not full URL)
    const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
      token,
      AZURE_SPEECH_REGION,
    );

    // Optional: reduce profanity filtering surprises
    // speechConfig.setProfanity(SpeechSDK.ProfanityOption.Raw);

    // Auto-detect between Urdu + Arabic + English
    const autoDetect = SpeechSDK.AutoDetectSourceLanguageConfig.fromLanguages([
      'ur-PK',
      'ar-SA',
      'en-US',
    ]);

    // Read WAV bytes
    const base64Audio = await RNFS.readFile(wavFilePath, 'base64');
    const audioBytes = Buffer.from(base64Audio, 'base64');

    // RN note:
    // The Speech SDK in JS is primarily designed for browsers/Node.
    // In RN, WAV push-stream sometimes fails depending on environment.
    const pushStream = SpeechSDK.AudioInputStream.createPushStream();
    pushStream.write(audioBytes);
    pushStream.close();

    const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(pushStream);

    return await new Promise((resolve, reject) => {
      // ✅ Correct constructor for autodetect:
      // SpeechRecognizer(speechConfig, autoDetectSourceLanguageConfig, audioConfig)
      const recognizer = new SpeechSDK.SpeechRecognizer(
        speechConfig,
        autoDetect,
        audioConfig,
      );

      recognizer.recognizeOnceAsync(
        result => {
          try {
            const reason = result?.reason;
            const text = (result?.text || '').trim();

            if (reason === SpeechSDK.ResultReason.RecognizedSpeech && text) {
              // Extract detected language if available
              let detectedLang = 'unknown';
              try {
                const langResult =
                  SpeechSDK.AutoDetectSourceLanguageResult.fromResult(result);
                detectedLang = langResult?.language || 'unknown';
              } catch (e) {}

              recognizer.close();
              resolve({
                method: 'speechsdk',
                text,
                language: detectedLang,
              });
              return;
            }

            if (reason === SpeechSDK.ResultReason.NoMatch) {
              recognizer.close();
              reject(new Error('Speech SDK NoMatch'));
              return;
            }

            if (reason === SpeechSDK.ResultReason.Canceled) {
              const details = SpeechSDK.CancellationDetails.fromResult(result);
              recognizer.close();
              reject(
                new Error(
                  `Speech SDK canceled: ${details?.reason} ${
                    details?.errorDetails || ''
                  }`.trim(),
                ),
              );
              return;
            }

            recognizer.close();
            reject(new Error(`Speech SDK failed: ${String(reason)}`));
          } catch (err) {
            recognizer.close();
            reject(err);
          }
        },
        err => {
          recognizer.close();
          reject(err);
        },
      );
    });
  }

  /* -------------------- STT (REST fallback - en-US only) -------------------- */
  async azureSpeechToTextREST_EN(wavFilePath) {
    const token = await this.getToken();

    // Use env endpoint if provided, otherwise region endpoint
    const baseEndpoint =
      (AZURE_SPEECH_STT_ENDPOINT || '').replace(/\/+$/, '') ||
      `https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com`;

    // Always en-US (never triggers ur-PK 400)
    const lang = 'en-US';

    const url =
      `${baseEndpoint}` +
      `/speech/recognition/conversation/cognitiveservices/v1` +
      `?language=${encodeURIComponent(lang)}` +
      `&format=detailed` +
      `&profanity=raw`;

    console.log('📤 Sending to Azure STT (REST fallback)...');
    console.log('🌐 Language:', lang);
    console.log('🌐 URL:', url);

    // Read audio file
    const base64Audio = await RNFS.readFile(wavFilePath, 'base64');
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        Accept: 'application/json',
        'Content-Length': String(audioBuffer.length),
      },
      body: audioBuffer,
    });

    const rawText = await response.text();

    if (!response.ok) {
      throw new Error(`Azure STT REST failed (${response.status}): ${rawText}`);
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      throw new Error(`STT JSON parse failed. Raw: ${rawText}`);
    }

    const status = data?.RecognitionStatus;
    const nbest = Array.isArray(data?.NBest) ? data.NBest : [];
    const best = nbest[0] || null;

    const text = (best?.Display || best?.ITN || data?.DisplayText || '').trim();

    const confidence =
      typeof best?.Confidence === 'number' ? best.Confidence : text ? 0.2 : 0;

    console.log('📥 Azure REST response:', {
      status,
      confidence,
      textPreview: (text || '').slice(0, 80),
    });

    if (status !== 'Success') {
      throw new Error(`Recognition failed: ${status || 'Unknown'}`);
    }

    return text;
  }

  /* -------------------- Language Detect (UI only) -------------------- */
  detectLanguageFromText(text) {
    if (!text) return 'en';

    // Urdu has unique chars (not always present though)
    if (/[ےںھگپچٹڈڑژ]/.test(text)) return 'ur';

    // Arabic script range (includes Urdu too, so check Urdu first)
    if (/[\u0600-\u06FF]/.test(text)) return 'ar';

    return 'en';
  }

  /* -------------------- Cancel -------------------- */
  async cancelRecording() {
    try {
      if (this.isRecording) {
        console.log('🧹 Canceling recording...');
        await AudioRecord.stop();
      }
    } catch (e) {
      console.log('⚠️ Cancel error:', e?.message);
    }
    this.isRecording = false;
    return {success: true};
  }

  isCurrentlyRecording() {
    return this.isRecording;
  }
}

const voiceRecordingService = new VoiceRecordingService();
export default voiceRecordingService;
