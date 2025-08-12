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
      style={styles.Login_Container}>
      {!loading && (
        <>
          <Image
            source={require('../assets/cloud.png')}
            style={styles.Login_Logo}
          />
          <Text style={styles.Login_Title}>Welcome to the ESS</Text>
          <Text style={styles.Login_Subtitle}>
            Manage your HR services anytime, anywhere
          </Text>

          <TouchableOpacity
            style={styles.Login_Button}
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
              style={styles.Login_Icon}
            />
            <Text style={styles.Login_ButtonText}>Sign in with Microsoft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.Login_Button}
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
              style={styles.Login_Icon}
            />
            <Text style={styles.Login_ButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </>
      )}

      {loading && (
        <View style={styles.Login_LoadingContainer}>
          <CustomIndicator />
          <Text style={styles.Login_LoadingText}>
            Connecting to your account, Please wait...
          </Text>
        </View>
      )}

      <PopupDialog
        visible={dialogVisible}
        onTouchOutside={() => setDialogVisible(false)}
        dialogStyle={styles.Login_DialogContainer}
        width={0.8}
        height={0.3}
        dialogTitle={
          <Text style={styles.Login_DialogTitledialogTitle}>Notification</Text>
        }>
        <View style={styles.Login_DialogContent}>
          <Text style={styles.Login_DialogMessage}>{dialogMessage}</Text>
          <TouchableOpacity
            style={styles.Login_DialogButton}
            onPress={() => setDialogVisible(false)}>
            <Text style={styles.Login_DialogButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </PopupDialog>
    </LinearGradient>
  );
};

export default LoginScreen;
