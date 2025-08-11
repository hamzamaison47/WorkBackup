import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Image} from 'react-native';
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
import {styles} from '../styles/styles';

const LoginScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  return (
    <LinearGradient
      colors={['#FFFFFF', '#ffffffff']}
      style={styles.LoginContainer}>
      {!loading && (
        <>
          <Image
            source={require('../assets/cloud.png')}
            style={styles.Loginlogo}
          />
          <Text style={styles.LoginTitle}>Welcome to the ESS</Text>
          <Text style={styles.LoginSubtitle}>
            Manage your HR services anytime, anywhere
          </Text>

          <TouchableOpacity
            style={styles.LoginButton}
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
              style={styles.LoginIcon}
            />
            <Text style={styles.LoginButtonText}>Sign in with Microsoft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.LoginButton}
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
            <Icon
              name="google"
              size={24}
              color="#0A66C2"
              style={styles.LoginIcon}
            />
            <Text style={styles.LoginButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </>
      )}

      {loading && (
        <View style={styles.LoginLoadingContainer}>
          <CustomIndicator />
          <Text style={styles.LoginLoadingText}>
            Connecting to your account, Please wait...
          </Text>
        </View>
      )}

      <PopupDialog
        visible={dialogVisible}
        onTouchOutside={() => setDialogVisible(false)}
        dialogStyle={styles.LoginDialogContainer}
        width={0.8}
        height={0.3}
        dialogTitle={
          <Text style={styles.LoginDialogTitledialogTitle}>Notification</Text>
        }>
        <View style={styles.LoginDialogContent}>
          <Text style={styles.LoginDialogMessage}>{dialogMessage}</Text>
          <TouchableOpacity
            style={styles.LoginDialogButton}
            onPress={() => setDialogVisible(false)}>
            <Text style={styles.LoginDialogButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </PopupDialog>
    </LinearGradient>
  );
};

export default LoginScreen;
