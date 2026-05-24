// import React, {useState} from 'react';
// import {
//   Modal,
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   TouchableWithoutFeedback,
//   FlatList,
//   ScrollView,
//   Animated,
// } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import {screenMapping} from '../Controller/screenMapping';
// import {useNavigation} from '@react-navigation/native';
// import {useSelector} from 'react-redux';
// import {
//   conditionalScale,
//   conditionalVerticalScale,
//   conditionalFontScale,
//   borderRadius,
//   spacing,
//   iconSize,
// } from '../store/utils/scaling';

// const ActionPaneMenuModal = ({
//   visible,
//   onClose,
//   onLogout,
//   // company props
//   legalEntities = [],
//   selectedLegalEntity,
//   onCompanySelect,
// }) => {
//   const navigation = useNavigation();
//   const {menuItems} = useSelector(state => state.menuItem);
//   const {userData} = useSelector(state => state.user);
//   const [companySubmenuVisible, setCompanySubmenuVisible] = useState(false);

//   const headerMenus = menuItems.filter(
//     item =>
//       screenMapping[item.MenuId] &&
//       item.Visible === '1' &&
//       item.DisplayOnHeader === 'Yes',
//   );

//   const uniqueHeaderMenus = headerMenus.filter(
//     (it, idx, arr) =>
//       !!it?.MenuId && arr.findIndex(x => x.MenuId === it.MenuId) === idx,
//   );

//   const handleMenuPress = menu => {
//     onClose();
//     setCompanySubmenuVisible(false);
//     navigation.navigate(menu.MenuId, {
//       userData,
//       employeeId: userData?.employeeId,
//       employeeName: userData?.employeeName,
//       WorkerRecId: userData?.WorkerRecId,
//       cameFrom: 'ActionPane',
//     });
//   };

//   const handleClose = () => {
//     setCompanySubmenuVisible(false);
//     onClose();
//   };

//   const handleCompanyPress = entity => {
//     if (onCompanySelect) {
//       onCompanySelect(entity.LegalEntity);
//     }
//     setCompanySubmenuVisible(false);
//     onClose();
//   };

//   return (
//     <Modal
//       visible={visible}
//       transparent={true}
//       animationType="fade"
//       onRequestClose={handleClose}>
//       <TouchableWithoutFeedback onPress={handleClose}>
//         <View style={styles.overlay}>
//           <TouchableWithoutFeedback>
//             <View style={styles.modalContainer}>
//               {/* ── Header ── */}
//               <View style={styles.header}>
//                 <Text style={styles.title}>Menu Options</Text>
//                 <TouchableOpacity
//                   onPress={handleClose}
//                   style={styles.closeButton}>
//                   <Ionicons
//                     name="close"
//                     size={conditionalFontScale(20, 21, 22, 24)}
//                     color="#333"
//                   />
//                 </TouchableOpacity>
//               </View>

//               {/* ── Company Dropdown Row ── */}
//               <View style={styles.companyRowWrapper}>
//                 <TouchableOpacity
//                   style={styles.companyRow}
//                   onPress={() => setCompanySubmenuVisible(prev => !prev)}
//                   activeOpacity={0.75}>
//                   <View style={styles.iconContainer}>
//                     <Ionicons
//                       name="business-outline"
//                       size={conditionalFontScale(16, 17, 18, 20)}
//                       color="#0A66C2"
//                     />
//                   </View>
//                   <View style={styles.companyTextBlock}>
//                     <Text style={styles.menuText}>Company</Text>
//                     {selectedLegalEntity ? (
//                       <Text style={styles.companySubText} numberOfLines={1}>
//                         {selectedLegalEntity.toUpperCase()}
//                       </Text>
//                     ) : null}
//                   </View>
//                   <Icon
//                     name={
//                       companySubmenuVisible ? 'chevron-left' : 'chevron-right'
//                     }
//                     size={conditionalFontScale(10, 11, 11, 12)}
//                     color="#999"
//                   />
//                 </TouchableOpacity>

//                 {/* ── Company Submenu (slides in below on same container) ── */}
//                 {companySubmenuVisible && (
//                   <View style={styles.submenuContainer}>
//                     <Text style={styles.submenuTitle}>Select Company</Text>
//                     <ScrollView
//                       showsVerticalScrollIndicator={false}
//                       style={styles.submenuScroll}>
//                       {legalEntities && legalEntities.length > 0 ? (
//                         legalEntities.map((entity, index) => {
//                           const isSelected =
//                             selectedLegalEntity === entity.LegalEntity;
//                           return (
//                             <TouchableOpacity
//                               key={index}
//                               style={[
//                                 styles.submenuItem,
//                                 isSelected && styles.submenuItemSelected,
//                               ]}
//                               onPress={() => handleCompanyPress(entity)}
//                               activeOpacity={0.7}>
//                               <Text
//                                 style={[
//                                   styles.submenuItemText,
//                                   isSelected && styles.submenuItemTextSelected,
//                                 ]}
//                                 numberOfLines={1}>
//                                 {entity.LegalEntity.toUpperCase()}
//                               </Text>
//                               {isSelected && (
//                                 <Icon
//                                   name="check"
//                                   size={conditionalFontScale(11, 12, 12, 13)}
//                                   color="#0A66C2"
//                                 />
//                               )}
//                             </TouchableOpacity>
//                           );
//                         })
//                       ) : (
//                         <Text style={styles.emptyText}>
//                           No companies available
//                         </Text>
//                       )}
//                     </ScrollView>
//                   </View>
//                 )}
//               </View>

//               <View style={styles.sectionDivider} />

//               {/* ── Menu Items ── */}
//               <FlatList
//                 data={uniqueHeaderMenus}
//                 keyExtractor={item => item.MenuId}
//                 scrollEnabled={false}
//                 renderItem={({item}) => (
//                   <TouchableOpacity
//                     style={styles.menuItem}
//                     onPress={() => handleMenuPress(item)}
//                     activeOpacity={0.75}>
//                     <View style={styles.iconContainer}>
//                       <Ionicons
//                         name="apps-outline"
//                         size={conditionalFontScale(16, 17, 18, 20)}
//                         color="#0A66C2"
//                       />
//                     </View>
//                     <Text style={styles.menuText}>
//                       {item.Label || item.MenuId}
//                     </Text>
//                   </TouchableOpacity>
//                 )}
//                 ListEmptyComponent={
//                   <Text style={styles.emptyText}>
//                     No quick actions available
//                   </Text>
//                 }
//               />

//               <View style={styles.divider} />

//               {/* ── Logout ── */}
//               <TouchableOpacity
//                 style={styles.logoutButton}
//                 onPress={() => {
//                   handleClose();
//                   onLogout();
//                 }}
//                 activeOpacity={0.8}>
//                 <Ionicons
//                   name="log-out-outline"
//                   size={conditionalFontScale(16, 17, 18, 20)}
//                   color="#DC2626"
//                 />
//                 <Text style={styles.logoutText}>Logout</Text>
//               </TouchableOpacity>
//             </View>
//           </TouchableWithoutFeedback>
//         </View>
//       </TouchableWithoutFeedback>
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.45)',
//     justifyContent: 'flex-start',
//     alignItems: 'flex-end',
//   },
//   modalContainer: {
//     backgroundColor: 'white',
//     width: conditionalScale(220, 235, 250, 270),
//     marginTop: conditionalVerticalScale(54, 58, 62, 66),
//     marginRight: conditionalScale(8, 10, 12, 14),
//     borderRadius: borderRadius.lg,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 6},
//     shadowOpacity: 0.18,
//     shadowRadius: 14,
//     elevation: 10,
//     overflow: 'hidden',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: conditionalScale(12, 14, 16, 18),
//     paddingVertical: conditionalVerticalScale(10, 11, 12, 14),
//     borderBottomWidth: 1,
//     borderBottomColor: '#F0F0F0',
//     backgroundColor: '#FAFAFA',
//   },
//   title: {
//     fontSize: conditionalFontScale(13, 14, 15, 16),
//     fontWeight: '700',
//     color: '#1A1A2E',
//   },
//   closeButton: {
//     padding: conditionalScale(3, 4, 4, 5),
//     borderRadius: borderRadius.sm,
//   },
//   // ── Company Row ──
//   companyRowWrapper: {
//     borderBottomWidth: 1,
//     borderBottomColor: '#F5F5F5',
//   },
//   companyRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: conditionalScale(12, 14, 14, 16),
//     paddingVertical: conditionalVerticalScale(10, 11, 12, 14),
//   },
//   companyTextBlock: {
//     flex: 1,
//   },
//   companySubText: {
//     fontSize: conditionalFontScale(9, 10, 10, 11),
//     color: '#0A66C2',
//     fontWeight: '600',
//     marginTop: 1,
//   },
//   // ── Company Submenu ──
//   submenuContainer: {
//     backgroundColor: '#F8FBFF',
//     borderTopWidth: 1,
//     borderTopColor: '#E8F1FB',
//     paddingBottom: conditionalVerticalScale(4, 5, 6, 7),
//   },
//   submenuTitle: {
//     fontSize: conditionalFontScale(10, 11, 11, 12),
//     fontWeight: '700',
//     color: '#6B7280',
//     paddingHorizontal: conditionalScale(14, 16, 16, 18),
//     paddingVertical: conditionalVerticalScale(6, 7, 8, 9),
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },
//   submenuScroll: {
//     maxHeight: conditionalVerticalScale(140, 160, 180, 200),
//   },
//   submenuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: conditionalScale(16, 18, 18, 20),
//     paddingVertical: conditionalVerticalScale(8, 9, 10, 11),
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEF2F7',
//   },
//   submenuItemSelected: {
//     backgroundColor: '#EBF4FF',
//   },
//   submenuItemText: {
//     fontSize: conditionalFontScale(11, 12, 12, 13),
//     fontWeight: '600',
//     color: '#374151',
//     flex: 1,
//   },
//   submenuItemTextSelected: {
//     color: '#0A66C2',
//   },
//   // ── Dividers ──
//   sectionDivider: {
//     height: 1,
//     backgroundColor: '#F0F0F0',
//   },
//   divider: {
//     height: 1,
//     backgroundColor: '#EAEAEA',
//   },
//   // ── Menu Items ──
//   menuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: conditionalScale(12, 14, 14, 16),
//     paddingVertical: conditionalVerticalScale(10, 11, 12, 14),
//     borderBottomWidth: 1,
//     borderBottomColor: '#F5F5F5',
//   },
//   iconContainer: {
//     width: conditionalScale(28, 30, 32, 36),
//     alignItems: 'center',
//   },
//   menuText: {
//     fontSize: conditionalFontScale(12, 13, 14, 15),
//     color: '#1A1A2E',
//     fontWeight: '500',
//     marginLeft: conditionalScale(6, 7, 8, 10),
//     flex: 1,
//   },
//   emptyText: {
//     paddingHorizontal: conditionalScale(12, 14, 16, 18),
//     paddingVertical: conditionalVerticalScale(10, 12, 14, 16),
//     color: '#9CA3AF',
//     textAlign: 'center',
//     fontSize: conditionalFontScale(11, 12, 12, 13),
//   },
//   // ── Logout ──
//   logoutButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: conditionalScale(12, 14, 14, 16),
//     paddingVertical: conditionalVerticalScale(12, 13, 14, 16),
//     backgroundColor: '#FFF4F4',
//   },
//   logoutText: {
//     marginLeft: conditionalScale(8, 10, 10, 12),
//     fontSize: conditionalFontScale(12, 13, 14, 15),
//     color: '#DC2626',
//     fontWeight: '700',
//   },
// });

// export default ActionPaneMenuModal;
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
import {useSelector} from 'react-redux';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
  borderRadius,
} from '../store/utils/scaling';

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
const SectionLabel = ({label}) => (
  <Text style={styles.sectionLabel}>{label}</Text>
);

// ─── Icon badge ────────────────────────────────────────────────────────────
const IconBadge = ({name, color, bgColor, lib = 'ion'}) => (
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
}) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <IconBadge name={iconName} color={iconColor} bgColor={iconBg} lib={lib} />
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
        <View style={styles.brandStripe} />

        {/* ── Identity card ─────────────────────────────────── */}
        <AnimatedRow delay={0}>
          <View style={styles.userCard}>
            <View style={styles.avatarCircle}>
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
            <SectionLabel label="ACCOUNT" />
            <MenuRow
              iconName="person-outline"
              iconColor="#0A66C2"
              iconBg="#E8F1FB"
              label="My Profile"
              sub="View and edit your information"
              onPress={() => goTo('Profile')}
            />
            <MenuRow
              iconName="settings-outline"
              iconColor="#6366F1"
              iconBg="#EDEFFD"
              label="Settings"
              sub="Language · Security · Date & Time"
              onPress={() => goTo('SettingsScreen')}
            />
          </AnimatedRow>

          {/* ORGANIZATION */}
          <AnimatedRow delay={STAGGER * 2}>
            <View style={styles.sectionGap} />
            <SectionLabel label="ORGANIZATION" />

            {/* Company accordion trigger */}
            <TouchableOpacity
              style={[styles.row, companyOpen && styles.rowActive]}
              onPress={toggleCompany}
              activeOpacity={0.7}>
              <IconBadge
                name="business-outline"
                color="#0D9488"
                bgColor="#CCFBF1"
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
              <SectionLabel label="MODULES" />
              {headerMenus.map(item => (
                <MenuRow
                  key={item.MenuId}
                  iconName="apps-outline"
                  iconColor="#F59E0B"
                  iconBg="#FEF3C7"
                  label={item.Label || item.MenuId}
                  onPress={() => handleMenuPress(item)}
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

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
  },
  panel: {
    position: 'absolute',
    top: conditionalVerticalScale(52, 56, 60, 62),
    right: conditionalScale(10, 12, 14, 14),
    width: conditionalScale(238, 248, 260, 260),
    backgroundColor: '#FFFFFF',
    borderRadius: conditionalScale(14, 15, 16, 16),
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 18,
    overflow: 'hidden',
  },
  brandStripe: {height: 3, backgroundColor: '#0A66C2'},

  // User card
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
    backgroundColor: '#0A66C2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: conditionalScale(9, 10, 10, 10),
  },
  avatarText: {
    fontSize: conditionalFontScale(13, 14, 15, 15),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  userInfo: {flex: 1},
  userName: {
    fontSize: conditionalFontScale(13, 13, 14, 14),
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  userMeta: {
    fontSize: conditionalFontScale(9, 9, 10, 10),
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: conditionalScale(26, 28, 30, 30),
    height: conditionalScale(26, 28, 30, 30),
    borderRadius: conditionalScale(13, 14, 15, 15),
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dividers
  hairline: {height: 1, backgroundColor: '#F1F5F9'},
  footerHairline: {height: 1, backgroundColor: '#FEE2E2'},

  // Body
  body: {
    paddingTop: conditionalVerticalScale(6, 7, 8, 8),
    paddingBottom: conditionalVerticalScale(2, 3, 4, 4),
  },
  sectionGap: {height: conditionalVerticalScale(4, 5, 6, 6)},
  sectionLabel: {
    fontSize: conditionalFontScale(9, 9, 10, 10),
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    paddingHorizontal: conditionalScale(14, 15, 16, 16),
    paddingTop: conditionalVerticalScale(4, 5, 6, 6),
    paddingBottom: conditionalVerticalScale(2, 3, 3, 3),
  },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(10, 11, 12, 12),
    paddingVertical: conditionalVerticalScale(8, 9, 10, 10),
    borderRadius: conditionalScale(10, 10, 10, 10),
    marginHorizontal: conditionalScale(6, 7, 8, 8),
    marginVertical: conditionalVerticalScale(1, 1, 2, 2),
  },
  rowActive: {backgroundColor: '#F0F9FF'},
  rowTextBlock: {flex: 1, marginLeft: conditionalScale(9, 9, 10, 10)},
  rowLabel: {
    fontSize: conditionalFontScale(12, 12, 13, 13),
    fontWeight: '600',
    color: '#1E293B',
  },
  rowSub: {
    fontSize: conditionalFontScale(9, 9, 10, 10),
    color: '#94A3B8',
    fontWeight: '400',
    marginTop: 1,
  },

  // Icon badge
  iconBadge: {
    width: conditionalScale(30, 31, 32, 32),
    height: conditionalScale(30, 31, 32, 32),
    borderRadius: conditionalScale(8, 9, 9, 9),
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Submenu
  submenu: {
    overflow: 'hidden',
    marginHorizontal: conditionalScale(6, 7, 8, 8),
    borderRadius: conditionalScale(8, 9, 10, 10),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: conditionalVerticalScale(2, 3, 4, 4),
  },
  submenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: conditionalVerticalScale(9, 10, 11, 11),
    paddingRight: conditionalScale(12, 13, 14, 14),
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
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
    color: '#475569',
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
    color: '#CBD5E1',
    paddingVertical: conditionalVerticalScale(10, 12, 14, 14),
  },

  // Logout
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(12, 13, 14, 14),
    paddingVertical: conditionalVerticalScale(11, 12, 13, 13),
    backgroundColor: '#FFF8F8',
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
