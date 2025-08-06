import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import PopupDialog from 'react-native-popup-dialog';
import {useDispatch} from 'react-redux';

import {handleLogin} from '../Controller/authUtils';
import CustomIndicator from '../components/CustomIndicator/CustomIndicator';
import {setUserData} from '../store/slices/userSlice';
import {
  setLegalEntities,
  initializeLegalEntity,
} from '../store/slices/companySlice';

const {width} = Dimensions.get('window');

const LoginScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  return (
    <LinearGradient colors={['#FFFFFF', '#ffffffff']} style={styles.container}>
      {!loading && (
        <>
          <Image source={require('../assets/cloud.png')} style={styles.logo} />
          <Text style={styles.title}>Welcome to the ESS</Text>
          <Text style={styles.subtitle}>
            Manage your HR services anytime, anywhere
          </Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() =>
              handleLogin(
                setLoading,
                data => dispatch(setUserData(data)),
                navigation,
                setDialogVisible,
                setDialogMessage,
                legalEntity => dispatch(initializeLegalEntity(legalEntity)),
                list => dispatch(setLegalEntities(list)),
                'Azure',
              )
            }
            disabled={loading}>
            <Icon
              name="windows"
              size={24}
              color="#0A66C2"
              style={styles.icon}
            />
            <Text style={styles.buttonText}>Sign in with Microsoft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() =>
              handleLogin(
                setLoading,
                data => dispatch(setUserData(data)),
                navigation,
                setDialogVisible,
                setDialogMessage,
                legalEntity => dispatch(initializeLegalEntity(legalEntity)),
                list => dispatch(setLegalEntities(list)),
                'Google',
              )
            }
            disabled={loading}>
            <Icon name="google" size={24} color="#0A66C2" style={styles.icon} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.8, // 80% of screen width
    height: 55, // Fixed height
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#0A66C2',
    marginVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  buttonText: {
    color: '#0A66C2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  icon: {
    marginRight: 10,
  },
  // loginButton: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   // backgroundColor: '#0A66C2',
  //   paddingVertical: 15,
  //   paddingHorizontal: 40,
  //   borderRadius: 10,
  //   borderWidth: 3,
  //   borderColor: '#0A66C2',
  //   // shadowColor: '#000',
  //   // shadowOffset: {width: 0, height: 2},
  //   // shadowOpacity: 0.3,
  //   // shadowRadius: 3,
  //   // elevation: 5,
  //   marginVertical: 5,
  // },
  // buttonText: {
  //   color: '#0A66C2',
  //   fontSize: 18,
  //   fontWeight: 'bold',
  //   marginLeft: 10,
  // },
  // icon: {
  //   marginRight: 10,
  // },
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
    backgroundColor: '#0A66C2',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  dialogButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
