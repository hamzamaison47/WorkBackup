import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  messages: [],
  isTyping: false,
  pendingAction: null,
  currentScreen: null,
  conversationContext: [],
};

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState,
  reducers: {
    chatbotAddMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    chatbotSetMessages: (state, action) => {
      state.messages = action.payload;
    },
    chatbotClearMessages: state => {
      state.messages = [];
    },

    // ADD THIS - This is what's missing
    chatbotClearChat: state => {
      state.messages = [];
      state.conversationContext = [];
      state.pendingAction = null;
      state.isTyping = false;
    },

    chatbotSetTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    chatbotSetPendingAction: (state, action) => {
      state.pendingAction = action.payload;
    },
    chatbotSetCurrentScreen: (state, action) => {
      state.currentScreen = action.payload;
    },
    chatbotAddToContext: (state, action) => {
      state.conversationContext.push(action.payload);
      // Keep only last 10 context items
      if (state.conversationContext.length > 10) {
        state.conversationContext = state.conversationContext.slice(-10);
      }
    },
    chatbotClearContext: state => {
      state.conversationContext = [];
    },
  },
});

export const {
  chatbotAddMessage,
  chatbotSetMessages,
  chatbotClearMessages,
  chatbotClearChat, // ADD THIS
  chatbotSetTyping,
  chatbotSetPendingAction,
  chatbotSetCurrentScreen,
  chatbotAddToContext,
  chatbotClearContext,
} = chatbotSlice.actions;

export default chatbotSlice.reducer;
