// services/FoundryAgentService.js
// Reads foundryAccessToken from Redux — the token with aud: https://ai.azure.com
// that was acquired silently in handleSuccessfulLogin.

import {store} from '../store';
import {getAccessToken, getAIServiceToken} from './AzureAuthService';

const PROJECT_ENDPOINT =
  'https://dynaface-resource.services.ai.azure.com/api/projects/dynaface';
const AGENT_NAME = 'Dynaface';
const AGENT_VERSION = '50';
const API_VERSION = '2025-11-15-preview';

const BASE = `${PROJECT_ENDPOINT}/openai`;

const agentRef = {
  agent: {name: AGENT_NAME, version: AGENT_VERSION, type: 'agent_reference'},
};

async function getBearerToken() {
  // Uses the dedicated Foundry token (aud: https://ai.azure.com)
  // set by setFoundryAccessToken in authUtils after login
  const token = await getAIServiceToken();
  if (!token) {
    throw new Error(
      'Foundry token not available. Please log out and log back in.',
    );
  }
  return token;
}

async function apiFetch(path, options = {}) {
  const token = await getBearerToken();
  const res = await fetch(`${BASE}${path}?api-version=${API_VERSION}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  console.log('RES', res);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[${res.status}] ${err}`);
  }
  return res.json();
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function createConversation(message) {
  const data = await apiFetch('/conversations', {
    method: 'POST',
    body: JSON.stringify({
      items: [{type: 'message', role: 'user', content: message}],
    }),
  });
  return data.id;
}

async function addMessage(conversationId, message) {
  return apiFetch(`/conversations/${conversationId}/items`, {
    method: 'POST',
    body: JSON.stringify({
      items: [{type: 'message', role: 'user', content: message}],
    }),
  });
}

async function generateResponse(conversationId) {
  const data = await apiFetch('/responses', {
    method: 'POST',
    body: JSON.stringify({conversation: conversationId, ...agentRef}),
  });
  if (data.status && data.status !== 'completed') {
    return pollResponse(data.id);
  }
  return extractResult(data);
}

async function pollResponse(responseId, intervalMs = 1500, maxAttempts = 40) {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs);
    const data = await apiFetch(`/responses/${responseId}`, {method: 'GET'});
    if (data.status === 'failed') {
      throw new Error(data.error?.message ?? 'Response generation failed');
    }
    if (data.status === 'completed') {
      return extractResult(data);
    }
  }
  throw new Error('Response timed out');
}

function extractResult(data) {
  console.log('Data =-=-=-=-=-=-=-=-=\n', data);

  if (Array.isArray(data.output)) {
    // Check for an OAuth consent request item first
    const consentItem = data.output.find(
      i => i.type === 'oauth_consent_request' && i.consent_link,
    );
    if (consentItem) {
      return {
        type: 'consent',
        reply: 'Give Consent by clicking on the button below to continue',
        consentLink: consentItem.consent_link,
      };
    }

    // Otherwise extract normal assistant text
    const text = data.output
      .filter(i => i.type === 'message' && i.role === 'assistant')
      .flatMap(i =>
        Array.isArray(i.content)
          ? i.content.filter(c => c.type === 'output_text').map(c => c.text)
          : [],
      )
      .join('\n');

    if (text) {
      return {type: 'text', reply: text};
    }
  }

  return {type: 'text', reply: '(No response)'};
}

function extractText(data) {
  console.log('Data =-=-=-=-=-=-=-=-=\n', data);
  if (Array.isArray(data.output)) {
    const text = data.output
      .filter(i => i.type === 'message' && i.role === 'assistant')
      .flatMap(i =>
        Array.isArray(i.content)
          ? i.content
              .filter(c => c.type === 'output_text') // ← was 'text', now 'output_text'
              .map(c => c.text)
          : [],
      )
      .join('\n');
    if (text) {
      return text;
    }
  }
  return '(No response)';
}

export async function sendMessage(conversationId, userText) {
  let cid = conversationId;
  if (!cid) {
    cid = await createConversation(userText);
  } else {
    await addMessage(cid, userText);
  }
  const result = await generateResponse(cid);
  return {conversationId: cid, ...result};
  // Returns: { conversationId, type, reply, consentLink? }
}
