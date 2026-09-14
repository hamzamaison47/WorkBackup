import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector, useDispatch} from 'react-redux';
import {
  selectDateFormat,
  selectTimeFormat,
  selectTimezone,
} from '../../../../store/selectors';
import {
  setDateFormat,
  setTimeFormat,
  setTimezone,
  DATE_FORMAT_OPTIONS,
  TIME_FORMAT_OPTIONS,
  TIMEZONE_OPTIONS,
} from '../../../../store/slices/dateFormatSlice';
import ActionPaneContainer from '../../../../components/ActionPaneContainer';
import usePalette from '../../../../hooks/usePalette';

const DateFormatSettingsScreen = () => {
  const dispatch = useDispatch();
  const P = usePalette();
  const styles = createStyles(P);

  const selectedFormat = useSelector(selectDateFormat);
  const selectedTimeFormat = useSelector(selectTimeFormat);
  const selectedTimezone = useSelector(selectTimezone);

  const [tzModalVisible, setTzModalVisible] = useState(false);
  const [tzSearch, setTzSearch] = useState('');

  const filteredTimezones = TIMEZONE_OPTIONS.filter(
    tz =>
      tz.label.toLowerCase().includes(tzSearch.toLowerCase()) ||
      tz.value.toLowerCase().includes(tzSearch.toLowerCase()),
  );

  const renderOption = ({option, isSelected, onPress, iconName}) => (
    <TouchableOpacity
      key={option.label}
      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={[styles.radio, isSelected && styles.radioSelected]}>
        {isSelected && <View style={styles.radioDot} />}
      </View>
      <View style={styles.optionContent}>
        <Text
          style={[
            styles.optionLabel,
            isSelected && styles.optionLabelSelected,
          ]}>
          {option.label}
        </Text>
        <View style={styles.exampleRow}>
          <MaterialCommunityIcons
            name={iconName}
            size={12}
            color={isSelected ? P.primaryStrong : '#9ca3af'}
          />
          <Text
            style={[
              styles.optionExample,
              isSelected && styles.optionExampleSelected,
            ]}>
            {option.example}
          </Text>
        </View>
      </View>
      {isSelected && (
        <MaterialCommunityIcons
          name="check-circle"
          size={22}
          color={P.primaryStrong}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <ActionPaneContainer
      pageTitle="Date & Time Format"
      isBackButton={false}
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive={true}
      showTabNavigator={true}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* ── Header Banner ── */}
        <LinearGradient
          colors={[P.primary, P.primary]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.headerContainer}>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={32}
              color={P.onPrimary}
            />
          </View>
          <Text style={styles.headerTitle}>Date & Time Format</Text>
          <Text style={styles.headerSubtitle}>
            Choose how dates and times appear across the entire app
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.currentBadge}>
              <MaterialCommunityIcons
                name="calendar"
                size={13}
                color={P.primaryStrong}
              />
              <Text style={styles.currentBadgeText} numberOfLines={1}>
                {selectedFormat.label}
              </Text>
            </View>
            <View style={styles.badgeDivider} />
            <View style={styles.currentBadge}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={13}
                color={P.primaryStrong}
              />
              <Text style={styles.currentBadgeText} numberOfLines={1}>
                {selectedTimeFormat.label}
              </Text>
            </View>
            <View style={styles.badgeDivider} />
            <View style={styles.currentBadge}>
              <MaterialCommunityIcons
                name="earth"
                size={13}
                color={P.primaryStrong}
              />
              <Text style={styles.currentBadgeText} numberOfLines={1}>
                {selectedTimezone.label}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Date Format ── */}
        <View style={styles.optionsSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="calendar-month"
              size={16}
              color={P.primaryStrong}
            />
            <Text style={styles.sectionLabel}>DATE FORMAT</Text>
          </View>
          {DATE_FORMAT_OPTIONS.map(option =>
            renderOption({
              option,
              isSelected: option.label === selectedFormat.label,
              onPress: () => dispatch(setDateFormat(option)),
              iconName: 'calendar-today',
            }),
          )}
        </View>

        <View style={styles.divider} />

        {/* ── Time Format ── */}
        <View style={styles.optionsSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={P.primaryStrong}
            />
            <Text style={styles.sectionLabel}>TIME FORMAT</Text>
          </View>
          {TIME_FORMAT_OPTIONS.map(option =>
            renderOption({
              option,
              isSelected: option.label === selectedTimeFormat.label,
              onPress: () => dispatch(setTimeFormat(option)),
              iconName: 'clock-outline',
            }),
          )}
        </View>

        <View style={styles.divider} />

        {/* ── Timezone ── */}
        <View style={styles.optionsSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="earth"
              size={16}
              color={P.primaryStrong}
            />
            <Text style={styles.sectionLabel}>TIME ZONE</Text>
          </View>

          <TouchableOpacity
            style={styles.timezoneSelector}
            onPress={() => setTzModalVisible(true)}
            activeOpacity={0.7}>
            <View style={styles.timezoneSelectorLeft}>
              <View style={styles.timezoneIconWrap}>
                <MaterialCommunityIcons
                  name="earth"
                  size={20}
                  color={P.primaryStrong}
                />
              </View>
              <View style={styles.timezoneSelectorTextWrap}>
                <Text style={styles.timezoneSelectorLabel} numberOfLines={1}>
                  {selectedTimezone.label}
                </Text>
                {selectedTimezone.offset !== '' && (
                  <Text style={styles.timezoneSelectorOffset}>
                    {selectedTimezone.offset}
                  </Text>
                )}
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={P.primaryStrong}
            />
          </TouchableOpacity>
        </View>

        {/* ── Info Note ── */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons
            name="information-outline"
            size={18}
            color={P.primaryStrong}
          />
          <Text style={styles.infoText}>
            Changes apply immediately to all date and time fields across the app
            and are saved automatically.
          </Text>
        </View>
      </ScrollView>

      {/* ── Timezone Modal ── */}
      <Modal
        visible={tzModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTzModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time Zone</Text>
              <TouchableOpacity
                onPress={() => {
                  setTzModalVisible(false);
                  setTzSearch('');
                }}>
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color="#374151"
                />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons
                name="magnify"
                size={18}
                color="#9ca3af"
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search timezone..."
                placeholderTextColor="#9ca3af"
                value={tzSearch}
                onChangeText={setTzSearch}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {tzSearch.length > 0 && (
                <TouchableOpacity onPress={() => setTzSearch('')}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={16}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Count */}
            <Text style={styles.tzCount}>
              {filteredTimezones.length} timezone
              {filteredTimezones.length !== 1 ? 's' : ''}
            </Text>

            {/* List */}
            <FlatList
              data={filteredTimezones}
              keyExtractor={item => item.value}
              showsVerticalScrollIndicator={true}
              style={styles.tzList}
              initialNumToRender={30}
              maxToRenderPerBatch={30}
              windowSize={10}
              getItemLayout={(data, index) => ({
                length: 57,
                offset: 57 * index,
                index,
              })}
              renderItem={({item}) => {
                const isSelected = item.value === selectedTimezone.value;
                return (
                  <TouchableOpacity
                    style={[styles.tzItem, isSelected && styles.tzItemSelected]}
                    onPress={() => {
                      dispatch(setTimezone(item));
                      setTzModalVisible(false);
                      setTzSearch('');
                    }}
                    activeOpacity={0.7}>
                    <View style={styles.tzItemLeft}>
                      <Text
                        style={[
                          styles.tzItemLabel,
                          isSelected && styles.tzItemLabelSelected,
                        ]}>
                        {item.label}
                      </Text>
                      {item.offset !== '' && (
                        <Text style={styles.tzItemOffset}>{item.offset}</Text>
                      )}
                    </View>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color={P.primaryStrong}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.tzSeparator} />}
            />
          </View>
        </View>
      </Modal>
    </ActionPaneContainer>
  );
};

const createStyles = P =>
  StyleSheet.create({
    scrollContent: {paddingBottom: 32},

    // Header
    headerContainer: {
      margin: 16,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
    },
    headerIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: P.onPrimary,
      marginBottom: 6,
    },
    headerSubtitle: {
      fontSize: 13,
      color: P.onPrimaryMuted,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 16,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 20,
      paddingHorizontal: 6,
      paddingVertical: 4,
    },
    currentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      gap: 4,
      maxWidth: 110,
    },
    badgeDivider: {width: 1, height: 16, backgroundColor: '#d1d5db'},
    currentBadgeText: {fontSize: 11, fontWeight: '600', color: P.primaryStrong},

    // Section
    optionsSection: {paddingHorizontal: 16, marginTop: 8},
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
      marginLeft: 2,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: P.primaryStrong,
      letterSpacing: 1,
    },
    divider: {
      height: 1,
      backgroundColor: '#e5e7eb',
      marginHorizontal: 16,
      marginVertical: 16,
    },

    // Option Card
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      borderWidth: 2,
      borderColor: '#f3f4f6',
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 2,
      gap: 12,
    },
    optionCardSelected: {
      borderColor: P.primaryStrong,
      backgroundColor: '#EBF3FB',
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#d1d5db',
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioSelected: {borderColor: P.primaryStrong},
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: P.primary,
    },
    optionContent: {flex: 1},
    optionLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 4,
    },
    optionLabelSelected: {color: P.primaryStrong},
    exampleRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
    optionExample: {fontSize: 12, color: '#9ca3af'},
    optionExampleSelected: {color: P.primaryStrong},

    // Timezone Selector Button
    timezoneSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#EBF3FB',
      borderRadius: 14,
      padding: 16,
      borderWidth: 2,
      borderColor: P.primaryStrong,
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    timezoneSelectorLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    timezoneIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    timezoneSelectorTextWrap: {flex: 1},
    timezoneSelectorLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: P.primaryStrong,
    },
    timezoneSelectorOffset: {fontSize: 12, color: '#6b7280', marginTop: 2},

    // Info
    infoCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: '#EBF3FB',
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 12,
      padding: 14,
      gap: 10,
      borderLeftWidth: 3,
      borderLeftColor: P.primaryStrong,
    },
    infoText: {flex: 1, fontSize: 12, color: P.primaryStrong, lineHeight: 18},

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: '#fff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: '80%',
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
    },
    modalTitle: {fontSize: 17, fontWeight: '700', color: '#111827'},
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f9fafb',
      margin: 16,
      marginBottom: 8,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },
    searchInput: {flex: 1, fontSize: 14, color: '#111827', padding: 0},
    tzCount: {
      fontSize: 11,
      color: '#9ca3af',
      marginHorizontal: 20,
      marginBottom: 8,
    },

    // Timezone List
    tzList: {flex: 1},
    tzItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      height: 57,
    },
    tzItemSelected: {backgroundColor: '#EBF3FB'},
    tzItemLeft: {flex: 1},
    tzItemLabel: {fontSize: 14, fontWeight: '500', color: '#374151'},
    tzItemLabelSelected: {color: P.primaryStrong, fontWeight: '600'},
    tzItemOffset: {fontSize: 12, color: '#9ca3af', marginTop: 2},
    tzSeparator: {
      height: 1,
      backgroundColor: '#f3f4f6',
      marginHorizontal: 20,
    },
  });

export default DateFormatSettingsScreen;
