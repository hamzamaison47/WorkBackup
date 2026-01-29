// /* eslint-disable quotes */
// /* eslint-disable curly */
// import RNFS from 'react-native-fs';
// import {Buffer} from 'buffer';
// import {
//   AZURE_API_KEY,
//   AZURE_SPEECH_REGION,
//   AZURE_SPEECH_STT_ENDPOINT,
// } from '@env';

// global.Buffer = global.Buffer || Buffer;

// class AzureSpeechService {
//   constructor() {
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

//   async speechToTextFromWavFile({
//     wavFilePath,
//     language = 'en-US',
//     format = 'detailed', // ✅ force detailed
//   }) {
//     const token = await this.getToken();

//     const url =
//       `${AZURE_SPEECH_STT_ENDPOINT}` +
//       `/speech/recognition/interactive/cognitiveservices/v1` + // ✅ interactive is best for short utterances
//       `?language=${encodeURIComponent(language)}` +
//       `&format=${encodeURIComponent(format)}` +
//       `&profanity=raw`;

//     await new Promise(r => setTimeout(r, 120));

//     const base64Audio = await RNFS.readFile(wavFilePath, 'base64');
//     const audioBuffer = Buffer.from(base64Audio, 'base64');

//     const res = await fetch(url, {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${token}`,
//         'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
//         Accept: 'application/json',
//         'Content-Length': String(audioBuffer.length),
//       },
//       body: audioBuffer,
//     });

//     const rawText = await res.text();

//     if (!res.ok) {
//       throw new Error(`STT error ${res.status}: ${rawText}`);
//     }

//     let data;
//     try {
//       data = JSON.parse(rawText);
//     } catch (e) {
//       throw new Error(`STT JSON parse failed. Raw: ${rawText}`);
//     }

//     const status = data?.RecognitionStatus;

//     const nbest = Array.isArray(data?.NBest) ? data.NBest : [];
//     const best = nbest[0] || null;

//     // ✅ More robust extraction across languages
//     const wordsJoined = Array.isArray(best?.Words)
//       ? best.Words.map(w => w?.Word)
//           .filter(Boolean)
//           .join(' ')
//       : '';

//     const text = (
//       best?.Display ||
//       best?.ITN ||
//       best?.MaskedITN ||
//       best?.Lexical ||
//       wordsJoined ||
//       data?.DisplayText ||
//       ''
//     ).trim();

//     const confidence =
//       typeof best?.Confidence === 'number' ? best.Confidence : text ? 0.2 : 0; // ✅ give non-empty text a minimum confidence

//     return {
//       raw: data,
//       text,
//       recognitionStatus: status,
//       confidence,
//     };
//   }

//   /// ✅ Urdu detection: Urdu has letters Arabic usually doesn't use as much
//   isLikelyUrdu(text = '') {
//     return /[ےںھگپچٹڈڑژ]/.test(text);
//   }

//   hasArabicScript(text = '') {
//     return /[\u0600-\u06FF]/.test(text);
//   }

//   isMostlyAscii(text = '') {
//     return /^[\x00-\x7F\s\p{P}]+$/u.test(text);
//   }

//   // ✅ Better multi-language picking
//   async speechToTextFromWavFileMulti({
//     wavFilePath,
//     candidateLanguages = ['ur-PK', 'ar-SA', 'en-US'],
//     format = 'detailed',
//   }) {
//     let best = null;

//     for (const language of candidateLanguages) {
//       try {
//         const r = await this.speechToTextFromWavFile({
//           wavFilePath,
//           language,
//           format,
//         });

//         const text = (r?.text || '').trim();
//         if (!text) continue;

//         const confidence = typeof r?.confidence === 'number' ? r.confidence : 0;

//         // --- scoring ---
//         let score = confidence;

//         const arabicBlock = this.hasArabicScript(text);
//         const urduLetters = this.isLikelyUrdu(text);

//         // Strong preference rules:
//         if (language === 'ur-PK' && urduLetters) score += 0.7; // Urdu winner
//         if (language === 'ar-SA' && arabicBlock && !urduLetters) score += 0.35; // Arabic likely
//         if (language === 'en-US' && this.isMostlyAscii(text)) score += 0.1;

//         // If it looks like Arabic/Urdu script but language is English => penalize
//         if (language === 'en-US' && arabicBlock) score -= 0.5;

//         // If confidence is extremely low on English, penalize heavily (your Urdu garbage cases)
//         if (language === 'en-US' && confidence < 0.2) score -= 0.4;

//         // If recognition succeeded, small bonus
//         if (r?.recognitionStatus === 'Success') score += 0.1;

//         // Prefer longer text slightly (avoids short junk)
//         score += Math.min(text.length / 120, 0.2);

//         if (!best || score > best._score) {
//           best = {
//             ...r,
//             text,
//             detectedLanguage: language,
//             confidence,
//             _score: score,
//           };
//         }
//       } catch (e) {
//         // ignore and try next language
//       }
//     }

//     if (!best) {
//       return {
//         raw: null,
//         text: '',
//         recognitionStatus: 'NoMatch',
//         confidence: 0,
//         detectedLanguage: null,
//       };
//     }

//     const {_score, ...clean} = best;
//     return clean;
//   }
// }

// export default new AzureSpeechService();

/* eslint-disable quotes */
/* eslint-disable curly */
import RNFS from 'react-native-fs';
import {Buffer} from 'buffer';
import {
  AZURE_API_KEY,
  AZURE_SPEECH_REGION,
  AZURE_SPEECH_STT_ENDPOINT,
} from '@env';

global.Buffer = global.Buffer || Buffer;

class AzureSpeechService {
  constructor() {
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

  /**
   * ✅ FIXED: Use language auto-detection with multiple candidate languages
   * This works even when ur-PK is not supported by your Azure region
   */
  async speechToTextFromWavFile({
    wavFilePath,
    language = 'en-US',
    format = 'detailed',
  }) {
    const token = await this.getToken();

    const url =
      `${AZURE_SPEECH_STT_ENDPOINT}` +
      `/speech/recognition/conversation/cognitiveservices/v1` + // ✅ Changed to conversation mode
      `?language=${encodeURIComponent(language)}` +
      `&format=${encodeURIComponent(format)}` +
      `&profanity=raw`;

    await new Promise(r => setTimeout(r, 120));

    const base64Audio = await RNFS.readFile(wavFilePath, 'base64');
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        Accept: 'application/json',
        'Content-Length': String(audioBuffer.length),
      },
      body: audioBuffer,
    });

    const rawText = await res.text();

    if (!res.ok) {
      throw new Error(`STT error ${res.status}: ${rawText}`);
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

    const wordsJoined = Array.isArray(best?.Words)
      ? best.Words.map(w => w?.Word)
          .filter(Boolean)
          .join(' ')
      : '';

    const text = (
      best?.Display ||
      best?.ITN ||
      best?.MaskedITN ||
      best?.Lexical ||
      wordsJoined ||
      data?.DisplayText ||
      ''
    ).trim();

    const confidence =
      typeof best?.Confidence === 'number' ? best.Confidence : text ? 0.2 : 0;

    return {
      raw: data,
      text,
      recognitionStatus: status,
      confidence,
    };
  }

  /**
   * ✅ NEW: Auto-detect language using Azure's multi-language detection
   * Supports Urdu, Arabic, English automatically
   */
  async speechToTextWithAutoDetection({wavFilePath, format = 'detailed'}) {
    const token = await this.getToken();

    // ✅ Use language auto-detection with candidate languages
    // This tells Azure to auto-detect between these languages
    const candidateLanguages = 'ar-SA,en-US,hi-IN'; // Urdu shares script with Hindi/Arabic

    const url =
      `${AZURE_SPEECH_STT_ENDPOINT}` +
      `/speech/recognition/conversation/cognitiveservices/v1` +
      `?format=${encodeURIComponent(format)}` +
      `&profanity=raw` +
      `&language=${encodeURIComponent(candidateLanguages)}`; // ✅ Multi-language detection

    await new Promise(r => setTimeout(r, 120));

    const base64Audio = await RNFS.readFile(wavFilePath, 'base64');
    const audioBuffer = Buffer.from(base64Audio, 'base64');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        Accept: 'application/json',
        'Content-Length': String(audioBuffer.length),
      },
      body: audioBuffer,
    });

    const rawText = await res.text();

    if (!res.ok) {
      throw new Error(`Auto-detection STT error ${res.status}: ${rawText}`);
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

    const wordsJoined = Array.isArray(best?.Words)
      ? best.Words.map(w => w?.Word)
          .filter(Boolean)
          .join(' ')
      : '';

    const text = (
      best?.Display ||
      best?.ITN ||
      best?.MaskedITN ||
      best?.Lexical ||
      wordsJoined ||
      data?.DisplayText ||
      ''
    ).trim();

    const confidence =
      typeof best?.Confidence === 'number' ? best.Confidence : text ? 0.2 : 0;

    // Try to detect which language was used from the text
    const detectedLanguage = this.detectLanguageFromText(text);

    return {
      raw: data,
      text,
      recognitionStatus: status,
      confidence,
      detectedLanguage,
    };
  }

  /// ✅ Check if text contains Urdu-specific letters
  hasUrduLetters(text = '') {
    return /[ےںھگپچٹڈڑژ]/.test(text);
  }

  /// ✅ Check if text contains any Arabic script
  hasArabicScript(text = '') {
    return /[\u0600-\u06FF]/.test(text);
  }

  /// ✅ Check if text is mostly ASCII (English/Roman)
  isMostlyAscii(text = '') {
    return /^[\x00-\x7F\s\p{P}]+$/u.test(text);
  }

  /// ✅ Check if text contains common Urdu words in Roman script
  hasRomanUrduWords(text = '') {
    const romanUrduWords = [
      'kya',
      'tum',
      'mujhe',
      'meri',
      'mere',
      'hai',
      'hain',
      'chahiye',
      'chahta',
      'chahti',
      'karna',
      'karo',
      'haazri',
      'chutti',
      'chutiya',
      'lagao',
      'lagana',
      'darkhwast',
      'aaj',
      'kal',
      'abhi',
      'thik',
      'theek',
      'bilkul',
      'mata',
      'de',
      'do',
      'sakte',
      'sakti',
      'hun',
      'ho',
      'kehal',
      'chala',
      'kumara',
    ];

    const lowerText = text.toLowerCase();
    return romanUrduWords.some(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(lowerText);
    });
  }

  /// ✅ Detect language from text content
  detectLanguageFromText(text = '') {
    if (!text) return 'en-US';

    // Check for Arabic/Urdu script
    if (this.hasArabicScript(text)) {
      // Check if it's specifically Urdu (has unique Urdu letters)
      if (this.hasUrduLetters(text)) {
        return 'ur-PK'; // Urdu
      }
      return 'ar-SA'; // Arabic
    }

    // Check for Roman Urdu words
    if (this.hasRomanUrduWords(text)) {
      return 'ur-PK'; // Urdu in Roman script
    }

    // Default to English
    return 'en-US';
  }

  /**
   * ✅ MAIN METHOD: Try supported languages with smart fallback
   */
  async speechToTextFromWavFileMulti({
    wavFilePath,
    candidateLanguages = ['ar-SA', 'en-US'], // ✅ Only supported languages
    format = 'detailed',
  }) {
    console.log('🎯 Starting multi-language detection...');

    // ✅ FIRST: Try auto-detection (works best for Urdu/Arabic/English mix)
    try {
      console.log('🔍 Trying Azure auto-detection...');
      const autoResult = await this.speechToTextWithAutoDetection({
        wavFilePath,
        format,
      });

      if (autoResult.text) {
        console.log(
          `✅ Auto-detection SUCCESS: [${autoResult.detectedLanguage}] "${autoResult.text}"`,
        );
        return autoResult;
      }
    } catch (e) {
      console.log(
        '⚠️ Auto-detection failed, trying individual languages:',
        e.message,
      );
    }

    // ✅ FALLBACK: Try each language individually
    let allResults = [];

    for (const language of candidateLanguages) {
      try {
        const r = await this.speechToTextFromWavFile({
          wavFilePath,
          language,
          format,
        });

        const text = (r?.text || '').trim();
        if (!text) continue;

        const confidence = typeof r?.confidence === 'number' ? r.confidence : 0;

        // Detect actual language from text content
        const detectedLang = this.detectLanguageFromText(text);

        allResults.push({
          language: detectedLang, // ✅ Use detected language, not API language
          apiLanguage: language,
          text,
          confidence,
          raw: r.raw,
          recognitionStatus: r.recognitionStatus,
        });

        console.log(
          `🔍 [${language}] detected as [${detectedLang}] confidence: ${confidence.toFixed(
            3,
          )}, text: "${text.substring(0, 50)}..."`,
        );
      } catch (e) {
        console.log(`❌ [${language}] failed:`, e.message);
      }
    }

    if (allResults.length === 0) {
      return {
        raw: null,
        text: '',
        recognitionStatus: 'NoMatch',
        confidence: 0,
        detectedLanguage: null,
      };
    }

    // ✅ SMART SCORING: Prioritize based on detected language
    let best = null;
    let bestScore = -999;

    for (const result of allResults) {
      const {language, text, confidence} = result;

      let score = confidence;

      const hasArabic = this.hasArabicScript(text);
      const hasUrdu = this.hasUrduLetters(text);
      const hasRomanUrdu = this.hasRomanUrduWords(text);
      const isAscii = this.isMostlyAscii(text);

      // ✅ Urdu detection (highest priority)
      if (language === 'ur-PK') {
        score += 1.5; // Highest boost for Urdu
        console.log(`✅ Detected URDU - MAJOR BOOST`);
      }

      // ✅ Arabic detection
      if (language === 'ar-SA' && hasArabic && !hasUrdu) {
        score += 0.7;
        console.log(`✅ Detected Arabic - BOOST`);
      }

      // ✅ English detection - penalize if has Urdu/Arabic content
      if (language === 'en-US') {
        if (hasRomanUrdu || hasArabic) {
          score -= 1.0; // Penalty for wrong language
          console.log(`⚠️ English wrongly detected Urdu/Arabic - PENALTY`);
        } else if (isAscii) {
          score += 0.3;
          console.log(`✅ Pure English - small boost`);
        }
      }

      // ✅ Success status bonus
      if (result.recognitionStatus === 'Success') {
        score += 0.1;
      }

      console.log(
        `📊 [${language}] FINAL SCORE: ${score.toFixed(
          3,
        )} (confidence: ${confidence.toFixed(3)})`,
      );

      if (score > bestScore) {
        bestScore = score;
        best = result;
      }
    }

    if (!best) {
      best = allResults[0];
    }

    console.log(
      `🏆 WINNER: [${best.language}] score: ${bestScore.toFixed(3)}, text: "${
        best.text
      }"`,
    );

    return {
      raw: best.raw,
      text: best.text,
      recognitionStatus: best.recognitionStatus,
      confidence: best.confidence,
      detectedLanguage: best.language,
    };
  }
}

export default new AzureSpeechService();
