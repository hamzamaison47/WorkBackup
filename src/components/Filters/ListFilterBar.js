import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import useAppTokens from '../AppComponentsDesign/useAppTokens';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
} from '../../store/utils/scaling';
import FilterPanel from './FilterPanel';

// ─────────────────────────────────────────────────────────────────────────────
//  ListFilterBar — body control for the two multi-type screens (WorkItems + ESS).
//  Renders a right-aligned "sliders" trigger (with a badge) below the header
//  pills that opens the shared FilterPanel showing ONLY the Document Type
//  section. Date + Sort live in the universal header trigger, not here. State
//  comes from a useListFilters() bundle passed as `filters`; renders nothing on
//  screens without a documentType field (documentTypes is empty).
// ─────────────────────────────────────────────────────────────────────────────
const ListFilterBar = ({filters, showDocumentTypeFilter = false}) => {
  const T = useAppTokens();
  const [visible, setVisible] = useState(false);

  const {
    documentTypes = [],
    selectedDocumentTypes = [],
    onDocumentTypeChange = () => {},
  } = filters || {};

  const showDocSection = showDocumentTypeFilter && documentTypes.length > 0;
  if (!showDocSection) {
    return null;
  }

  // Badge reflects only this trigger's facet — selected document types.
  const activeCount = selectedDocumentTypes.length;
  const active = activeCount > 0;

  return (
    <View style={LFB.bar}>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
        style={[
          LFB.trigger,
          {
            backgroundColor: T.cardBg,
            borderColor: active ? T.blue : T.cardDivider,
          },
        ]}>
        <FeatherIcon
          name="sliders"
          size={conditionalFontScale(14, 15, 15, 16)}
          color={active ? T.blue : T.subtitleText}
        />
        <Text
          style={[LFB.triggerText, {color: active ? T.blue : T.subtitleText}]}>
          Filter
        </Text>
        {active && (
          <View style={[LFB.badge, {backgroundColor: T.blue}]}>
            <Text style={LFB.badgeText}>{activeCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <FilterPanel
        visible={visible}
        onClose={() => setVisible(false)}
        showDocumentTypeFilter
        documentTypes={documentTypes}
        selectedDocumentTypes={selectedDocumentTypes}
        onDocumentTypeChange={onDocumentTypeChange}
      />
    </View>
  );
};

// layout/spacing only — colors come from T.* inline
const LFB = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: conditionalScale(14, 15, 16, 16),
    paddingTop: conditionalVerticalScale(8, 9, 10, 10),
    paddingBottom: conditionalVerticalScale(2, 3, 4, 4),
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(5, 6, 6, 6),
    paddingHorizontal: conditionalScale(10, 11, 12, 12),
    paddingVertical: conditionalVerticalScale(6, 6, 7, 7),
    borderRadius: 99,
    borderWidth: 1,
  },
  triggerText: {
    fontSize: conditionalFontScale(11, 12, 12, 13),
    fontWeight: '600',
  },
  badge: {
    minWidth: conditionalScale(16, 17, 18, 18),
    height: conditionalScale(16, 17, 18, 18),
    borderRadius: 99,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: conditionalFontScale(9, 9, 10, 10),
    fontWeight: '700',
    color: '#fff',
  },
});

export default ListFilterBar;
