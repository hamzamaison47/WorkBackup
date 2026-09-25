import React, {useState, useEffect, useCallback} from 'react'; // ← remove useFocusEffect
import {StyleSheet, BackHandler} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native'; // ← add here
import ActionPaneContainer from '../../../components/ActionPaneContainer';
import {translate as t} from '../../../store/utils/translate';
import {conditionalVerticalScale} from '../../../store/utils/scaling';
import {
  PageBackground,
  AnimatedCard,
  CardHeading,
  SettingRow,
  RowSkeleton,
  FooterNote,
  AppTokens,
  CARD_STAGGER,
} from '../../../components/AppComponentsDesign/Appcomponents';

const DisplayPersonalInfo = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('Profile');
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );
  const handleGoBack = () => {
    navigation.navigate('Profile');
  };

  const personalItems = [
    {
      id: 'contactDetails',
      icon: 'phone',
      iconColor: AppTokens.blueStrong,
      iconBg: AppTokens.blueBg,
      title: t('personalInfo.contactDetails'),
      subtitle: t('personalInfo.contactDetailsSubtitle'),
      screen: 'ContactDetailsListPage',
    },
    {
      id: 'personalContacts',
      icon: 'layers',
      iconColor: AppTokens.teal,
      iconBg: AppTokens.tealBg,
      title: t('personalInfo.personalContacts'),
      subtitle: t('personalInfo.personalContactsSubtitle'),
      screen: 'FamilyContact_ListPage',
    },
    {
      id: 'identification',
      icon: 'user-check',
      iconColor: AppTokens.indigo,
      iconBg: AppTokens.indigoBg,
      title: t('personalInfo.identification'),
      subtitle: t('personalInfo.identificationSubtitle'),
      screen: 'IdentificationNumberListPage',
    },
    // {
    //   id: 'profileImage',
    //   icon: 'image',
    //   iconColor: AppTokens.amber,
    //   iconBg: AppTokens.amberBg,
    //   title: t('personalInfo.profileImage'),
    //   subtitle: t('personalInfo.profileImageSubtitle'),
    //   screen: 'ChangeProfileImage',
    // },
  ];

  const educationItems = [
    {
      id: 'personalEducation',
      icon: 'pen-tool',
      iconColor: AppTokens.purple,
      iconBg: AppTokens.purpleBg,
      title: t('personalInfo.education'),
      subtitle: t('personalInfo.educationSubtitle'),
      screen: 'PersonalEducationListPage',
    },
  ];

  const financialItems = [
    {
      id: 'bankaccounts',
      icon: 'credit-card',
      iconColor: AppTokens.green,
      iconBg: AppTokens.greenBg,
      title: t('personalInfo.bankAccount'),
      subtitle: t('personalInfo.bankAccountSubtitle'),
      screen: 'BankAccountListPage',
    },
  ];

  return (
    <ActionPaneContainer
      pageTitle={t('profile.personalInfo')}
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={true}
      showPageTitleRow={true}
      onBackPress={handleGoBack}>
      <PageBackground>
        {isLoading ? (
          <RowSkeleton count={6} />
        ) : (
          <>
            {/* ── Personal Information ── */}
            <AnimatedCard delay={0}>
              <CardHeading label="PERSONAL INFORMATION" />
              {personalItems.map((item, index) => (
                <SettingRow
                  key={item.id}
                  icon={item.icon}
                  iconColor={item.iconColor}
                  iconBg={item.iconBg}
                  title={item.title}
                  subtitle={item.subtitle}
                  onPress={() => navigation.navigate(item.screen)}
                  isLast={index === personalItems.length - 1}
                  style={S.bigRow}
                />
              ))}
            </AnimatedCard>

            {/* ── Education ── */}
            <AnimatedCard delay={CARD_STAGGER}>
              <CardHeading label="COMPETENCY" />
              {educationItems.map((item, index) => (
                <SettingRow
                  key={item.id}
                  icon={item.icon}
                  iconColor={item.iconColor}
                  iconBg={item.iconBg}
                  title={item.title}
                  subtitle={item.subtitle}
                  onPress={() => navigation.navigate(item.screen)}
                  isLast={index === educationItems.length - 1}
                  style={S.bigRow}
                />
              ))}
            </AnimatedCard>

            {/* ── Financial ── */}
            <AnimatedCard delay={CARD_STAGGER * 2}>
              <CardHeading label="FINANCIAL" />
              {financialItems.map((item, index) => (
                <SettingRow
                  key={item.id}
                  icon={item.icon}
                  iconColor={item.iconColor}
                  iconBg={item.iconBg}
                  title={item.title}
                  subtitle={item.subtitle}
                  onPress={() => navigation.navigate(item.screen)}
                  isLast={index === financialItems.length - 1}
                  style={S.bigRow}
                />
              ))}
            </AnimatedCard>
          </>
        )}
      </PageBackground>
    </ActionPaneContainer>
  );
};

export default DisplayPersonalInfo;

const S = StyleSheet.create({
  bigRow: {
    paddingVertical: conditionalVerticalScale(18, 20, 22, 22),
  },
});
