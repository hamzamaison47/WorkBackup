import React from 'react';
import {UserProvider} from './src/context/UserContext';
import {NavigationContainer} from '@react-navigation/native';
import AppNavigator from './src/Navigation/AppNavigator';
import {CompanyProvider} from './src/context/CompanyContext';

const App = () => {
  return (
    <UserProvider>
      <CompanyProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </CompanyProvider>
    </UserProvider>
  );
};

export default App;
