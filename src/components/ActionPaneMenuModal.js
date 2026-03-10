import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  FlatList,
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
  spacing,
  iconSize,
} from '../store/utils/scaling';

const ActionPaneMenuModal = ({
  visible,
  onClose,
  onLogout,
  // company props
  legalEntities = [],
  selectedLegalEntity,
  onCompanySelect,
}) => {
  const navigation = useNavigation();
  const {menuItems} = useSelector(state => state.menuItem);
  const {userData} = useSelector(state => state.user);
  const [companySubmenuVisible, setCompanySubmenuVisible] = useState(false);

  const headerMenus = menuItems.filter(
    item =>
      screenMapping[item.MenuId] &&
      item.Visible === '1' &&
      item.DisplayOnHeader === 'Yes',
  );

  const uniqueHeaderMenus = headerMenus.filter(
    (it, idx, arr) =>
      !!it?.MenuId && arr.findIndex(x => x.MenuId === it.MenuId) === idx,
  );

  const handleMenuPress = menu => {
    onClose();
    setCompanySubmenuVisible(false);
    navigation.navigate(menu.MenuId, {
      userData,
      employeeId: userData?.employeeId,
      employeeName: userData?.employeeName,
      WorkerRecId: userData?.WorkerRecId,
      cameFrom: 'ActionPane',
    });
  };

  const handleClose = () => {
    setCompanySubmenuVisible(false);
    onClose();
  };

  const handleCompanyPress = entity => {
    if (onCompanySelect) {
      onCompanySelect(entity.LegalEntity);
    }
    setCompanySubmenuVisible(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* ── Header ── */}
              <View style={styles.header}>
                <Text style={styles.title}>Menu Options</Text>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeButton}>
                  <Ionicons
                    name="close"
                    size={conditionalFontScale(20, 21, 22, 24)}
                    color="#333"
                  />
                </TouchableOpacity>
              </View>

              {/* ── Company Dropdown Row ── */}
              <View style={styles.companyRowWrapper}>
                <TouchableOpacity
                  style={styles.companyRow}
                  onPress={() => setCompanySubmenuVisible(prev => !prev)}
                  activeOpacity={0.75}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="business-outline"
                      size={conditionalFontScale(16, 17, 18, 20)}
                      color="#0A66C2"
                    />
                  </View>
                  <View style={styles.companyTextBlock}>
                    <Text style={styles.menuText}>Company</Text>
                    {selectedLegalEntity ? (
                      <Text style={styles.companySubText} numberOfLines={1}>
                        {selectedLegalEntity.toUpperCase()}
                      </Text>
                    ) : null}
                  </View>
                  <Icon
                    name={
                      companySubmenuVisible ? 'chevron-left' : 'chevron-right'
                    }
                    size={conditionalFontScale(10, 11, 11, 12)}
                    color="#999"
                  />
                </TouchableOpacity>

                {/* ── Company Submenu (slides in below on same container) ── */}
                {companySubmenuVisible && (
                  <View style={styles.submenuContainer}>
                    <Text style={styles.submenuTitle}>Select Company</Text>
                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      style={styles.submenuScroll}>
                      {legalEntities && legalEntities.length > 0 ? (
                        legalEntities.map((entity, index) => {
                          const isSelected =
                            selectedLegalEntity === entity.LegalEntity;
                          return (
                            <TouchableOpacity
                              key={index}
                              style={[
                                styles.submenuItem,
                                isSelected && styles.submenuItemSelected,
                              ]}
                              onPress={() => handleCompanyPress(entity)}
                              activeOpacity={0.7}>
                              <Text
                                style={[
                                  styles.submenuItemText,
                                  isSelected && styles.submenuItemTextSelected,
                                ]}
                                numberOfLines={1}>
                                {entity.LegalEntity.toUpperCase()}
                              </Text>
                              {isSelected && (
                                <Icon
                                  name="check"
                                  size={conditionalFontScale(11, 12, 12, 13)}
                                  color="#0A66C2"
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <Text style={styles.emptyText}>
                          No companies available
                        </Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.sectionDivider} />

              {/* ── Menu Items ── */}
              <FlatList
                data={uniqueHeaderMenus}
                keyExtractor={item => item.MenuId}
                scrollEnabled={false}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleMenuPress(item)}
                    activeOpacity={0.75}>
                    <View style={styles.iconContainer}>
                      <Ionicons
                        name="apps-outline"
                        size={conditionalFontScale(16, 17, 18, 20)}
                        color="#0A66C2"
                      />
                    </View>
                    <Text style={styles.menuText}>
                      {item.Label || item.MenuId}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    No quick actions available
                  </Text>
                }
              />

              <View style={styles.divider} />

              {/* ── Logout ── */}
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => {
                  handleClose();
                  onLogout();
                }}
                activeOpacity={0.8}>
                <Ionicons
                  name="log-out-outline"
                  size={conditionalFontScale(16, 17, 18, 20)}
                  color="#DC2626"
                />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    width: conditionalScale(220, 235, 250, 270),
    marginTop: conditionalVerticalScale(54, 58, 62, 66),
    marginRight: conditionalScale(8, 10, 12, 14),
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(12, 14, 16, 18),
    paddingVertical: conditionalVerticalScale(10, 11, 12, 14),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  title: {
    fontSize: conditionalFontScale(13, 14, 15, 16),
    fontWeight: '700',
    color: '#1A1A2E',
  },
  closeButton: {
    padding: conditionalScale(3, 4, 4, 5),
    borderRadius: borderRadius.sm,
  },
  // ── Company Row ──
  companyRowWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(12, 14, 14, 16),
    paddingVertical: conditionalVerticalScale(10, 11, 12, 14),
  },
  companyTextBlock: {
    flex: 1,
  },
  companySubText: {
    fontSize: conditionalFontScale(9, 10, 10, 11),
    color: '#0A66C2',
    fontWeight: '600',
    marginTop: 1,
  },
  // ── Company Submenu ──
  submenuContainer: {
    backgroundColor: '#F8FBFF',
    borderTopWidth: 1,
    borderTopColor: '#E8F1FB',
    paddingBottom: conditionalVerticalScale(4, 5, 6, 7),
  },
  submenuTitle: {
    fontSize: conditionalFontScale(10, 11, 11, 12),
    fontWeight: '700',
    color: '#6B7280',
    paddingHorizontal: conditionalScale(14, 16, 16, 18),
    paddingVertical: conditionalVerticalScale(6, 7, 8, 9),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  submenuScroll: {
    maxHeight: conditionalVerticalScale(140, 160, 180, 200),
  },
  submenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: conditionalScale(16, 18, 18, 20),
    paddingVertical: conditionalVerticalScale(8, 9, 10, 11),
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  submenuItemSelected: {
    backgroundColor: '#EBF4FF',
  },
  submenuItemText: {
    fontSize: conditionalFontScale(11, 12, 12, 13),
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  submenuItemTextSelected: {
    color: '#0A66C2',
  },
  // ── Dividers ──
  sectionDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  divider: {
    height: 1,
    backgroundColor: '#EAEAEA',
  },
  // ── Menu Items ──
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(12, 14, 14, 16),
    paddingVertical: conditionalVerticalScale(10, 11, 12, 14),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  iconContainer: {
    width: conditionalScale(28, 30, 32, 36),
    alignItems: 'center',
  },
  menuText: {
    fontSize: conditionalFontScale(12, 13, 14, 15),
    color: '#1A1A2E',
    fontWeight: '500',
    marginLeft: conditionalScale(6, 7, 8, 10),
    flex: 1,
  },
  emptyText: {
    paddingHorizontal: conditionalScale(12, 14, 16, 18),
    paddingVertical: conditionalVerticalScale(10, 12, 14, 16),
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: conditionalFontScale(11, 12, 12, 13),
  },
  // ── Logout ──
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(12, 14, 14, 16),
    paddingVertical: conditionalVerticalScale(12, 13, 14, 16),
    backgroundColor: '#FFF4F4',
  },
  logoutText: {
    marginLeft: conditionalScale(8, 10, 10, 12),
    fontSize: conditionalFontScale(12, 13, 14, 15),
    color: '#DC2626',
    fontWeight: '700',
  },
});

export default ActionPaneMenuModal;
