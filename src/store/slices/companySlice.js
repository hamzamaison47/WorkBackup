import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  selectedLegalEntity: null,
  legalEntities: [],
  defaultLegalEntity: null,
};

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    setSelectedLegalEntity: (state, action) => {
      state.selectedLegalEntity = action.payload;
    },
    setLegalEntities: (state, action) => {
      state.legalEntities = action.payload;
    },
    setDefaultLegalEntity: (state, action) => {
      state.defaultLegalEntity = action.payload;
    },
    initializeLegalEntity: (state, action) => {
      state.defaultLegalEntity = action.payload;
      state.selectedLegalEntity = action.payload;
    },
    resetCompanyState: state => {
      state.selectedLegalEntity = null;
      state.legalEntities = [];
      state.defaultLegalEntity = null;
    },
  },
});

export const {
  setSelectedLegalEntity,
  setLegalEntities,
  setDefaultLegalEntity,
  initializeLegalEntity,
  resetCompanyState,
} = companySlice.actions;

export default companySlice.reducer;
