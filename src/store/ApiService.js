import {store} from './index';
import {setUserData, clearUserData} from './slices/userSlice';
import {setFirebaseUserData, clearFirebaseData} from './slices/firebaseSlice';

class ApiService {
  constructor() {
    // No baseURL needed since SOAP services handle their own URLs
  }

  // Get user info from Redux (for other parts of your app)
  getUserInfo() {
    try {
      const state = store.getState();
      const email = state.firebase.userEmail;
      const employeeId = state.firebase.employeeId;
      const name = state.user.userData?.employeeName;
      const company = state.firebase.company;

      return {email, employeeId, name, company};
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  // Logout - clear Redux state
  async logout() {
    try {
      store.dispatch(clearUserData());
      store.dispatch(clearFirebaseData());
      console.log('User logged out and Redux state cleared');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Check if user is logged in
  isLoggedIn() {
    try {
      const state = store.getState();
      const email = state.firebase.userEmail;
      const employeeId = state.firebase.employeeId;
      return !!(email && employeeId);
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  // Save user data after login (called from your authUtils)
  saveUserData(userData) {
    try {
      store.dispatch(
        setFirebaseUserData({
          userEmail: userData.email || '',
          employeeId: userData.employeeId || '',
          company: userData.company || '',
        }),
      );

      console.log('User data saved to Redux for Firebase sync');
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      return false;
    }
  }
}

const apiServiceInstance = new ApiService();
export default apiServiceInstance;
