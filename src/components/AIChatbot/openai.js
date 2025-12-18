import {getActiveConfigData} from '../../Controller/secureConfig';

export async function getOpenAIReply(userMessage) {
  try {
    const config = await getActiveConfigData();
    const provider = config?.aiProvider || 'openai';

    // -------------------- Validate Dynaface Questions --------------------
    const isDynafaceQuestion =
      /attendance|dynaface|leave|punch|clock|hr|mobile app/i.test(userMessage);

    if (!isDynafaceQuestion) {
      // Block questions outside Dynaface domain
      return 'Please ask questions related to Dynaface.';
    }

    const systemInstruction = `
You are an AI assistant for the Dynaface mobile HR application.
Only answer questions related to:
- Dynaface app usage
- Attendance workflows
- Navigation and features

If the user asks anything outside Dynaface, reply exactly:
"Please ask questions related to Dynaface."
`;

    // -------------------- Claude --------------------
    if (provider === 'claude') {
      const key = config?.anthropicApiKey;
      if (!key || key.startsWith('YOUR_')) {
        // Graceful fallback
        return 'I can help you with Dynaface app usage and attendance.';
      }

      const res = await fetch('https://api.anthropic.com/v1/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: config?.anthropicModel || 'claude-haiku-4.5',
          prompt: `SYSTEM:${systemInstruction}\nHuman:${userMessage}\nAssistant:`,
          max_tokens_to_sample: 400,
          temperature: 0.4,
        }),
      });

      const data = await res.json();
      return (
        data?.completion || 'I could not generate a response. Please try again.'
      );
    }

    // -------------------- OpenAI --------------------
    const apiKey = config?.openaiApiKey;
    if (!apiKey || apiKey.startsWith('YOUR_')) {
      // Graceful fallback
      return 'I can help you with Dynaface app usage and attendance.';
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // updated model
        temperature: 0.4,
        max_tokens: 300,
        messages: [
          {role: 'system', content: systemInstruction},
          {role: 'user', content: userMessage},
        ],
      }),
    });

    const data = await res.json();
    return (
      data?.choices?.[0]?.message?.content ||
      'I could not generate a response. Please try again.'
    );
  } catch (e) {
    console.error('AI Error', e);
    return 'Assistant is temporarily unavailable. Please try again later.';
  }
}
