/* eslint-disable no-unused-vars */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import ActionPaneContainer from '../../../components/ActionPaneContainer';
import CustomIndicator from '../../../components/CustomIndicator/CustomIndicator';
import {translate as t} from '../../../store/utils/translate';

const DisplayPersonalInfo = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();
  const currentLanguage = useSelector(state => state.language.currentLanguage);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const destinations = [
    // {
    //   id: 'addresses',
    //   icon: 'map-pin',
    //   title: t('personalInfo.addresses'),
    //   subtitle: t('personalInfo.addressesSubtitle'),
    //   screen: '',
    // },
    {
      id: 'contactDetails',
      icon: 'phone',
      title: t('personalInfo.contactDetails'),
      subtitle: t('personalInfo.contactDetailsSubtitle'),
      screen: 'ContactDetailsListPage',
    },
    // {
    //   id: 'personalContacts',
    //   icon: 'users',
    //   title: t('personalInfo.personalContacts'),
    //   subtitle: t('personalInfo.personalContactsSubtitle'),
    //   screen: '',
    // },
    {
      id: 'identification',
      icon: 'user-check',
      title: t('personalInfo.identification'),
      subtitle: t('personalInfo.identificationSubtitle'),
      screen: 'IdentificationNumberListPage',
    },
    {
      id: 'personalEducation',
      icon: 'pen-tool',
      title: t('personalInfo.education'),
      subtitle: t('personalInfo.educationSubtitle'),
      screen: 'PersonalEducation',
    },
    {
      id: 'bankaccounts',
      icon: 'credit-card',
      title: t('personalInfo.bankAccount'),
      subtitle: t('personalInfo.bankAccountSubtitle'),
      screen: 'BankAccountListPage',
    },
    {
      id: 'profileImage',
      icon: 'image',
      title: t('personalInfo.profileImage'),
      subtitle: t('personalInfo.profileImageSubtitle'),
      screen: 'ChangeProfileImage',
    },
  ];

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (item.screen && item.screen.trim() !== '') {
          navigation.navigate(item.screen);
        }
      }}>
      <View style={styles.iconContainer}>
        <Icon name={item.icon} size={22} color="#0A66C2" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
      <Icon
        name={I18nManager.isRTL ? 'chevron-left' : 'chevron-right'}
        size={20}
        color="#9CA3AF"
      />
      {/* <Icon name="chevron-right" size={20} color="#9CA3AF" /> */}
    </TouchableOpacity>
  );

  return (
    <ActionPaneContainer
      pageTitle={t('personalInfo.pageTitle')}
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={true}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <View style={styles.container}>
          {/* 🌟 Modern Header */}
          <LinearGradient
            colors={['#0A66C2', '#0A66C2']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.headerContainer}>
            <Text style={styles.headerTitle}>
              {t('personalInfo.headerTitle')}
            </Text>
            <Text style={styles.headerSubtitle}>
              {t('personalInfo.headerSubtitle')}
            </Text>
          </LinearGradient>

          {/* List */}
          <FlatList
            data={destinations}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    marginTop: 6,
  },
  listContent: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default DisplayPersonalInfo;
