// store/slices/chatbotSlice.js
import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  messages: [],
  state: {
    leaveHandlerState: null,
    currentIntent: null,
    conversationContext: [],
  },
  settings: {
    voiceEnabled: true,
    autoSpeak: false,
    language: 'en',
  },
};

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState,
  reducers: {
    // Add a single message
    chatbotAddMessage: (state, action) => {
      state.messages.push(action.payload);

      // Keep only last 50 messages to prevent memory issues
      if (state.messages.length > 50) {
        state.messages = state.messages.slice(-50);
      }
    },

    // Set all messages (replace)
    chatbotSetMessages: (state, action) => {
      state.messages = action.payload;
    },

    // Update chatbot state (for leave handler, etc.)
    chatbotUpdateState: (state, action) => {
      state.state = {
        ...state.state,
        ...action.payload,
      };
    },

    // Update settings
    chatbotUpdateSettings: (state, action) => {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
    },

    // Clear all messages
    chatbotClearMessages: state => {
      state.messages = [];
    },

    // Reset chatbot state
    chatbotResetState: state => {
      state.state = {
        leaveHandlerState: null,
        currentIntent: null,
        conversationContext: [],
      };
    },

    // Reset everything
    chatbotResetAll: state => {
      state.messages = [];
      state.state = {
        leaveHandlerState: null,
        currentIntent: null,
        conversationContext: [],
      };
    },

    // Add to conversation context
    chatbotAddContext: (state, action) => {
      state.state.conversationContext.push(action.payload);

      // Keep only last 10 context items
      if (state.state.conversationContext.length > 10) {
        state.state.conversationContext =
          state.state.conversationContext.slice(-10);
      }
    },
  },
});

export const {
  chatbotAddMessage,
  chatbotSetMessages,
  chatbotUpdateState,
  chatbotUpdateSettings,
  chatbotClearMessages,
  chatbotResetState,
  chatbotResetAll,
  chatbotAddContext,
} = chatbotSlice.actions;

export default chatbotSlice.reducer;
