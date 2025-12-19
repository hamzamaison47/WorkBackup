import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  constructor() {
    // No baseURL needed since SOAP services handle their own URLs
  }

  // Get user info (for other parts of your app)
  async getUserInfo() {
    try {
      const email = await AsyncStorage.getItem('user_email');
      const employeeId = await AsyncStorage.getItem('employeeId');
      const name = await AsyncStorage.getItem('employeeName');
      const company = await AsyncStorage.getItem('defaultLegalEntity');

      return {email, employeeId, name, company};
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  // Logout
  async logout() {
    try {
      await AsyncStorage.multiRemove([
        'user_email',
        'employeeId',
        'employeeName',
        'defaultLegalEntity',
        'fcm_token',
        'device_id',
        'last_dynamics_token',
        'dynamics_synced',
      ]);

      console.log('User logged out and data cleared');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Check if user is logged in
  async isLoggedIn() {
    try {
      const email = await AsyncStorage.getItem('user_email');
      const employeeId = await AsyncStorage.getItem('employeeId');
      return !!(email && employeeId);
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  // Save user data after login (called from your authUtils)
  async saveUserData(userData) {
    try {
      await AsyncStorage.setItem('user_email', userData.email || '');
      await AsyncStorage.setItem('employeeId', userData.employeeId || '');
      await AsyncStorage.setItem('employeeName', userData.employeeName || '');
      await AsyncStorage.setItem('defaultLegalEntity', userData.company || '');

      console.log('User data saved for Firebase sync');
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      return false;
    }
  }
}

const apiServiceInstance = new ApiService();
export default apiServiceInstance;
