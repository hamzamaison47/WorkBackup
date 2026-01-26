class AzureAIService {
  /**
   * ==========================================
   * CORE CHAT CALL (AZURE OPENAI REST)
   * ==========================================
   */
  async callAzureOpenAI(messages, options = {}) {
    const url = `${this.AZURE_ENDPOINT}/openai/deployments/${this.DEPLOYMENT_NAME}/chat/completions?api-version=${this.API_VERSION}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.API_KEY,
      },
      body: JSON.stringify({
        messages,
        temperature: options.temperature ?? 0.1,
        max_tokens: options.max_tokens ?? 600,
        response_format: options.response_format,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Azure OpenAI Error:', errorText);
      throw new Error(errorText);
    }

    return response.json();
  }

  /**
   * ==========================================
   * GLOBAL INTENT DETECTION FOR ALL SCREENS
   * ==========================================
   */
  async detectIntentWithAzureAI({userInput, context}) {
    const systemPrompt = `
You are Dynaface HR Assistant - Global App Controller.

Your capabilities:
1. UNDERSTAND ANY LANGUAGE (English, Urdu, Arabic, etc.)
2. NAVIGATE TO ANY SCREEN
3. EXECUTE COMMANDS
4. ANSWER HR QUESTIONS

APP SCREENS AVAILABLE:
- "CreateAttendanceScreen": Mark attendance (حاضری لگائیں)
- "HomeScreen": Main dashboard
- "LeaveScreen": Apply for leave (coming soon)
- "ProfileScreen": User profile (coming soon)
- "SummaryScreen": Attendance summary (coming soon)

COMMANDS I CAN EXECUTE:
1. "mark attendance" → Navigate to CreateAttendanceScreen
2. "go to home" → Navigate to HomeScreen  
3. "apply for leave" → Navigate to LeaveScreen
4. "my profile" → Navigate to ProfileScreen
5. "attendance summary" → Navigate to SummaryScreen

UNDERSTAND MULTILINGUAL COMMANDS:
- English: "mark attendance", "clock in"
- Urdu: "حاضری لگائیں", "حاضری درج کریں"
- Arabic: "سجل الحضور", "تسجيل الحضور"

Return JSON:
{
  "intent": "attendance|navigation|leave|info|unknown",
  "action": "mark_attendance|navigate_to_screen|check_balance|show_info|ask_clarification",
  "responseText": "Respond in user's language",
  "nextStep": "navigating|processing|completed",
  "parameters": {
    "screenName": "CreateAttendanceScreen|HomeScreen|etc.",
    "screenParams": {}
  }
}

Always respond in the SAME LANGUAGE as the user's input.
`;

    try {
      const messages = [
        {role: 'system', content: systemPrompt},
        ...(context?.history || []),
        {role: 'user', content: userInput},
      ];

      const data = await this.callAzureOpenAI(messages, {
        response_format: {type: 'json_object'},
        max_tokens: 800,
      });

      const result = JSON.parse(data.choices[0].message.content);
      console.log('✅ Global Intent Result:', result);
      return result;
    } catch (error) {
      console.error('❌ Intent Detection Failed:', error);

      // Fallback to simple keyword detection
      return this.fallbackIntentDetection(userInput);
    }
  }

  /**
   * ==========================================
   * FALLBACK INTENT DETECTION (If Azure fails)
   * ==========================================
   */
  fallbackIntentDetection(userInput) {
    const lowerInput = userInput.toLowerCase();

    // Multilingual attendance keywords
    const attendanceKeywords = [
      // English
      'mark attendance',
      'clock in',
      'punch in',
      'check in',
      'attendance',
      // Urdu
      'حاضری',
      'حاضری لگائیں',
      'حاضری درج کریں',
      'ہاتھری',
      // Arabic
      'حضور',
      'تسجيل الحضور',
      'سجل الحضور',
    ];

    // Navigation keywords
    const homeKeywords = [
      'home',
      'dashboard',
      'main',
      'گھر',
      'صفحہ اصلی',
      'الرئيسية',
    ];

    if (attendanceKeywords.some(keyword => lowerInput.includes(keyword))) {
      return {
        intent: 'attendance',
        action: 'mark_attendance',
        responseText: this.getLocalizedResponse('attendance', userInput),
        nextStep: 'navigating',
        parameters: {
          screenName: 'CreateAttendanceScreen',
        },
      };
    }

    if (homeKeywords.some(keyword => lowerInput.includes(keyword))) {
      return {
        intent: 'navigation',
        action: 'navigate_to_screen',
        responseText: this.getLocalizedResponse('home', userInput),
        nextStep: 'navigating',
        parameters: {
          screenName: 'HomeScreen',
        },
      };
    }

    return {
      intent: 'unknown',
      action: 'ask_clarification',
      responseText: this.getLocalizedResponse('clarification', userInput),
      nextStep: 'awaiting_input',
    };
  }

  /**
   * ==========================================
   * LOCALIZED RESPONSES
   * ==========================================
   */
  getLocalizedResponse(type, userInput) {
    // Detect language from user input
    const isUrdu = /[\u0600-\u06FF]/.test(userInput);
    const isArabic = /[\u0750-\u077F]/.test(userInput);

    if (type === 'attendance') {
      if (isUrdu) {
        return 'آپ کو حاضری کے اسکرین پر لے جا رہا ہوں...';
      }
      if (isArabic) {
        return 'سوف أنقلك إلى شاشة الحضور...';
      }
      return 'Navigating you to attendance screen...';
    }

    if (type === 'home') {
      if (isUrdu) {
        return 'آپ کو ہوم اسکرین پر لے جا رہا ہوں...';
      }
      if (isArabic) {
        return 'سوف أنقلك إلى الشاشة الرئيسية...';
      }
      return 'Navigating you to home screen...';
    }

    if (type === 'clarification') {
      if (isUrdu) {
        return 'براہ کرم مزید وضاحت کریں۔';
      }
      if (isArabic) {
        return 'يرجى توضيح أكثر.';
      }
      return 'Please clarify more.';
    }

    return 'I understand. Let me help you.';
  }

  /**
   * ==========================================
   * CONVERSATION CONTEXT HANDLER
   * ==========================================
   */
  async handleConversationFlow(messages) {
    return {
      history: messages.slice(-10).map(msg => ({
        role: msg.from === 'user' ? 'user' : 'assistant',
        content: msg.text,
      })),
      timestamp: new Date().toISOString(),
    };
  }
}

// ✅ Singleton export
const azureAIService = new AzureAIService();
export default azureAIService;
