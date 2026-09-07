// export default ListFilterBar;
import React, {useState, useMemo, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
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
//  Left side: a scrollable row of document-type pills, each showing the type
//  name and how many records currently match it — tap to toggle (multi-select).
//  Right side: the "sliders" trigger (with a badge) that opens the shared
//  FilterPanel for Document Type, kept for screens with many types where the
//  inline row would overflow. Both read/write the same
//  selectedDocumentTypes state from useListFilters(), so they never drift.
//
//  Display order: a local `customOrder` state, independent from the
//  underlying selection. Direct pill taps (toggleDocumentType) never touch
//  it — a tapped pill stays exactly where it is. Selections made via the
//  FilterPanel (handlePanelDocumentTypeChange) DO reorder — newly selected
//  types float to the front of the row so they're visible without scrolling,
//  since the panel is a separate surface the user just closed.
//
//  Date + Sort live in the universal header trigger, not here. Renders nothing
//  on screens without a documentType field (documentTypes is empty).
// ─────────────────────────────────────────────────────────────────────────────
const ListFilterBar = ({filters, showDocumentTypeFilter = false}) => {
  const T = useAppTokens();
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState(null); // {top, right}
  const triggerRef = useRef(null);

  const {
    documentTypes = [],
    documentTypeCounts = {},
    selectedDocumentTypes = [],
    onDocumentTypeChange = () => {},
  } = filters || {};

  // Local display order — decoupled from selection so pill *position* only
  // changes when we explicitly want it to (panel-driven changes).
  const [customOrder, setCustomOrder] = useState(documentTypes);

  // Keep customOrder in sync as the underlying documentTypes set changes
  // (new type appears in data, one disappears) — preserve existing
  // positions, append newcomers at the end, drop stale ones.
  useEffect(() => {
    setCustomOrder(prev => {
      const preserved = prev.filter(t => documentTypes.includes(t));
      const newOnes = documentTypes.filter(t => !prev.includes(t));
      return [...preserved, ...newOnes];
    });
  }, [documentTypes]);

  const showDocSection = showDocumentTypeFilter && documentTypes.length > 0;

  if (!showDocSection) {
    return null;
  }

  // Badge reflects only this trigger's facet — selected document types.
  const activeCount = selectedDocumentTypes.length;
  const active = activeCount > 0;

  // Direct pill tap — toggles selection only. Position in the row never
  // changes, per the earlier fix.
  const toggleDocumentType = type => {
    const next = selectedDocumentTypes.includes(type)
      ? selectedDocumentTypes.filter(t => t !== type)
      : [...selectedDocumentTypes, type];
    onDocumentTypeChange(next);
  };

  // FilterPanel-driven change — updates selection AND promotes every
  // currently-selected type to the front of the row, preserving their
  // relative order, so the choice made in the side menu is immediately
  // visible in the pill row without scrolling.
  const handlePanelDocumentTypeChange = next => {
    onDocumentTypeChange(next);
    setCustomOrder(prev => {
      const selected = prev.filter(t => next.includes(t));
      const unselected = prev.filter(t => !next.includes(t));
      return [...selected, ...unselected];
    });
  };

  const openPanel = () => {
    if (triggerRef.current) {
      triggerRef.current.measureInWindow((x, y, width, height) => {
        setAnchor({top: y + height + 6, right: 14});
        setVisible(true);
      });
    } else {
      setVisible(true);
    }
  };

  return (
    <View style={LFB.bar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={LFB.pillRow}
        style={LFB.pillScroll}>
        {customOrder.map(type => {
          const isSelected = selectedDocumentTypes.includes(type);
          const count = documentTypeCounts[type] ?? 0;
          return (
            <TouchableOpacity
              key={type}
              onPress={() => toggleDocumentType(type)}
              activeOpacity={0.7}
              style={[
                LFB.docPill,
                {
                  backgroundColor: isSelected ? T.blue : T.cardBg,
                  borderColor: isSelected ? T.blue : T.cardDivider,
                },
              ]}>
              <Text
                numberOfLines={1}
                style={[
                  LFB.docPillText,
                  {color: isSelected ? '#fff' : T.subtitleText},
                ]}>
                {type}
              </Text>
              <View
                style={[
                  LFB.docPillCount,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(255,255,255,0.25)'
                      : T.cardDivider,
                  },
                ]}>
                <Text
                  style={[
                    LFB.docPillCountText,
                    {color: isSelected ? '#fff' : T.subtitleText},
                  ]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <TouchableOpacity
        ref={triggerRef}
        onPress={openPanel}
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
        {active && (
          <View style={[LFB.badge, {backgroundColor: T.blue}]}>
            <Text style={LFB.badgeText}>{activeCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <FilterPanel
        visible={visible}
        onClose={() => setVisible(false)}
        anchorTop={anchor?.top}
        anchorRight={anchor?.right}
        showDocumentTypeFilter
        documentTypes={documentTypes}
        selectedDocumentTypes={selectedDocumentTypes}
        onDocumentTypeChange={handlePanelDocumentTypeChange}
      />
    </View>
  );
};

// layout/spacing only — colors come from T.* inline
const LFB = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: conditionalScale(14, 15, 16, 16),
    paddingTop: conditionalVerticalScale(8, 9, 10, 10),
    paddingBottom: conditionalVerticalScale(2, 3, 4, 4),
    gap: conditionalScale(8, 8, 10, 10),
  },
  pillScroll: {
    flex: 1,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(8, 8, 9, 9),
    paddingRight: conditionalScale(4, 4, 6, 6),
  },
  docPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(6, 6, 7, 7),
    paddingHorizontal: conditionalScale(10, 11, 12, 12),
    paddingVertical: conditionalVerticalScale(6, 6, 7, 7),
    borderRadius: 99,
    borderWidth: 1,
    maxWidth: conditionalScale(170, 180, 190, 190),
  },
  docPillText: {
    fontSize: conditionalFontScale(11, 12, 12, 13),
    fontWeight: '600',
    flexShrink: 1,
  },
  docPillCount: {
    minWidth: conditionalScale(16, 17, 18, 18),
    height: conditionalScale(16, 17, 18, 18),
    borderRadius: 99,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docPillCountText: {
    fontSize: conditionalFontScale(9, 9, 10, 10),
    fontWeight: '700',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(5, 6, 6, 6),
    paddingHorizontal: conditionalScale(10, 11, 12, 12),
    paddingVertical: conditionalVerticalScale(6, 6, 7, 7),
    borderRadius: 99,
    borderWidth: 1,
    flexShrink: 0,
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
