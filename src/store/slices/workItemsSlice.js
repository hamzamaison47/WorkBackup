// store/slices/workItemsSlice.js
import {createSlice} from '@reduxjs/toolkit';

const workItemsSlice = createSlice({
  name: 'workItems',
  initialState: {
    pendingCount: 0,
  },
  reducers: {
    setPendingWorkItemsCount: (state, action) => {
      state.pendingCount = action.payload;
    },
  },
});

export const {setPendingWorkItemsCount} = workItemsSlice.actions;
export default workItemsSlice.reducer;
