import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import ActionPaneContainer from '../../../components/ActionPaneContainer';
import CustomIndicator from '../../../components/CustomIndicator/CustomIndicator';

const DisplayPersonalInfo = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const destinations = [
    // {
    //   id: 'addresses',
    //   icon: 'map-pin',
    //   title: 'Addresses',
    //   subtitle: 'View and edit your current and permanent addresses',
    //   screen: '',
    // },
    {
      id: 'contactDetails',
      icon: 'phone',
      title: 'Contact Details',
      subtitle: 'Manage your phone numbers and email addresses',
      screen: 'ContactDetailsListPage',
    },
    // {
    //   id: 'personalContacts',
    //   icon: 'users',
    //   title: 'Personal Contacts',
    //   subtitle: 'Emergency contacts and dependents',
    //   screen: '',
    // },
    {
      id: 'identification',
      icon: 'hash',
      title: 'Identification Numbers',
      subtitle: 'Your CNIC, passport, and other IDs',
      screen: '',
    },
    {
      id: 'personalEducation',
      icon: 'book',
      title: 'Education',
      subtitle: 'View or update your education details',
      screen: 'PersonalEducation',
    },
    {
      id: 'bankaccounts',
      icon: 'dollar-sign',
      title: 'Bank Account',
      subtitle: 'View or update your bank account details',
      screen: 'BankAccountListPage',
    },
    {
      id: 'profileImage',
      icon: 'image',
      title: 'Profile Image',
      subtitle: 'Upload or change your profile photo',
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
      <Icon name="chevron-right" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <ActionPaneContainer
      pageTitle="Profile"
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
            <Text style={styles.headerTitle}>Personal Information</Text>
            <Text style={styles.headerSubtitle}>
              Manage your profile, contact, and preferences
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
