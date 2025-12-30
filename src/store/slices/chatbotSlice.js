import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  messages: [],
  leaveFlow: null,
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
    chatbotSetLeaveFlow: (state, action) => {
      state.leaveFlow = action.payload;
    },
    chatbotClearChat: state => {
      state.messages = [];
      state.leaveFlow = null;
    },
  },
});

export const {
  chatbotAddMessage,
  chatbotSetMessages,
  chatbotSetLeaveFlow,
  chatbotClearChat,
} = chatbotSlice.actions;

export default chatbotSlice.reducer;
