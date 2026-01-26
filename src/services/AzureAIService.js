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
   * Enhanced system prompt with better context understanding
   */
  buildSystemPrompt(userData, language, availableFunctions) {
    const languageInstructions = {
      en: 'Respond in English',
      ur: 'Respond in Urdu (اردو میں جواب دیں)',
      ar: 'Respond in Arabic (الرد باللغة العربية)',
    };

    const functionDescriptions = availableFunctions
      .map(fn => `- ${fn.name}: ${fn.description}`)
      .join('\n');

    return `You are Dynaface HR Assistant - an intelligent, context-aware assistant.

EMPLOYEE CONTEXT:
- Employee ID: ${userData?.employeeId || 'Unknown'}
- Employee Name: ${userData?.employeeName || 'Unknown'}
- Worker RecID: ${userData?.WorkerRecId || 'Unknown'}

LANGUAGE: ${languageInstructions[language] || languageInstructions.en}

AVAILABLE FUNCTIONS:
${functionDescriptions}

INTELLIGENCE RULES:
1. **Case Insensitive**: Understand user input regardless of capitalization
2. **Homonyms & Synonyms**: Recognize variations like "leave" = "time off" = "vacation"
3. **Fuzzy Matching**: Handle typos and partial words
4. **Context Awareness**: Remember conversation history and infer missing information
5. **Smart Parameter Extraction**: Extract dates, numbers, and entities from natural language
6. **Error Recovery**: If a function call fails, analyze the error and ask for missing parameters
7. **Progressive Disclosure**: Start with minimal required parameters, ask for more if needed

CONVERSATION GUIDELINES:
1. Be conversational and natural
2. Don't ask for information you can infer from context
3. If user says "leave" without specifics, ask clarifying questions
4. Extract structured data from unstructured input (e.g., "tomorrow" → actual date)
5. Handle variations: "check balance" = "how many leaves" = "leave balance" = "balance check"
6. Use functions to get real data - NEVER make up information
7. If a function fails, interpret the error and guide the user

FUNCTION CALLING STRATEGY:
1. Try calling functions with available parameters
2. If error occurs, parse the error message for missing fields
3. Ask user ONLY for the specific missing fields
4. Retry the function call once all required parameters are collected
5. For optional parameters, proceed without them unless user mentions them

DATE UNDERSTANDING:
- "today" → current date
- "tomorrow" → current date + 1 day
- "next Monday" → next occurrence of Monday
- "15th" or "15" → 15th of current month
- Handle formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, natural language

NUMBER UNDERSTANDING:
- "one", "1", "first" all mean the same
- Handle spelled numbers in English, Urdu, Arabic
- Understand ordinals: "first", "second", etc.

ERROR HANDLING:
When a function returns an error:
1. Parse the error message
2. Identify what's missing or invalid
3. Ask user for the specific information needed
4. Keep the conversation flowing naturally

REMEMBER: You're having a conversation, not filling a form. Be intelligent and helpful.`;
  }

  /**
   * Build message array with enhanced context
   */
  buildMessages(systemPrompt, history, currentMessage) {
    const messages = [{role: 'system', content: systemPrompt}];

    // Add conversation history (last 10 messages for context)
    const recentHistory = history.slice(-10);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.from === 'user' ? 'user' : 'assistant',
        content: msg.text,
      });
    });

    // Add current message
    if (currentMessage) {
      messages.push({role: 'user', content: currentMessage});
    }

    return messages;
  }

  /**
   * Main AI conversation method with enhanced intelligence
   */
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

  /**
   * Enhanced OpenAI API call with better error handling
   */
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

    // Add functions with proper schema
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

        // Retry logic for transient errors
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

  /**
   * Enhanced response processing
   */
  processResponse(data) {
    const message = data.choices[0].message;

    // Check if AI wants to call a function (new tool_calls format)
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

    // Check legacy function_call format
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

    // Regular text response
    return {
      type: 'message',
      text: message.content,
    };
  }

  /**
   * Continue conversation after function execution with error handling
   */
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

    // Add function call and result
    if (toolCallId) {
      // New tool_calls format
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
      // Legacy function_call format
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

  /**
   * Extract structured data from natural language
   */
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
