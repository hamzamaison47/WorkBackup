import React, {useState, useRef, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/FontAwesome';
import {screenMapping} from '../Controller/screenMapping';
import {useNavigation} from '@react-navigation/native';
import usePalette from '../hooks/usePalette';
import {useSelector} from 'react-redux';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
  borderRadius,
} from '../store/utils/scaling';
import useAppTokens from './AppComponentsDesign/useAppTokens';

const STAGGER = 45;
const SLIDE_DUR = 280;
const FADE_DUR = 200;

// ─── Animated entrance wrapper ─────────────────────────────────────────────
const AnimatedRow = ({children, delay = 0, style}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_DUR,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: SLIDE_DUR,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay]);
  return (
    <Animated.View style={[{opacity, transform: [{translateY}]}, style]}>
      {children}
    </Animated.View>
  );
};

// ─── Section label ─────────────────────────────────────────────────────────
const SectionLabel = ({label, styles}) => (
  <Text style={styles.sectionLabel}>{label}</Text>
);

// ─── Icon badge ────────────────────────────────────────────────────────────
const IconBadge = ({name, color, bgColor, lib = 'ion', styles}) => (
  <View style={[styles.iconBadge, {backgroundColor: bgColor}]}>
    {lib === 'ion' ? (
      <Ionicons
        name={name}
        size={conditionalFontScale(14, 15, 16, 16)}
        color={color}
      />
    ) : (
      <Icon
        name={name}
        size={conditionalFontScale(14, 15, 16, 16)}
        color={color}
      />
    )}
  </View>
);

// ─── Reusable menu row ─────────────────────────────────────────────────────
const MenuRow = ({
  iconName,
  iconColor,
  iconBg,
  label,
  sub,
  onPress,
  lib = 'ion',
  styles,
}) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <IconBadge
      name={iconName}
      color={iconColor}
      bgColor={iconBg}
      lib={lib}
      styles={styles}
    />
    <View style={styles.rowTextBlock}>
      <Text style={styles.rowLabel}>{label}</Text>
      {sub ? (
        <Text style={styles.rowSub} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </View>
    <Icon name="chevron-right" size={10} color="#CBD5E1" />
  </TouchableOpacity>
);

// ─── Main modal ────────────────────────────────────────────────────────────
const ActionPaneMenuModal = ({
  visible,
  onClose,
  onLogout,
  legalEntities = [],
  selectedLegalEntity,
  onCompanySelect,
}) => {
  const navigation = useNavigation();
  const {menuItems} = useSelector(state => state.menuItem);
  const {userData} = useSelector(state => state.user);
  const P = usePalette();
  const T = useAppTokens();
  const styles = createStyles(T);

  const [companyOpen, setCompanyOpen] = useState(false);

  // Panel entrance
  const slideAnim = useRef(new Animated.Value(-40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Company accordion
  const submenuHeight = useRef(new Animated.Value(0)).current;
  const submenuOpacity = useRef(new Animated.Value(0)).current;
  const chevronRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(-40);
      fadeAnim.setValue(0);
      setCompanyOpen(false);
      submenuHeight.setValue(0);
      submenuOpacity.setValue(0);
      chevronRotate.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: FADE_DUR,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          speed: 18,
          bounciness: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [
    visible,
    slideAnim,
    fadeAnim,
    submenuHeight,
    submenuOpacity,
    chevronRotate,
  ]);

  const toggleCompany = () => {
    const opening = !companyOpen;
    setCompanyOpen(opening);
    const maxH = Math.min(legalEntities.length * 46, 210);
    Animated.parallel([
      Animated.timing(submenuHeight, {
        toValue: opening ? maxH : 0,
        duration: 240,
        useNativeDriver: false,
      }),
      Animated.timing(submenuOpacity, {
        toValue: opening ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(chevronRotate, {
        toValue: opening ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const chevronAngle = chevronRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const headerMenus = menuItems
    .filter(
      item =>
        screenMapping[item.MenuId] &&
        item.Visible === '1' &&
        item.DisplayOnHeader === 'Yes',
    )
    .filter(
      (it, idx, arr) =>
        !!it?.MenuId && arr.findIndex(x => x.MenuId === it.MenuId) === idx,
    );

  const handleClose = () => {
    setCompanyOpen(false);
    onClose();
  };

  const goTo = screen => {
    handleClose();
    navigation.navigate(screen);
  };

  const handleMenuPress = menu => {
    handleClose();
    navigation.navigate(menu.MenuId, {
      userData,
      employeeId: userData?.employeeId,
      employeeName: userData?.employeeName,
      WorkerRecId: userData?.WorkerRecId,
      cameFrom: 'ActionPane',
    });
  };

  const handleCompanyPress = entity => {
    if (onCompanySelect) {
      onCompanySelect(entity.LegalEntity);
    }
    setCompanyOpen(false);
    onClose();
  };

  // Identity helpers
  const fullName = userData?.employeeName || userData?.name || 'User';
  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const dept = userData?.department || userData?.jobId || 'Employee';
  const empId = userData?.employeeId ? `ID ${userData.employeeId}` : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.overlay, {opacity: fadeAnim}]} />
      </TouchableWithoutFeedback>

      {/* Panel */}
      <Animated.View
        style={[
          styles.panel,
          {opacity: fadeAnim, transform: [{translateY: slideAnim}]},
        ]}>
        {/* Brand stripe */}
        <View style={[styles.brandStripe, {backgroundColor: P.primary}]} />

        {/* ── Identity card ─────────────────────────────────── */}
        <AnimatedRow delay={0}>
          <View style={styles.userCard}>
            <View style={[styles.avatarCircle, {backgroundColor: P.primary}]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {fullName}
              </Text>
              <Text style={styles.userMeta} numberOfLines={1}>
                {dept}
                {empId ? `  ·  ${empId}` : ''}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Ionicons
                name="close"
                size={conditionalFontScale(15, 16, 16, 16)}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>
        </AnimatedRow>

        <View style={styles.hairline} />

        {/* ── Scrollable body ────────────────────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.body}>
          {/* ACCOUNT */}
          <AnimatedRow delay={STAGGER}>
            <SectionLabel label="ACCOUNT" styles={styles} />
            <MenuRow
              iconName="person-outline"
              iconColor={P.primaryStrong}
              iconBg={P.tint}
              label="My Profile"
              sub="View and edit your information"
              onPress={() => goTo('Profile')}
              styles={styles}
            />
            <MenuRow
              iconName="settings-outline"
              iconColor="#6366F1"
              iconBg="#EDEFFD"
              label="Settings"
              sub="Language · Security · Date & Time"
              onPress={() => goTo('SettingsScreen')}
              styles={styles}
            />
          </AnimatedRow>

          {/* ORGANIZATION */}
          <AnimatedRow delay={STAGGER * 2}>
            <View style={styles.sectionGap} />
            <SectionLabel label="ORGANIZATION" styles={styles} />

            {/* Company accordion trigger */}
            <TouchableOpacity
              style={[styles.row, companyOpen && styles.rowActive]}
              onPress={toggleCompany}
              activeOpacity={0.7}>
              <IconBadge
                name="business-outline"
                color="#0D9488"
                bgColor="#CCFBF1"
                styles={styles}
              />
              <View style={styles.rowTextBlock}>
                <Text style={styles.rowLabel}>Switch Company</Text>
                {selectedLegalEntity ? (
                  <Text style={styles.rowSub} numberOfLines={1}>
                    {selectedLegalEntity.toUpperCase()}
                  </Text>
                ) : null}
              </View>
              <Animated.View style={{transform: [{rotate: chevronAngle}]}}>
                <Icon name="chevron-right" size={10} color="#CBD5E1" />
              </Animated.View>
            </TouchableOpacity>

            {/* Animated company list */}
            <Animated.View
              style={[
                styles.submenu,
                {maxHeight: submenuHeight, opacity: submenuOpacity},
              ]}>
              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                bounces={false}>
                {legalEntities.length > 0 ? (
                  legalEntities.map((entity, idx) => {
                    const isSel = selectedLegalEntity === entity.LegalEntity;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.submenuRow,
                          isSel && styles.submenuRowSelected,
                        ]}
                        onPress={() => handleCompanyPress(entity)}
                        activeOpacity={0.7}>
                        <View
                          style={[
                            styles.submenuStripe,
                            {
                              backgroundColor: isSel
                                ? '#0D9488'
                                : 'transparent',
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.submenuText,
                            isSel && styles.submenuTextSelected,
                          ]}
                          numberOfLines={1}>
                          {entity.LegalEntity.toUpperCase()}
                        </Text>
                        {isSel && (
                          <View
                            style={[
                              styles.checkCircle,
                              {backgroundColor: '#0D9488'},
                            ]}>
                            <Icon name="check" size={8} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>No companies available</Text>
                )}
              </ScrollView>
            </Animated.View>
          </AnimatedRow>

          {/* MODULES */}
          {headerMenus.length > 0 && (
            <AnimatedRow delay={STAGGER * 3}>
              <View style={styles.sectionGap} />
              <SectionLabel label="MODULES" styles={styles} />
              {headerMenus.map(item => (
                <MenuRow
                  key={item.MenuId}
                  iconName="apps-outline"
                  iconColor="#F59E0B"
                  iconBg="#FEF3C7"
                  label={item.Label || item.MenuId}
                  onPress={() => handleMenuPress(item)}
                  styles={styles}
                />
              ))}
            </AnimatedRow>
          )}

          <View style={styles.sectionGap} />
        </ScrollView>

        {/* Sign Out */}
        <AnimatedRow delay={STAGGER * 4}>
          <View style={styles.footerHairline} />
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={() => {
              handleClose();
              onLogout();
            }}
            activeOpacity={0.8}>
            <View style={styles.logoutIconWrap}>
              <Ionicons
                name="log-out-outline"
                size={conditionalFontScale(14, 15, 16, 16)}
                color="#DC2626"
              />
            </View>
            <Text style={styles.logoutLabel}>Sign Out</Text>
            <Icon name="chevron-right" size={10} color="#FCA5A5" />
          </TouchableOpacity>
        </AnimatedRow>
      </Animated.View>
    </Modal>
  );
};

const createStyles = T =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(15, 23, 42, 0.52)',
    },
    panel: {
      position: 'absolute',
      top: conditionalVerticalScale(52, 56, 60, 62),
      right: conditionalScale(10, 12, 14, 14),
      width: conditionalScale(238, 248, 260, 260),
      backgroundColor: T.cardBg,
      borderRadius: conditionalScale(14, 15, 16, 16),
      shadowColor: T.shadowColor,
      shadowOffset: {width: 0, height: 10},
      shadowOpacity: 0.2,
      shadowRadius: 28,
      elevation: 18,
      overflow: 'hidden',
    },
    brandStripe: {height: 3},

    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: conditionalScale(12, 13, 14, 14),
      paddingTop: conditionalVerticalScale(12, 13, 14, 14),
      paddingBottom: conditionalVerticalScale(10, 11, 12, 12),
    },
    avatarCircle: {
      width: conditionalScale(38, 40, 42, 42),
      height: conditionalScale(38, 40, 42, 42),
      borderRadius: conditionalScale(19, 20, 21, 21),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: conditionalScale(9, 10, 10, 10),
    },
    avatarText: {
      fontSize: conditionalFontScale(13, 14, 15, 15),
      fontWeight: '800',
      color: T.onPrimary,
      letterSpacing: 0.5,
    },
    userInfo: {flex: 1},
    userName: {
      fontSize: conditionalFontScale(13, 13, 14, 14),
      fontWeight: '700',
      color: T.titleText,
      letterSpacing: -0.2,
    },
    userMeta: {
      fontSize: conditionalFontScale(9, 9, 10, 10),
      color: T.subtitleText,
      fontWeight: '500',
      marginTop: 2,
    },
    closeBtn: {
      width: conditionalScale(26, 28, 30, 30),
      height: conditionalScale(26, 28, 30, 30),
      borderRadius: conditionalScale(13, 14, 15, 15),
      backgroundColor: T.cardHeadingBg,
      alignItems: 'center',
      justifyContent: 'center',
    },

    hairline: {height: 1, backgroundColor: T.cardDivider},
    footerHairline: {height: 1, backgroundColor: T.cardDivider},

    body: {
      paddingTop: conditionalVerticalScale(6, 7, 8, 8),
      paddingBottom: conditionalVerticalScale(2, 3, 4, 4),
    },
    sectionGap: {height: conditionalVerticalScale(4, 5, 6, 6)},
    sectionLabel: {
      fontSize: conditionalFontScale(9, 9, 10, 10),
      fontWeight: '700',
      color: T.subtitleText,
      letterSpacing: 1,
      paddingHorizontal: conditionalScale(14, 15, 16, 16),
      paddingTop: conditionalVerticalScale(4, 5, 6, 6),
      paddingBottom: conditionalVerticalScale(2, 3, 3, 3),
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: conditionalScale(10, 11, 12, 12),
      paddingVertical: conditionalVerticalScale(8, 9, 10, 10),
      borderRadius: conditionalScale(10, 10, 10, 10),
      marginHorizontal: conditionalScale(6, 7, 8, 8),
      marginVertical: conditionalVerticalScale(1, 1, 2, 2),
    },
    rowActive: {backgroundColor: T.blueBg},
    rowTextBlock: {flex: 1, marginLeft: conditionalScale(9, 9, 10, 10)},
    rowLabel: {
      fontSize: conditionalFontScale(12, 12, 13, 13),
      fontWeight: '600',
      color: T.titleText,
    },
    rowSub: {
      fontSize: conditionalFontScale(9, 9, 10, 10),
      color: T.subtitleText,
      fontWeight: '400',
      marginTop: 1,
    },

    iconBadge: {
      width: conditionalScale(30, 31, 32, 32),
      height: conditionalScale(30, 31, 32, 32),
      borderRadius: conditionalScale(8, 9, 9, 9),
      alignItems: 'center',
      justifyContent: 'center',
    },

    submenu: {
      overflow: 'hidden',
      marginHorizontal: conditionalScale(6, 7, 8, 8),
      borderRadius: conditionalScale(8, 9, 10, 10),
      backgroundColor: T.cardHeadingBg,
      borderWidth: 1,
      borderColor: T.cardDivider,
      marginBottom: conditionalVerticalScale(2, 3, 4, 4),
    },
    submenuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: conditionalVerticalScale(9, 10, 11, 11),
      paddingRight: conditionalScale(12, 13, 14, 14),
      borderBottomWidth: 1,
      borderBottomColor: T.rowDivider,
    },
    submenuRowSelected: {backgroundColor: '#F0FDFA'},
    submenuStripe: {
      width: 3,
      alignSelf: 'stretch',
      borderRadius: 2,
      marginRight: conditionalScale(8, 9, 10, 10),
    },
    submenuText: {
      flex: 1,
      fontSize: conditionalFontScale(11, 11, 12, 12),
      fontWeight: '600',
      color: T.subtitleText,
    },
    submenuTextSelected: {color: '#0D9488', fontWeight: '700'},
    checkCircle: {
      width: conditionalScale(16, 17, 18, 18),
      height: conditionalScale(16, 17, 18, 18),
      borderRadius: conditionalScale(9, 9, 9, 9),
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: conditionalScale(4, 5, 6, 6),
    },
    emptyText: {
      textAlign: 'center',
      fontSize: conditionalFontScale(10, 11, 11, 11),
      color: T.emptyText,
      paddingVertical: conditionalVerticalScale(10, 12, 14, 14),
    },

    logoutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: conditionalScale(12, 13, 14, 14),
      paddingVertical: conditionalVerticalScale(11, 12, 13, 13),
      backgroundColor: T.cardHeadingBg,
    },
    logoutIconWrap: {
      width: conditionalScale(30, 31, 32, 32),
      height: conditionalScale(30, 31, 32, 32),
      borderRadius: conditionalScale(8, 9, 9, 9),
      backgroundColor: '#FEE2E2',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: conditionalScale(9, 9, 10, 10),
    },
    logoutLabel: {
      flex: 1,
      fontSize: conditionalFontScale(12, 12, 13, 13),
      fontWeight: '700',
      color: '#DC2626',
      letterSpacing: 0.1,
    },
  });

export default ActionPaneMenuModal;
