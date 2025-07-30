/* eslint-disable no-unused-vars */
import React, {createContext, useState, useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {UserContext} from './UserContext';

export const CompanyContext = createContext();

export const CompanyProvider = ({children}) => {
  const [selectedLegalEntity, setSelectedLegalEntity] = useState(null);
  const [legalEntities, setLegalEntities] = useState([]);
  const [defaultLegalEntity, setDefaultLegalEntity] = useState(null);

  // Get UserContext to update user data when company changes
  const {userData, setUserData} = useContext(UserContext);

  const updateSelectedLegalEntity = async newLegalEntity => {
    setSelectedLegalEntity(newLegalEntity);

    // Update UserContext defaultLegalEntity as well (only for current session)
    if (userData && setUserData) {
      setUserData(prevUserData => ({
        ...prevUserData,
        defaultLegalEntity: newLegalEntity,
      }));
    }

    // Note: We don't persist the selection anymore since we want to
    // always start with the original default on app restart
  };

  const initializeLegalEntity = async defaultEntity => {
    setDefaultLegalEntity(defaultEntity);

    // Always start with the default company from UserContext
    // Don't load persisted selection on app start
    setSelectedLegalEntity(defaultEntity);

    // Clear any previously persisted selection since we want to start fresh with default
    try {
      await AsyncStorage.removeItem('selectedLegalEntity');
    } catch (error) {
      console.error('Error clearing persisted legal entity:', error);
    }
  };

  const resetCompanyContext = async () => {
    setSelectedLegalEntity(null);
    setLegalEntities([]);
    setDefaultLegalEntity(null);
    try {
      await AsyncStorage.removeItem('selectedLegalEntity');
    } catch (error) {
      console.error('Error resetting company context:', error);
    }
  };

  const value = {
    selectedLegalEntity,
    setSelectedLegalEntity: updateSelectedLegalEntity,
    legalEntities,
    setLegalEntities,
    defaultLegalEntity,
    initializeLegalEntity,
    resetCompanyContext,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
};
