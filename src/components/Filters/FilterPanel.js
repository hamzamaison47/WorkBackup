import React, {useRef, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import useAppTokens from '../AppComponentsDesign/useAppTokens';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
} from '../../store/utils/scaling';
import {DATE_PRESETS} from '../../store/utils/dateFilter';

const SORT_OPTIONS = [
  {key: 'desc', label: 'Newest first'},
  {key: 'asc', label: 'Oldest first'},
  {key: null, label: 'None'},
];

// ─────────────────────────────────────────────────────────────────────────────
//  FilterPanel — right-anchored consolidated filter sheet with opt-in sections:
//  Document Type (multi-select), Date (single-select presets), Sort (asc/desc).
//  Each section renders ONLY when its enabling prop is on — no empty headers.
//  Mirrors ActionPaneMenuModal's animated right panel, themed via T.* tokens.
// ─────────────────────────────────────────────────────────────────────────────
const FilterPanel = ({
  visible,
  onClose,
  // Document type
  showDocumentTypeFilter,
  documentTypes = [],
  selectedDocumentTypes = [],
  onDocumentTypeChange = () => {},
  // Date range
  showDateFilter,
  selectedDateRange = 'all',
  onDateRangeChange = () => {},
  // Sort (orthogonal — reuses the screen's existing onSortChange path)
  showSortControl,
  activeSortOrder = null,
  onSortChange = () => {},
}) => {
  const T = useAppTokens();

  const slideAnim = useRef(new Animated.Value(-40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(-40);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
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
  }, [visible, slideAnim, fadeAnim]);

  const showDocSection = showDocumentTypeFilter && documentTypes.length > 0;
  const dateActive = selectedDateRange && selectedDateRange !== 'all';

  const toggleType = type => {
    const next = selectedDocumentTypes.includes(type)
      ? selectedDocumentTypes.filter(item => item !== type)
      : [...selectedDocumentTypes, type];
    onDocumentTypeChange(next);
  };

  const activeCount =
    selectedDocumentTypes.length +
    (dateActive ? 1 : 0) +
    (activeSortOrder ? 1 : 0);
  const hasSelection = activeCount > 0;

  const clearAll = () => {
    if (selectedDocumentTypes.length > 0) {
      onDocumentTypeChange([]);
    }
    if (dateActive) {
      onDateRangeChange('all');
    }
    if (activeSortOrder) {
      onSortChange(null);
    }
  };

  const panelStyle = {
    position: 'absolute',
    top: conditionalVerticalScale(52, 56, 60, 62),
    right: conditionalScale(10, 12, 14, 14),
    width: conditionalScale(232, 242, 254, 254),
    maxHeight: conditionalVerticalScale(420, 460, 500, 520),
    backgroundColor: T.cardBg,
    borderRadius: conditionalScale(14, 15, 16, 16),
    shadowColor: T.shadowColor,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 18,
    overflow: 'hidden',
  };

  // A single-select row (radio) used by the Date and Sort sections.
  const renderRadioRow = (key, label, isSel, onPress) => (
    <TouchableOpacity
      key={label}
      onPress={onPress}
      activeOpacity={0.7}
      style={[FP.row, isSel && {backgroundColor: T.blueBg}]}>
      <View style={[FP.radio, {borderColor: isSel ? T.blue : T.chevronColor}]}>
        {isSel && <View style={[FP.radioDot, {backgroundColor: T.blue}]} />}
      </View>
      <Text style={[FP.rowText, {color: isSel ? T.blue : T.titleText}]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[FP.overlay, {opacity: fadeAnim}]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          panelStyle,
          {opacity: fadeAnim, transform: [{translateY: slideAnim}]},
        ]}>
        {/* Header */}
        <View style={[FP.header, {borderBottomColor: T.cardDivider}]}>
          <Text style={[FP.title, {color: T.titleText}]}>Filter</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <FeatherIcon
              name="x"
              size={conditionalFontScale(16, 17, 18, 18)}
              color={T.subtitleText}
            />
          </TouchableOpacity>
        </View>

        {/* Clear All — resets every active facet */}
        <TouchableOpacity
          onPress={clearAll}
          disabled={!hasSelection}
          activeOpacity={0.7}
          style={FP.clearRow}>
          <FeatherIcon
            name="trash-2"
            size={conditionalFontScale(12, 13, 13, 14)}
            color={hasSelection ? T.red : T.subtitleText}
          />
          <Text
            style={[
              FP.clearText,
              {color: hasSelection ? T.red : T.subtitleText},
            ]}>
            Clear All{hasSelection ? ` (${activeCount})` : ''}
          </Text>
        </TouchableOpacity>

        <View style={[FP.divider, {backgroundColor: T.cardDivider}]} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={FP.listContent}>
          {/* ── Document Type (multi-select) ── */}
          {showDocSection && (
            <>
              <Text style={[FP.sectionLabel, {color: T.headingText}]}>
                Document Type
              </Text>
              {documentTypes.map(type => {
                const isSel = selectedDocumentTypes.includes(type);
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => toggleType(type)}
                    activeOpacity={0.7}
                    style={[FP.row, isSel && {backgroundColor: T.blueBg}]}>
                    <View
                      style={[
                        FP.checkbox,
                        {
                          borderColor: isSel ? T.blue : T.chevronColor,
                          backgroundColor: isSel ? T.blue : 'transparent',
                        },
                      ]}>
                      {isSel && (
                        <FeatherIcon
                          name="check"
                          size={conditionalFontScale(11, 12, 12, 13)}
                          color="#fff"
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        FP.rowText,
                        {color: isSel ? T.blue : T.titleText},
                      ]}
                      numberOfLines={2}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* ── Date (single-select presets) ── */}
          {showDateFilter && (
            <>
              {showDocSection && (
                <View
                  style={[FP.sectionDivider, {backgroundColor: T.cardDivider}]}
                />
              )}
              <Text style={[FP.sectionLabel, {color: T.headingText}]}>
                Date
              </Text>
              {DATE_PRESETS.map(preset =>
                renderRadioRow(
                  preset.key,
                  preset.label,
                  (selectedDateRange || 'all') === preset.key,
                  () => onDateRangeChange(preset.key),
                ),
              )}
            </>
          )}

          {/* ── Sort (single-select) ── */}
          {showSortControl && (
            <>
              {(showDocSection || showDateFilter) && (
                <View
                  style={[FP.sectionDivider, {backgroundColor: T.cardDivider}]}
                />
              )}
              <Text style={[FP.sectionLabel, {color: T.headingText}]}>
                Sort by date
              </Text>
              {SORT_OPTIONS.map(opt =>
                renderRadioRow(
                  opt.key,
                  opt.label,
                  (activeSortOrder || null) === opt.key,
                  () => onSortChange(opt.key),
                ),
              )}
            </>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

// ✅ layout/spacing only — colors come from T.* inline
const FP = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: conditionalScale(14, 15, 16, 16),
    paddingVertical: conditionalVerticalScale(11, 12, 13, 13),
    borderBottomWidth: 1,
  },
  title: {
    fontSize: conditionalFontScale(13, 14, 14, 15),
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  clearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(6, 6, 7, 7),
    paddingHorizontal: conditionalScale(14, 15, 16, 16),
    paddingVertical: conditionalVerticalScale(9, 10, 11, 11),
  },
  clearText: {
    fontSize: conditionalFontScale(11, 12, 12, 13),
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginHorizontal: conditionalScale(14, 15, 16, 16),
  },
  sectionDivider: {
    height: 1,
    marginHorizontal: conditionalScale(14, 15, 16, 16),
    marginTop: conditionalVerticalScale(6, 7, 8, 8),
  },
  sectionLabel: {
    fontSize: conditionalFontScale(9, 9, 10, 10),
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    paddingHorizontal: conditionalScale(14, 15, 16, 16),
    paddingTop: conditionalVerticalScale(8, 9, 10, 10),
    paddingBottom: conditionalVerticalScale(3, 4, 4, 4),
  },
  listContent: {
    paddingVertical: conditionalVerticalScale(4, 5, 6, 6),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(10, 11, 12, 12),
    paddingHorizontal: conditionalScale(12, 13, 14, 14),
    paddingVertical: conditionalVerticalScale(9, 10, 11, 11),
    marginHorizontal: conditionalScale(6, 7, 8, 8),
    borderRadius: conditionalScale(8, 9, 10, 10),
  },
  checkbox: {
    width: conditionalScale(18, 19, 20, 20),
    height: conditionalScale(18, 19, 20, 20),
    borderRadius: conditionalScale(5, 5, 6, 6),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: conditionalScale(18, 19, 20, 20),
    height: conditionalScale(18, 19, 20, 20),
    borderRadius: 99,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: conditionalScale(9, 10, 10, 11),
    height: conditionalScale(9, 10, 10, 11),
    borderRadius: 99,
  },
  rowText: {
    flex: 1,
    fontSize: conditionalFontScale(12, 12, 13, 13),
    fontWeight: '500',
  },
});

export default FilterPanel;
