import React, {useState, useContext} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {UserContext} from '../context/UserContext';
import PopupDialog from 'react-native-popup-dialog';
import Icon from 'react-native-vector-icons/FontAwesome';
import {handleLogin} from '../Controller/authUtils';
import CustomIndicator from '../components/CustomIndicator/CustomIndicator';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const {setUserData} = useContext(UserContext);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  return (
    <LinearGradient colors={['#FFFFFF', '#F0F0F0']} style={styles.container}>
      {!loading && (
        <>
          <Image source={require('../assets/cloud.png')} style={styles.logo} />
          <Text style={styles.title}>Welcome to the ESS Payroll Portal</Text>
          <Text style={styles.subtitle}>
            Manage your employee services with ease and security.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() =>
              handleLogin(
                setLoading,
                setUserData,
                navigation,
                setDialogVisible,
                setDialogMessage,
                'Azure',
              )
            }
            disabled={loading}>
            <Icon name="windows" size={24} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Sign in with Microsoft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() =>
              handleLogin(
                setLoading,
                setUserData,
                navigation,
                setDialogVisible,
                setDialogMessage,
                'Google',
              )
            }
            disabled={loading}>
            <Icon name="google" size={24} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </>
      )}
      {loading && (
        <View style={styles.loadingContainer}>
          <CustomIndicator />
          <Text style={styles.loadingText}>
            Connecting to your account, Please wait...
          </Text>
        </View>
      )}

      <PopupDialog
        visible={dialogVisible}
        onTouchOutside={() => setDialogVisible(false)}
        dialogStyle={styles.dialogContainer}
        width={0.8}
        height={0.3}
        dialogTitle={<Text style={styles.dialogTitle}>Notification</Text>}>
        <View style={styles.dialogContent}>
          <Text style={styles.dialogMessage}>{dialogMessage}</Text>
          <TouchableOpacity
            style={styles.dialogButton}
            onPress={() => setDialogVisible(false)}>
            <Text style={styles.dialogButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </PopupDialog>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#333333',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 15,
    fontStyle: 'italic',
  },
  loginButton: {
    flexDirection: 'row', // To align the icon and text side by side
    alignItems: 'center', // Align vertically centered
    backgroundColor: '#FFA500',
    marginVertical: 15,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10, // Adds space between the icon and the text
  },
  loader: {
    marginTop: 20,
  },
  dialogContainer: {
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dialogContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  dialogButton: {
    backgroundColor: '#FFA500',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  dialogButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  icon: {
    marginRight: 10,
  },

  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});

export default LoginScreen;
