/* eslint-disable no-unused-vars */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import ActionPaneContainer from '../../../components/ActionPaneContainer';
import CustomIndicator from '../../../components/CustomIndicator/CustomIndicator';
import {translate as t} from '../../../store/utils/translate';
import styles from '../../../styles/styles';

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

    {
      id: 'personalContacts',
      icon: 'layers',
      title: t('personalInfo.personalContacts'),
      subtitle: t('personalInfo.personalContactsSubtitle'),
      screen: 'FamilyContact_ListPage',
    },
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
      style={styles.DPI_card}
      onPress={() => {
        if (item.screen && item.screen.trim() !== '') {
          navigation.navigate(item.screen);
        }
      }}>
      <View style={styles.DPI_iconContainer}>
        <Icon name={item.icon} size={22} color="#0A66C2" />
      </View>
      <View style={styles.DPI_textContainer}>
        <Text style={styles.DPI_title}>{item.title}</Text>
        <Text style={styles.DPI_subtitle}>{item.subtitle}</Text>
      </View>
      <Icon
        name={I18nManager.isRTL ? 'chevron-left' : 'chevron-right'}
        size={20}
        color="#9CA3AF"
      />
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
        <View style={styles.DLP_LoadingContainer}>
          <CustomIndicator />
        </View>
      ) : (
        <View style={styles.DPI_container}>
          {/* Modern Header */}
          <LinearGradient
            colors={['#0A66C2', '#0A66C2']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.DPI_headerContainer}>
            <Text style={styles.DPI_headerTitle}>
              {t('personalInfo.headerTitle')}
            </Text>
            <Text style={styles.DPI_headerSubtitle}>
              {t('personalInfo.headerSubtitle')}
            </Text>
          </LinearGradient>

          {/* List */}
          <FlatList
            data={destinations}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.DPI_listContent}
          />
        </View>
      )}
    </ActionPaneContainer>
  );
};

export default DisplayPersonalInfo;
