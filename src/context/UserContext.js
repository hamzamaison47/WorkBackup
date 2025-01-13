// UserContext.js
import React, {createContext, useState} from 'react';

const UserContext = createContext();

const UserProvider = ({children}) => {
  const [userData, setUserData] = useState(null);

  // Define any other state or functions to manage user data

  return (
    <UserContext.Provider value={{userData, setUserData}}>
      {children}
    </UserContext.Provider>
  );
};

export {UserContext, UserProvider};
