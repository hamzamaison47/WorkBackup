// /* eslint-disable curly */
// // services/AzureAIService.js
// import {getAzureAIConfig} from './SecureConfigService';

// class AzureAIService {
//   constructor() {
//     this.config = null;
//     this.initialized = false;
//   }

//   async initialize() {
//     if (this.initialized) return;

//     try {
//       this.config = await getAzureAIConfig();

//       if (!this.config?.apiKey) {
//         throw new Error('Azure API Key missing');
//       }

//       this.initialized = true;
//       console.log('✅ Azure AI initialized');
//     } catch (error) {
//       console.error('❌ Azure init failed:', error.message);
//       throw error;
//     }
//   }

//   async ensureInitialized() {
//     if (!this.initialized) {
//       await this.initialize();
//     }
//   }

//   /**
//    * Enhanced system prompt with dynamic language handling
//    */
//   buildSystemPrompt(userData, language, availableFunctions) {
//     // If language is 'auto', tell AI to detect language
//     const languageInstruction =
//       language === 'auto'
//         ? "Detect the user's language from their message and respond in the same language (English, Urdu, or Arabic)."
//         : `Respond in ${
//             language === 'en'
//               ? 'English'
//               : language === 'ur'
//               ? 'Urdu (اردو)'
//               : 'Arabic (العربية)'
//           }`;

//     const functionDescriptions = availableFunctions
//       .map(fn => `- ${fn.name}: ${fn.description}`)
//       .join('\n');

//     return `You are Dynaface HR Assistant - an intelligent, multilingual assistant.

//       EMPLOYEE CONTEXT:
//       - Employee ID: ${userData?.employeeId || 'Unknown'}
//       - Employee Name: ${userData?.employeeName || 'Unknown'}
//       - Worker RecID: ${userData?.WorkerRecId || 'Unknown'}

//       NAVIGATION RULES:
//       1. When user wants to mark attendance, you MUST call the navigate_to_screen function
//       2. When user wants to view leaves list, you MUST call the navigate_to_screen function
//       3. When user wants to apply for leave, you can guide them through the process first

//       AVAILABLE NAVIGATIONS:
//       - navigate_to_screen("CreateAttendanceScreen"): For marking attendance
//       - navigate_to_screen("LeavesListPage"): For viewing leaves
//       - navigate_to_screen("ApplyLeave"): For applying for leave (if available)

//       RESPONSE STRATEGY:
//       1. If user wants to mark attendance → Call navigate_to_screen("CreateAttendanceScreen") and show a message
//       2. If user wants to view leaves → Call navigate_to_screen("LeavesListPage") and show a message
//       3. If user wants to apply for leave → Guide through process, then optionally navigate

//       LANGUAGE HANDLING: ${languageInstruction}
//       IMPORTANT: Detect the user's language from their message and respond in the SAME language.
//       Supported languages: English, Urdu, Arabic.

//       AVAILABLE FUNCTIONS:
//       ${functionDescriptions}

//       MULTILINGUAL SUPPORT:
//       1. Detect user's language automatically
//       2. Understand:
//         - English: "mark attendance", "apply for leave"
//         - Urdu: "حاضری لگائیں", "چھٹی کی درخواست دیں"
//         - Arabic: "سجل الحضور", "قدم طلب إجازة"
//         - Roman Urdu: "haazri lagao", "chutti ki darkhwast"
//       3. Respond in the same language as the user's message
//       4. Handle code-mixing (e.g., "میں leave apply karna chahta hun")

//       INTELLIGENCE RULES:
//       1. **Language Detection**: Automatically detect if user is speaking English, Urdu, or Arabic
//       2. **Code-Switching**: Handle mixed language inputs
//       3. **Script Flexibility**: Understand Urdu in Arabic script and Roman Urdu
//       4. **Synonyms Across Languages**: "attendance" = "حاضری" = "حضور"
//       5. **Natural Responses**: Respond naturally in user's preferred language

//       CONVERSATION GUIDELINES:
//       1. Detect language from first user message
//       2. Continue conversation in that language
//       3. If user switches language, follow their lead
//       4. Handle Roman Urdu (Urdu written in English letters)
//       5. Be culturally appropriate for each language

//       DATE UNDERSTANDING (All Languages):
//       - English: "today", "tomorrow", "next week"
//       - Urdu: "آج", "کل", "اگلے ہفتے"
//       - Arabic: "اليوم", "غداً", "الأسبوع القادم"
//       - Roman Urdu: "aaj", "kal", "aglay haftay"

//       NUMBER UNDERSTANDING (All Languages):
//       - English: "one", "two", "three"
//       - Urdu: "ایک", "دو", "تین"
//       - Arabic: "واحد", "اثنان", "ثلاثة"
//       - Roman Urdu: "ek", "do", "teen"

//       ATTENDANCE INTENTS (Recognize in all languages):
//       - English: "mark attendance", "I want to check in"
//       - Urdu: "حاضری لگائیں", "میں حاضری لگانا چاہتا ہوں"
//       - Arabic: "سجل الحضور", "أريد تسجيل الحضور"
//       - Roman Urdu: "haazri lagao", "mein haazri lagana chahta hun"

//       LEAVE INTENTS (Recognize in all languages):
//       - English: "apply for leave", "sick leave"
//       - Urdu: "چھٹی کی درخواست دیں", "سک لیو"
//       - Arabic: "قدم طلب إجازة", "إجازة مرضية"
//       - Roman Urdu: "chutti ki darkhwast do", "sick leave"

//       REMEMBER: You're a multilingual assistant. Be smart about language detection and code-switching.`;
//   }
//   /**
//    * Enhanced system prompt with better context understanding
//    */
//   //   buildSystemPrompt(userData, language, availableFunctions) {
//   //     const languageInstructions = {
//   //       en: 'Respond in English',
//   //       ur: 'Respond in Urdu (اردو میں جواب دیں)',
//   //       ar: 'Respond in Arabic (الرد باللغة العربية)',
//   //     };

//   //     const functionDescriptions = availableFunctions
//   //       .map(fn => `- ${fn.name}: ${fn.description}`)
//   //       .join('\n');

//   //     return `You are Dynaface HR Assistant - an intelligent, context-aware assistant.

//   // EMPLOYEE CONTEXT:
//   // - Employee ID: ${userData?.employeeId || 'Unknown'}
//   // - Employee Name: ${userData?.employeeName || 'Unknown'}
//   // - Worker RecID: ${userData?.WorkerRecId || 'Unknown'}

//   // LANGUAGE: ${languageInstructions[language] || languageInstructions.en}

//   // AVAILABLE FUNCTIONS:
//   // ${functionDescriptions}

//   // INTELLIGENCE RULES:
//   // 1. **Case Insensitive**: Understand user input regardless of capitalization
//   // 2. **Homonyms & Synonyms**: Recognize variations like "leave" = "time off" = "vacation"
//   // 3. **Fuzzy Matching**: Handle typos and partial words
//   // 4. **Context Awareness**: Remember conversation history and infer missing information
//   // 5. **Smart Parameter Extraction**: Extract dates, numbers, and entities from natural language
//   // 6. **Error Recovery**: If a function call fails, analyze the error and ask for missing parameters
//   // 7. **Progressive Disclosure**: Start with minimal required parameters, ask for more if needed

//   // CONVERSATION GUIDELINES:
//   // 1. Be conversational and natural
//   // 2. Don't ask for information you can infer from context
//   // 3. If user says "leave" without specifics, ask clarifying questions
//   // 4. Extract structured data from unstructured input (e.g., "tomorrow" → actual date)
//   // 5. Handle variations: "check balance" = "how many leaves" = "leave balance" = "balance check"
//   // 6. Use functions to get real data - NEVER make up information
//   // 7. If a function fails, interpret the error and guide the user

//   // FUNCTION CALLING STRATEGY:
//   // 1. Try calling functions with available parameters
//   // 2. If error occurs, parse the error message for missing fields
//   // 3. Ask user ONLY for the specific missing fields
//   // 4. Retry the function call once all required parameters are collected
//   // 5. For optional parameters, proceed without them unless user mentions them

//   // DATE UNDERSTANDING:
//   // - "today" → current date
//   // - "tomorrow" → current date + 1 day
//   // - "next Monday" → next occurrence of Monday
//   // - "15th" or "15" → 15th of current month
//   // - Handle formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, natural language

//   // NUMBER UNDERSTANDING:
//   // - "one", "1", "first" all mean the same
//   // - Handle spelled numbers in English, Urdu, Arabic
//   // - Understand ordinals: "first", "second", etc.

//   // ERROR HANDLING:
//   // When a function returns an error:
//   // 1. Parse the error message
//   // 2. Identify what's missing or invalid
//   // 3. Ask user for the specific information needed
//   // 4. Keep the conversation flowing naturally

//   // REMEMBER: You're having a conversation, not filling a form. Be intelligent and helpful.`;
//   //   }

//   /**
//    * Build message array with enhanced context
//    */
//   buildMessages(systemPrompt, history, currentMessage) {
//     const messages = [{role: 'system', content: systemPrompt}];

//     // Add conversation history (last 10 messages for context)
//     const recentHistory = history.slice(-10);
//     recentHistory.forEach(msg => {
//       messages.push({
//         role: msg.from === 'user' ? 'user' : 'assistant',
//         content: msg.text,
//       });
//     });

//     // Add current message
//     if (currentMessage) {
//       messages.push({role: 'user', content: currentMessage});
//     }

//     return messages;
//   }

//   /**
//    * Main AI conversation method with enhanced intelligence
//    */
//   async chat({
//     userMessage,
//     conversationHistory = [],
//     availableFunctions = [],
//     userData = {},
//     preferredLanguage = 'en',
//   }) {
//     await this.ensureInitialized();

//     const systemPrompt = this.buildSystemPrompt(
//       userData,
//       preferredLanguage,
//       availableFunctions,
//     );
//     const messages = this.buildMessages(
//       systemPrompt,
//       conversationHistory,
//       userMessage,
//     );

//     try {
//       const response = await this.callOpenAI(messages, availableFunctions);
//       return this.processResponse(response);
//     } catch (error) {
//       console.error('❌ Chat error:', error);
//       throw error;
//     }
//   }

//   /**
//    * Enhanced OpenAI API call with better error handling
//    */
//   async callOpenAI(messages, functions, retryCount = 0) {
//     const url = `${this.config.endpoint}/openai/deployments/${this.config.deployment}/chat/completions?api-version=${this.config.apiVersion}`;

//     const body = {
//       messages,
//       temperature: 0.7,
//       max_tokens: 1500,
//       top_p: 0.95,
//       frequency_penalty: 0,
//       presence_penalty: 0,
//     };

//     // Add functions with proper schema
//     if (functions && functions.length > 0) {
//       body.tools = functions.map(fn => ({
//         type: 'function',
//         function: {
//           name: fn.name,
//           description: fn.description,
//           parameters: fn.parameters,
//         },
//       }));
//       body.tool_choice = 'auto';
//     }

//     try {
//       const response = await fetch(url, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'api-key': this.config.apiKey,
//         },
//         body: JSON.stringify(body),
//       });

//       if (!response.ok) {
//         const error = await response.text();
//         console.error('API Error:', error);

//         // Retry logic for transient errors
//         if (
//           retryCount < 2 &&
//           (response.status === 429 || response.status >= 500)
//         ) {
//           console.log(`Retrying... Attempt ${retryCount + 1}`);
//           await new Promise(resolve =>
//             setTimeout(resolve, 1000 * (retryCount + 1)),
//           );
//           return this.callOpenAI(messages, functions, retryCount + 1);
//         }

//         throw new Error(`AI service error: ${response.status}`);
//       }

//       return response.json();
//     } catch (error) {
//       console.error('❌ API call failed:', error);
//       throw error;
//     }
//   }

//   /**
//    * Enhanced response processing
//    */
//   processResponse(data) {
//     const message = data.choices[0].message;

//     // Check if AI wants to call a function (new tool_calls format)
//     if (message.tool_calls && message.tool_calls.length > 0) {
//       const toolCall = message.tool_calls[0];
//       let parameters = {};

//       try {
//         parameters = JSON.parse(toolCall.function.arguments);
//       } catch (e) {
//         console.error('Failed to parse function args:', e);
//       }

//       return {
//         type: 'function_call',
//         function: toolCall.function.name,
//         parameters,
//         thinking: message.content || '',
//         toolCallId: toolCall.id,
//       };
//     }

//     // Check legacy function_call format
//     if (message.function_call) {
//       let parameters = {};
//       try {
//         parameters = JSON.parse(message.function_call.arguments);
//       } catch (e) {
//         console.error('Failed to parse function args:', e);
//       }

//       return {
//         type: 'function_call',
//         function: message.function_call.name,
//         parameters,
//         thinking: message.content || '',
//       };
//     }

//     // Regular text response
//     return {
//       type: 'message',
//       text: message.content,
//     };
//   }

//   /**
//    * Continue conversation after function execution with error handling
//    */
//   async continueAfterFunction({
//     previousMessages,
//     functionName,
//     functionResult,
//     userData,
//     preferredLanguage,
//     availableFunctions = [],
//     toolCallId = null,
//   }) {
//     await this.ensureInitialized();

//     const systemPrompt = this.buildSystemPrompt(
//       userData,
//       preferredLanguage,
//       availableFunctions,
//     );
//     const messages = this.buildMessages(systemPrompt, previousMessages, '');

//     // Add function call and result
//     if (toolCallId) {
//       // New tool_calls format
//       messages.push({
//         role: 'assistant',
//         content: null,
//         tool_calls: [
//           {
//             id: toolCallId,
//             type: 'function',
//             function: {
//               name: functionName,
//               arguments: JSON.stringify(functionResult.parameters || {}),
//             },
//           },
//         ],
//       });

//       messages.push({
//         role: 'tool',
//         tool_call_id: toolCallId,
//         content: JSON.stringify(functionResult),
//       });
//     } else {
//       // Legacy function_call format
//       messages.push({
//         role: 'assistant',
//         content: null,
//         function_call: {
//           name: functionName,
//           arguments: JSON.stringify(functionResult.parameters || {}),
//         },
//       });

//       messages.push({
//         role: 'function',
//         name: functionName,
//         content: JSON.stringify(functionResult),
//       });
//     }

//     try {
//       const response = await this.callOpenAI(messages, availableFunctions);
//       return this.processResponse(response);
//     } catch (error) {
//       console.error('❌ Continue error:', error);
//       throw error;
//     }
//   }

//   /**
//    * Extract structured data from natural language
//    */
//   async extractStructuredData({text, schema, language = 'en'}) {
//     await this.ensureInitialized();

//     const prompt = `Extract structured data from the following text according to the schema.

// Text: "${text}"

// Schema: ${JSON.stringify(schema, null, 2)}

// Return ONLY a valid JSON object matching the schema. If a field is not mentioned, use null.
// Be smart about dates - convert "tomorrow", "next week", etc. to actual dates.
// Handle numbers in any format (words, digits, etc.).

// Response (JSON only):`;

//     try {
//       const response = await this.callOpenAI(
//         [{role: 'user', content: prompt}],
//         [],
//       );

//       const result = this.processResponse(response);
//       return JSON.parse(result.text);
//     } catch (error) {
//       console.error('❌ Data extraction error:', error);
//       return null;
//     }
//   }
// }

// const azureAIService = new AzureAIService();
// export default azureAIService;

/* eslint-disable curly */
// services/AzureAIService.js
import {getAzureAIConfig} from './SecureConfigService';

class AzureAIService {
  constructor() {
    this.config = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.config = await getAzureAIConfig();

      if (!this.config?.apiKey) {
        throw new Error('Azure API Key missing');
      }

      this.initialized = true;
      console.log('✅ Azure AI initialized');
    } catch (error) {
      console.error('❌ Azure init failed:', error.message);
      throw error;
    }
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * ✅ Voice STT normalizer:
   * - Input: STT text (often en-US output)
   * - Output: Either cleaned English OR Roman Urdu (Urdu in English letters)
   *
   * Returns:
   * { preferredLanguage: "ur-roman" | "en", text: "..." }
   */
  async normalizeVoiceText({sttText}) {
    await this.ensureInitialized();

    const safeText = String(sttText || '').slice(0, 800);

    const prompt = `
You are a voice transcription normalizer for a Pakistani HR chatbot.

The input text comes from an English (en-US) speech-to-text system.
The user may have spoken Urdu. When Urdu is spoken, the STT often returns broken English-like words.
Your job:
1) Decide whether the intended language is Urdu or English.
2) If Urdu, convert the intended meaning into Roman Urdu (Urdu words written in English letters).
3) If English, lightly clean it and keep English.
4) Keep the final text short and conversational.

Return ONLY valid JSON in exactly this schema:
{
  "preferredLanguage": "ur-roman" | "en",
  "text": "..."
}

Rules:
- If you output Urdu, it MUST be Roman Urdu (English letters only). Do NOT use اردو script.
- If the input is unclear, make the best guess based on common HR intents:
  attendance/hazri/check-in, leave/chutti, apply, today/aaj, tomorrow/kal, sick/beemari.
- Never add extra fields. Never add markdown. JSON only.

STT text: "${safeText}"
`;

    try {
      const response = await this.callOpenAI(
        [{role: 'user', content: prompt}],
        [],
      );
      const content = response?.choices?.[0]?.message?.content || '';

      try {
        const parsed = JSON.parse(content);
        const preferredLanguage =
          parsed?.preferredLanguage === 'ur-roman' ? 'ur-roman' : 'en';
        const text = String(parsed?.text || safeText).trim();
        return {preferredLanguage, text};
      } catch (jsonErr) {
        // Fallback if model doesn't return JSON
        return {preferredLanguage: 'en', text: safeText};
      }
    } catch (err) {
      console.error('❌ normalizeVoiceText error:', err?.message);
      return {preferredLanguage: 'en', text: safeText};
    }
  }

  /**
   * Enhanced system prompt with dynamic language handling
   * ✅ SUPPORTS: Native Urdu (اردو), Roman Urdu (English letters), Arabic, English
   */
  buildSystemPrompt(userData, language, availableFunctions) {
    const languageInstruction =
      language === 'auto'
        ? "Detect the user's language from their message and respond in the SAME language and script. Support: English, Urdu (native اردو script), Roman Urdu (Urdu words in English letters), and Arabic."
        : `Respond in ${
            language === 'en'
              ? 'English'
              : language === 'ur'
              ? 'Urdu (اردو)'
              : 'Arabic (العربية)'
          }`;

    const functionDescriptions = availableFunctions
      .map(fn => `- ${fn.name}: ${fn.description}`)
      .join('\n');

    return `You are Dynaface HR Assistant - an intelligent, multilingual assistant.

      EMPLOYEE CONTEXT:
      - Employee ID: ${userData?.employeeId || 'Unknown'}
      - Employee Name: ${userData?.employeeName || 'Unknown'}
      - Worker RecID: ${userData?.WorkerRecId || 'Unknown'}

      NAVIGATION RULES:
      1. When user wants to mark attendance, you MUST call the navigate_to_screen function
      2. When user wants to view leaves list, you MUST call the navigate_to_screen function
      3. When user wants to apply for leave, you can guide them through the process first

      AVAILABLE NAVIGATIONS:
      - navigate_to_screen("CreateAttendanceScreen"): For marking attendance
      - navigate_to_screen("LeavesListPage"): For viewing leaves
      - navigate_to_screen("ApplyLeave"): For applying for leave (if available)

      RESPONSE STRATEGY:
      1. If user wants to mark attendance → Call navigate_to_screen("CreateAttendanceScreen") and show a message
      2. If user wants to view leaves → Call navigate_to_screen("LeavesListPage") and show a message
      3. If user wants to apply for leave → Guide through process, then optionally navigate

      LANGUAGE HANDLING: ${languageInstruction}
      
      CRITICAL LANGUAGE RULES:
      1. **Auto-detect language and script from user input**
      2. **ALWAYS respond in the SAME language and script as the user**
      3. **Support THREE Urdu formats:**
         a) Native Urdu Script (اردو): User types "حاضری لگائیں" → Respond in اردو
         b) Roman Urdu (English letters): User types "haazri lagao" → Respond in Roman Urdu
         c) Mixed (Code-switching): User types "mujhe leave chahiye" → Match their style
      4. **For Arabic**: Respond in Arabic script (العربية)
      5. **For English**: Respond in English

      URDU LANGUAGE INTELLIGENCE:
      - **Native Urdu Detection**: If message contains اردو script (Unicode range \\u0600-\\u06FF with ے ں ھ گ پ چ ٹ ڈ ڑ ژ) → Respond in native اردو
      - **Roman Urdu Detection**: If message uses Roman letters but Urdu words (haazri, chutti, lagao, karna, chahta) → Respond in Roman Urdu
      - **Code-mixing**: If message mixes English and Urdu → Match their mixing pattern
      
      EXAMPLES OF LANGUAGE MATCHING:
      
      Native Urdu Input:
      User: "میں آج حاضری لگانا چاہتا ہوں"
      Assistant: "بالکل! میں آپ کو حاضری اسکرین پر لے جاتا ہوں۔" (Native اردو)
      
      Roman Urdu Input:
      User: "mujhe aaj haazri lagani hai"
      Assistant: "Bilkul! Main aapko attendance screen par le jata hun." (Roman Urdu)
      
      English Input:
      User: "I want to mark my attendance"
      Assistant: "Sure! Taking you to the attendance screen." (English)
      
      Code-Mixed Input:
      User: "mujhe leave apply karna hai"
      Assistant: "Theek hai! Aap konsi leave apply karna chahte hain?" (Same code-mixing style)

      MULTILINGUAL SUPPORT:
      1. Detect user's language automatically
      2. Understand: 
        - English: "mark attendance", "apply for leave"
        - Native Urdu: "حاضری لگائیں", "چھٹی کی درخواست دیں"
        - Roman Urdu: "haazri lagao", "chutti ki darkhwast do"
        - Arabic: "سجل الحضور", "قدم طلب إجازة"
      3. **ALWAYS respond in the SAME language/script as user's input**
      4. Handle code-mixing naturally (e.g., "میں leave apply karna chahta hun")

      AVAILABLE FUNCTIONS:
      ${functionDescriptions}

      INTELLIGENCE RULES:
      1. **Language Detection**: Automatically detect if user is speaking English, Urdu (native or Roman), or Arabic
      2. **Script Matching**: If user uses اردو script, respond in اردو. If user uses Roman letters with Urdu words, respond in Roman Urdu
      3. **Code-Switching**: Handle mixed language inputs naturally
      4. **Synonyms Across Languages**: 
         - Attendance = حاضری (haazri)
         - Leave = چھٹی (chutti)
         - Apply = درخواست دینا (darkhwast dena / lagana)
      5. **Natural Responses**: Respond naturally in user's preferred language/script

      CONVERSATION GUIDELINES:
      1. Detect language from first user message
      2. Continue conversation in that language/script
      3. If user switches language/script, follow their lead
      4. Be culturally appropriate for each language

      REMEMBER: You're a multilingual assistant. Detect the user's language/script and respond in THE SAME format they used.`;
  }

  buildMessages(systemPrompt, history, currentMessage) {
    const messages = [{role: 'system', content: systemPrompt}];

    const recentHistory = history.slice(-10);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.from === 'user' ? 'user' : 'assistant',
        content: msg.text,
      });
    });

    if (currentMessage) {
      messages.push({role: 'user', content: currentMessage});
    }

    return messages;
  }

  async chat({
    userMessage,
    conversationHistory = [],
    availableFunctions = [],
    userData = {},
    preferredLanguage = 'en',
  }) {
    await this.ensureInitialized();

    const systemPrompt = this.buildSystemPrompt(
      userData,
      preferredLanguage,
      availableFunctions,
    );

    const messages = this.buildMessages(
      systemPrompt,
      conversationHistory,
      userMessage,
    );

    try {
      const response = await this.callOpenAI(messages, availableFunctions);
      return this.processResponse(response);
    } catch (error) {
      console.error('❌ Chat error:', error);
      throw error;
    }
  }

  async callOpenAI(messages, functions, retryCount = 0) {
    const url = `${this.config.endpoint}/openai/deployments/${this.config.deployment}/chat/completions?api-version=${this.config.apiVersion}`;

    const body = {
      messages,
      temperature: 0.7,
      max_tokens: 1500,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0,
    };

    if (functions && functions.length > 0) {
      body.tools = functions.map(fn => ({
        type: 'function',
        function: {
          name: fn.name,
          description: fn.description,
          parameters: fn.parameters,
        },
      }));
      body.tool_choice = 'auto';
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('API Error:', error);

        if (
          retryCount < 2 &&
          (response.status === 429 || response.status >= 500)
        ) {
          console.log(`Retrying... Attempt ${retryCount + 1}`);
          await new Promise(resolve =>
            setTimeout(resolve, 1000 * (retryCount + 1)),
          );
          return this.callOpenAI(messages, functions, retryCount + 1);
        }

        throw new Error(`AI service error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('❌ API call failed:', error);
      throw error;
    }
  }

  processResponse(data) {
    const message = data.choices[0].message;

    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      let parameters = {};

      try {
        parameters = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error('Failed to parse function args:', e);
      }

      return {
        type: 'function_call',
        function: toolCall.function.name,
        parameters,
        thinking: message.content || '',
        toolCallId: toolCall.id,
      };
    }

    if (message.function_call) {
      let parameters = {};
      try {
        parameters = JSON.parse(message.function_call.arguments);
      } catch (e) {
        console.error('Failed to parse function args:', e);
      }

      return {
        type: 'function_call',
        function: message.function_call.name,
        parameters,
        thinking: message.content || '',
      };
    }

    return {
      type: 'message',
      text: message.content,
    };
  }

  async continueAfterFunction({
    previousMessages,
    functionName,
    functionResult,
    userData,
    preferredLanguage,
    availableFunctions = [],
    toolCallId = null,
  }) {
    await this.ensureInitialized();

    const systemPrompt = this.buildSystemPrompt(
      userData,
      preferredLanguage,
      availableFunctions,
    );

    const messages = this.buildMessages(systemPrompt, previousMessages, '');

    if (toolCallId) {
      messages.push({
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: toolCallId,
            type: 'function',
            function: {
              name: functionName,
              arguments: JSON.stringify(functionResult.parameters || {}),
            },
          },
        ],
      });

      messages.push({
        role: 'tool',
        tool_call_id: toolCallId,
        content: JSON.stringify(functionResult),
      });
    } else {
      messages.push({
        role: 'assistant',
        content: null,
        function_call: {
          name: functionName,
          arguments: JSON.stringify(functionResult.parameters || {}),
        },
      });

      messages.push({
        role: 'function',
        name: functionName,
        content: JSON.stringify(functionResult),
      });
    }

    try {
      const response = await this.callOpenAI(messages, availableFunctions);
      return this.processResponse(response);
    } catch (error) {
      console.error('❌ Continue error:', error);
      throw error;
    }
  }

  async extractStructuredData({text, schema, language = 'en'}) {
    await this.ensureInitialized();

    const prompt = `Extract structured data from the following text according to the schema.

Text: "${text}"

Schema: ${JSON.stringify(schema, null, 2)}

Return ONLY a valid JSON object matching the schema. If a field is not mentioned, use null.
Be smart about dates - convert "tomorrow", "next week", etc. to actual dates.
Handle numbers in any format (words, digits, etc.).

Response (JSON only):`;

    try {
      const response = await this.callOpenAI(
        [{role: 'user', content: prompt}],
        [],
      );

      const result = this.processResponse(response);
      return JSON.parse(result.text);
    } catch (error) {
      console.error('❌ Data extraction error:', error);
      return null;
    }
  }
}

const azureAIService = new AzureAIService();
export default azureAIService;
