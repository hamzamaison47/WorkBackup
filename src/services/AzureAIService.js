// services/AzureAIService.js
/* eslint-disable curly */
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
   * - Input: STT text (could be English, Urdu, or mixed)
   * - Output: Either cleaned English OR Roman Urdu
   */
  async normalizeVoiceText({sttText, detectedLanguage}) {
    await this.ensureInitialized();

    const safeText = String(sttText || '').slice(0, 800);

    // If already detected as Urdu by Azure, likely correct
    if (detectedLanguage === 'ur' || detectedLanguage === 'ur-PK') {
      // Just clean it up, keep as Roman Urdu or native script
      return {preferredLanguage: 'ur-roman', text: safeText};
    }

    const prompt = `
You are a voice transcription normalizer for a Pakistani HR chatbot.

INPUT ANALYSIS:
- The user spoke in Urdu or a mix of Urdu and English
- The speech-to-text system may have returned:
  a) Broken English words trying to represent Urdu sounds (e.g., "haazri" → attendance, "chutti" → leave)
  b) Native Urdu script (اردو) if the STT supported it
  c) Actual English if the user spoke English

YOUR TASK:
1) Detect the intended language: Was the user speaking Urdu, English, or mixing both?
2) If Urdu was intended (even if output looks like broken English words like "haazri", "chutti", "lagao", "karna", "main", "mujhe"):
   - Convert to proper Roman Urdu (Urdu words written in English letters)
   - Examples: 
     * "mujhe aaj haazri lagani hai" → keep as is (Roman Urdu)
     * "i want to do haazri today" → "mujhe aaj haazri lagani hai"
     * "main chutti lena chahta hun" → keep as is
3) If pure English → lightly clean and keep English
4) If mixed → match the user's mixing style

COMMON URDU HR TERMS TO RECOGNIZE:
- haazri/hazri = attendance (حاضری)
- chutti/choothi = leave (چھٹی)
- lagao/lagana = mark/do (لگانا)
- karna = to do (کرنا)
- aaj = today (آج)
- kal = tomorrow (کل)
- beemari = sick (بیماری)
- darkhwast = request (درخواست)

Return ONLY valid JSON:
{
  "preferredLanguage": "ur-roman" | "en" | "mixed",
  "text": "the normalized text here"
}

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
        // Default to ur-roman if unsure but contains Urdu-like words
        let prefLang = parsed?.preferredLanguage || 'en';
        let text = String(parsed?.text || safeText).trim();

        // Heuristic: If text contains common Roman Urdu words, force ur-roman
        const romanUrduIndicators =
          /(haazri|hazri|chutti|choothi|lagao|lagana|mujhe|main|meri|aaj|kal|beemari|darkhwast|chahiye|chahta|karna|hai|hun)/i;
        if (prefLang === 'en' && romanUrduIndicators.test(text)) {
          prefLang = 'ur-roman';
        }

        return {preferredLanguage: prefLang, text};
      } catch (jsonErr) {
        // If parsing fails but text looks like Urdu, return as ur-roman
        if (/[\u0600-\u06FF]/.test(safeText)) {
          return {preferredLanguage: 'ur-roman', text: safeText};
        }
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
