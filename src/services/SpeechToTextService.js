// services/SpeechToTextService.js
import {fetch} from 'react-native';
import {getAzureAIConfig} from './SecureConfigService';

class SpeechToTextService {
  constructor() {
    this.config = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.config = await getAzureAIConfig();
      this.initialized = true;
      console.log('✅ Speech service initialized');
    } catch (error) {
      console.error('❌ Speech service init failed:', error);
      throw error;
    }
  }

  /**
   * Convert speech to text using Azure OpenAI Whisper
   * Supports automatic language detection (English, Urdu, Arabic)
   */
  async transcribeAudio({audioBase64, detectedLanguage = 'auto'}) {
    await this.initialize();

    try {
      console.log('🎤 Transcribing audio...');

      // Azure OpenAI Whisper endpoint
      const url = `${this.config.endpoint}/openai/deployments/whisper/audio/transcriptions?api-version=2024-06-01`;

      // Create FormData
      const formData = new FormData();
      const audioFile = this.base64ToBlob(audioBase64, 'audio/mp3');
      formData.append('file', audioFile);

      // Add response format
      formData.append('response_format', 'json');

      // Language parameter (optional)
      if (detectedLanguage && detectedLanguage !== 'auto') {
        const languageMap = {
          en: 'en',
          ur: 'ur',
          ar: 'ar',
        };
        const langCode = languageMap[detectedLanguage] || 'en';
        formData.append('language', langCode);
        console.log(
          `🌐 Setting language to: ${langCode} (${detectedLanguage})`,
        );
      }

      // Prompt parameter (optional - can improve accuracy for specific domains)
      formData.append(
        'prompt',
        'Transcribe this voice message about leave requests, attendance, or employee queries.',
      );

      console.log('📤 Sending to Whisper API...');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'api-key': this.config.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Whisper API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(
          `Whisper API failed: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();

      console.log('✅ Transcription successful:', {
        text: result.text?.substring(0, 100) + '...',
        language: result.language,
        duration: result.duration,
      });

      return {
        success: true,
        text: result.text,
        language: result.language || detectedLanguage,
        duration: result.duration,
      };
    } catch (error) {
      console.error('❌ Transcription error:', error.message || error);

      // Fallback to simple recognition
      return this.fallbackTranscription(audioBase64);
    }
  }
  //   /**
  //    * Convert speech to text using Azure OpenAI Whisper
  //    * Supports automatic language detection (English, Urdu, Arabic)
  //    */
  //   async transcribeAudio({audioBase64, detectedLanguage = 'auto'}) {
  //     await this.initialize();

  //     try {
  //       console.log('🎤 Transcribing audio...');

  //       // Azure OpenAI Whisper endpoint
  //       const url = `${this.config.endpoint}/openai/deployments/whisper/audio/transcriptions?api-version=2024-06-01`;

  //       // Convert base64 to blob
  //       const audioBlob = this.base64ToBlob(audioBase64, 'audio/mp3');

  //       // Create FormData
  //       const formData = new FormData();
  //       formData.append('file', {
  //         uri: audioBlob,
  //         type: 'audio/mp3',
  //         name: 'recording.mp3',
  //       });

  //       // Language parameter (optional)
  //       if (detectedLanguage && detectedLanguage !== 'auto') {
  //         const languageMap = {
  //           en: 'en',
  //           ur: 'ur',
  //           ar: 'ar',
  //         };
  //         formData.append('language', languageMap[detectedLanguage] || 'en');
  //       }

  //       const response = await fetch(url, {
  //         method: 'POST',
  //         headers: {
  //           'api-key': this.config.apiKey,
  //         },
  //         body: formData,
  //       });

  //       if (!response.ok) {
  //         const error = await response.text();
  //         console.error('Transcription error:', error);
  //         throw new Error('Transcription failed');
  //       }

  //       const result = await response.json();

  //       console.log('✅ Transcription successful:', {
  //         text: result.text?.substring(0, 50) + '...',
  //         language: result.language,
  //       });

  //       return {
  //         success: true,
  //         text: result.text,
  //         language: result.language || detectedLanguage,
  //       };
  //     } catch (error) {
  //       console.error('❌ Transcription error:', error);

  //       // Fallback to simple recognition
  //       return this.fallbackTranscription(audioBase64);
  //     }
  //   }

  /**
   * Fallback: Use simpler speech recognition
   */
  async fallbackTranscription(audioBase64) {
    try {
      console.log('⚠️ Using fallback transcription');

      // For now, return a message indicating manual speech recognition is needed
      // You can integrate Google Cloud Speech-to-Text or other services here

      return {
        success: false,
        error:
          'Speech recognition temporarily unavailable. Please type your message.',
        fallback: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Detect spoken language from audio
   */
  async detectLanguage(audioBase64) {
    try {
      // First transcribe with auto-detection
      const result = await this.transcribeAudio({
        audioBase64,
        detectedLanguage: 'auto',
      });

      if (result.success && result.language) {
        return {
          success: true,
          language: result.language,
          text: result.text,
        };
      }

      // Fallback language detection
      return this.detectLanguageFromText(result.text || '');
    } catch (error) {
      console.error('Language detection error:', error);
      return {success: false, language: 'en'};
    }
  }

  /**
   * Detect language from text
   */
  detectLanguageFromText(text) {
    if (!text) return {success: false, language: 'en'};

    // Check for Urdu characters
    const urduRegex = /[\u0600-\u06FF]/;
    if (urduRegex.test(text)) {
      return {success: true, language: 'ur', confidence: 0.9};
    }

    // Check for Arabic characters
    const arabicRegex = /[\u0750-\u077F]/;
    if (arabicRegex.test(text)) {
      return {success: true, language: 'ar', confidence: 0.9};
    }

    // Default to English
    return {success: true, language: 'en', confidence: 0.7};
  }

  /**
   * Helper: Convert base64 to blob for React Native FormData
   */
  base64ToBlob(base64, mimeType) {
    try {
      // Check if base64 already has data URI prefix
      if (base64.startsWith('data:')) {
        return {
          uri: base64,
          type: mimeType,
          name: 'recording.mp3',
        };
      } else {
        return {
          uri: `data:${mimeType};base64,${base64}`,
          type: mimeType,
          name: 'recording.mp3',
        };
      }
    } catch (error) {
      console.error('❌ base64ToBlob error:', error);
      return {
        uri: '',
        type: mimeType,
        name: 'recording.mp3',
      };
    }
  }
  //   /**
  //    * Helper: Convert base64 to blob
  //    */
  //   base64ToBlob(base64, mimeType) {
  //     const byteCharacters = atob(base64);
  //     const byteNumbers = new Array(byteCharacters.length);

  //     for (let i = 0; i < byteCharacters.length; i++) {
  //       byteNumbers[i] = byteCharacters.charCodeAt(i);
  //     }

  //     const byteArray = new Uint8Array(byteNumbers);
  //     return new Blob([byteArray], {type: mimeType});
  //   }

  /**
   * Translate text to target language using AI
   */
  async translateText({text, fromLanguage, toLanguage}) {
    await this.initialize();

    if (fromLanguage === toLanguage) {
      return {success: true, translatedText: text, fromLanguage, toLanguage};
    }

    try {
      const languageNames = {
        en: 'English',
        ur: 'Urdu',
        ar: 'Arabic',
      };

      const prompt = `Translate the following text from ${languageNames[fromLanguage]} to ${languageNames[toLanguage]}.

Original text: "${text}"

Provide ONLY the translation, no explanations.`;

      const url = `${this.config.endpoint}/openai/deployments/${this.config.deployment}/chat/completions?api-version=${this.config.apiVersion}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          messages: [{role: 'user', content: prompt}],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      const translatedText = data.choices[0].message.content.trim();

      console.log('🌍 Translation:', {
        from: fromLanguage,
        to: toLanguage,
        original: text.substring(0, 30) + '...',
        translated: translatedText.substring(0, 30) + '...',
      });

      return {
        success: true,
        translatedText,
        fromLanguage,
        toLanguage,
      };
    } catch (error) {
      console.error('❌ Translation error:', error);
      return {
        success: false,
        error: error.message,
        translatedText: text, // Return original if translation fails
      };
    }
  }
}

export default new SpeechToTextService();
