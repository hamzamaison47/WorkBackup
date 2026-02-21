/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  StyleSheet,
  Animated,
  Keyboard,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

// ─────────────────────────────────────────────────────────────
// SORT OPTIONS – default options, can be extended via props
// ─────────────────────────────────────────────────────────────
const DEFAULT_SORT_OPTIONS = [
  {key: 'CreatedDateTime', label: 'Created Date', type: 'date'},
  {key: 'LeaveReqDate', label: 'Request Date', type: 'date'},
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Extracts all meaningful label/value pairs from a data record.
 * Keys ending with "Label" are treated as labels for the paired key.
 * Empty-string labels and internal keys are skipped.
 */
const extractLabels = record => {
  if (!record) return [];
  const labels = [];
  const skip = new Set([
    'RecId',
    'Partition',
    'DataAreaId',
    'BenefitDeductionRecId',
    'EarningRefRecId',
    'EntitlementRecId',
  ]);

  Object.keys(record).forEach(key => {
    if (key.endsWith('Label')) {
      const valueKey = key.replace('Label', '');
      const labelText = record[key];
      if (labelText && !skip.has(valueKey)) {
        labels.push({valueKey, label: labelText});
      }
    }
  });
  return labels;
};

/**
 * Returns a string representation of any field value for comparison.
 */
const stringifyValue = val => {
  if (val === null || val === undefined) return '';
  return String(val).toLowerCase();
};

/**
 * Sorts an array of records.
 * @param {Array}  data
 * @param {string} key        – field key to sort by
 * @param {'asc'|'desc'} dir  – direction
 * @param {'date'|'text'|'number'} type
 */
const sortData = (data, key, dir, type) => {
  return [...data].sort((a, b) => {
    let va = a[key];
    let vb = b[key];

    if (type === 'date') {
      va = va ? new Date(va).getTime() : 0;
      vb = vb ? new Date(vb).getTime() : 0;
    } else if (type === 'number') {
      va = parseFloat(va) || 0;
      vb = parseFloat(vb) || 0;
    } else {
      va = stringifyValue(va);
      vb = stringifyValue(vb);
    }

    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  });
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

/**
 * SearchFilterBar
 *
 * Props:
 *  - data           {Array}    Raw records from API
 *  - onDataChange   {Function} Called with filtered/sorted result
 *  - sortOptions    {Array}    [{key, label, type}] – override defaults
 *  - visible        {boolean}  Show or hide the entire bar
 *  - isRTL          {boolean}
 */
const SearchFilterBar = ({
  data = [],
  onDataChange,
  sortOptions = DEFAULT_SORT_OPTIONS,
  visible = true,
  isRTL = false,
}) => {
  // ── State ──────────────────────────────────────────────────
  const [searchText, setSearchText] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);

  // Filter: which labels are selected (valueKey strings)
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]); // active valueKeys

  // Sort
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'
  const [sortType, setSortType] = useState('date');

  const searchAnim = useRef(new Animated.Value(0)).current;

  // ── Derived: available labels from first record ────────────
  const availableLabels = React.useMemo(
    () => (data.length > 0 ? extractLabels(data[0]) : []),
    [data],
  );

  // ── Core: apply all three layers and emit result ───────────
  const applyAll = useCallback(
    (text, filters, sk, sd, st) => {
      let result = [...data];

      // 1. Search – searches across values of selected filter keys
      //    (if no filter selected, searches all label-bound fields)
      const searchKeysPool =
        filters.length > 0 ? filters : availableLabels.map(l => l.valueKey);

      if (text.trim()) {
        const lower = text.toLowerCase();
        result = result.filter(item =>
          searchKeysPool.some(k => stringifyValue(item[k]).includes(lower)),
        );
      }

      // 2. Filter – keeps only records that have non-empty values
      //    for ALL selected label keys
      if (filters.length > 0) {
        result = result.filter(item =>
          filters.every(k => stringifyValue(item[k]) !== ''),
        );
      }

      // 3. Sort
      if (sk) {
        result = sortData(result, sk, sd, st);
      }

      onDataChange?.(result);
    },
    [data, availableLabels, onDataChange],
  );

  // ── Search handlers ────────────────────────────────────────
  const handleSearchToggle = () => {
    const next = !searchExpanded;
    setSearchExpanded(next);
    Animated.timing(searchAnim, {
      toValue: next ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    if (!next) {
      setSearchText('');
      applyAll('', selectedFilters, sortKey, sortDir, sortType);
      Keyboard.dismiss();
    }
  };

  const handleSearchChange = text => {
    setSearchText(text);
    applyAll(text, selectedFilters, sortKey, sortDir, sortType);
  };

  // ── Filter handlers ────────────────────────────────────────
  const toggleFilter = key => {
    setSelectedFilters(prev => {
      const next = prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key];
      applyAll(searchText, next, sortKey, sortDir, sortType);
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedFilters([]);
    applyAll(searchText, [], sortKey, sortDir, sortType);
  };

  // ── Sort handlers ──────────────────────────────────────────
  const handleSortSelect = opt => {
    const newDir =
      sortKey === opt.key ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
    setSortKey(opt.key);
    setSortDir(newDir);
    setSortType(opt.type || 'text');
    setSortModalVisible(false);
    applyAll(searchText, selectedFilters, opt.key, newDir, opt.type || 'text');
  };

  const clearSort = () => {
    setSortKey(null);
    setSortDir('asc');
    setSortModalVisible(false);
    applyAll(searchText, selectedFilters, null, 'asc', 'date');
  };

  // ── Active indicator counts ────────────────────────────────
  const activeFilterCount = selectedFilters.length;
  const activeSortCount = sortKey ? 1 : 0;

  // ── Search bar animated width ──────────────────────────────
  const searchWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!visible) return null;

  // ── Render ─────────────────────────────────────────────────
  return (
    <View style={sfStyles.wrapper}>
      {/* ── TOP ROW: icon buttons ─────────────────────────── */}
      <View style={[sfStyles.row, isRTL && sfStyles.rowRTL]}>
        {/* Search button + expanding input */}
        <View style={sfStyles.searchGroup}>
          <TouchableOpacity
            style={[sfStyles.iconBtn, searchExpanded && sfStyles.iconBtnActive]}
            onPress={handleSearchToggle}
            activeOpacity={0.7}>
            <FontAwesome
              name="search"
              size={16}
              color={searchExpanded ? '#fff' : '#0A66C2'}
            />
          </TouchableOpacity>

          {/* Animated expanding search input */}
          <Animated.View
            style={[sfStyles.searchInputWrap, {width: searchWidth}]}>
            {searchExpanded && (
              <TextInput
                style={sfStyles.searchInput}
                placeholder="Search…"
                placeholderTextColor="#999"
                value={searchText}
                onChangeText={handleSearchChange}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={Keyboard.dismiss}
              />
            )}
          </Animated.View>
        </View>

        {/* Spacer – pushes filter + sort to right when search not expanded */}
        {!searchExpanded && <View style={{flex: 1}} />}

        {/* Filter button */}
        <TouchableOpacity
          style={[
            sfStyles.iconBtn,
            activeFilterCount > 0 && sfStyles.iconBtnActive,
          ]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}>
          <FontAwesome5
            name="sliders-h"
            size={15}
            color={activeFilterCount > 0 ? '#fff' : '#0A66C2'}
          />
          {activeFilterCount > 0 && (
            <View style={sfStyles.badge}>
              <Text style={sfStyles.badgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Sort button */}
        <TouchableOpacity
          style={[
            sfStyles.iconBtn,
            activeSortCount > 0 && sfStyles.iconBtnActive,
          ]}
          onPress={() => setSortModalVisible(true)}
          activeOpacity={0.7}>
          <FontAwesome5
            name="sort-amount-down"
            size={15}
            color={activeSortCount > 0 ? '#fff' : '#0A66C2'}
          />
          {activeSortCount > 0 && (
            <View style={sfStyles.badge}>
              <Text style={sfStyles.badgeText}>1</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Active chips row ───────────────────────────────── */}
      {(activeFilterCount > 0 || activeSortCount > 0) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={sfStyles.chipsRow}
          contentContainerStyle={sfStyles.chipsContent}>
          {/* Filter chips */}
          {selectedFilters.map(fk => {
            const lbl = availableLabels.find(l => l.valueKey === fk);
            return (
              <TouchableOpacity
                key={fk}
                style={sfStyles.chip}
                onPress={() => toggleFilter(fk)}>
                <Text style={sfStyles.chipText}>{lbl?.label || fk}</Text>
                <FontAwesome
                  name="times"
                  size={10}
                  color="#0A66C2"
                  style={{marginLeft: 4}}
                />
              </TouchableOpacity>
            );
          })}

          {/* Sort chip */}
          {sortKey && (
            <TouchableOpacity
              style={[sfStyles.chip, sfStyles.chipSort]}
              onPress={clearSort}>
              <FontAwesome5
                name={sortDir === 'asc' ? 'sort-alpha-down' : 'sort-alpha-up'}
                size={10}
                color="#0A66C2"
                style={{marginRight: 4}}
              />
              <Text style={sfStyles.chipText}>
                {sortOptions.find(o => o.key === sortKey)?.label || sortKey}
              </Text>
              <FontAwesome
                name="times"
                size={10}
                color="#0A66C2"
                style={{marginLeft: 4}}
              />
            </TouchableOpacity>
          )}

          {/* Clear all */}
          <TouchableOpacity
            style={[sfStyles.chip, sfStyles.chipClear]}
            onPress={() => {
              clearFilters();
              clearSort();
            }}>
            <Text style={[sfStyles.chipText, {color: '#e53935'}]}>
              Clear all
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── FILTER MODAL ──────────────────────────────────── */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}>
        <TouchableOpacity
          style={sfStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}>
          <View
            style={sfStyles.modalSheet}
            onStartShouldSetResponder={() => true}>
            {/* Header */}
            <View style={sfStyles.modalHeader}>
              <Text style={sfStyles.modalTitle}>Filter by Labels</Text>
              <View style={sfStyles.modalHeaderRight}>
                {activeFilterCount > 0 && (
                  <TouchableOpacity
                    onPress={clearFilters}
                    style={sfStyles.clearBtn}>
                    <Text style={sfStyles.clearBtnText}>Clear</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <FontAwesome name="times" size={18} color="#333" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={sfStyles.modalSubtitle}>
              Select labels to show only records that have values for those
              fields.
            </Text>

            {/* Label list */}
            <FlatList
              data={availableLabels}
              keyExtractor={item => item.valueKey}
              renderItem={({item}) => {
                const isSelected = selectedFilters.includes(item.valueKey);
                return (
                  <TouchableOpacity
                    style={[
                      sfStyles.filterItem,
                      isSelected && sfStyles.filterItemActive,
                    ]}
                    onPress={() => toggleFilter(item.valueKey)}>
                    <Text
                      style={[
                        sfStyles.filterItemText,
                        isSelected && sfStyles.filterItemTextActive,
                      ]}>
                      {item.label}
                    </Text>
                    {isSelected && (
                      <FontAwesome name="check" size={14} color="#0A66C2" />
                    )}
                  </TouchableOpacity>
                );
              }}
              style={sfStyles.filterList}
            />

            <TouchableOpacity
              style={sfStyles.applyBtn}
              onPress={() => setFilterModalVisible(false)}>
              <Text style={sfStyles.applyBtnText}>
                Apply{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── SORT MODAL ────────────────────────────────────── */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSortModalVisible(false)}>
        <TouchableOpacity
          style={sfStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}>
          <View
            style={sfStyles.modalSheet}
            onStartShouldSetResponder={() => true}>
            {/* Header */}
            <View style={sfStyles.modalHeader}>
              <Text style={sfStyles.modalTitle}>Sort Records</Text>
              <View style={sfStyles.modalHeaderRight}>
                {sortKey && (
                  <TouchableOpacity
                    onPress={clearSort}
                    style={sfStyles.clearBtn}>
                    <Text style={sfStyles.clearBtnText}>Clear</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                  <FontAwesome name="times" size={18} color="#333" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={sfStyles.modalSubtitle}>
              Tap a field to sort. Tap again to reverse direction.
            </Text>

            {sortOptions.map(opt => {
              const isActive = sortKey === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    sfStyles.sortItem,
                    isActive && sfStyles.sortItemActive,
                  ]}
                  onPress={() => handleSortSelect(opt)}>
                  <Text
                    style={[
                      sfStyles.sortItemText,
                      isActive && sfStyles.sortItemTextActive,
                    ]}>
                    {opt.label}
                  </Text>
                  {isActive && (
                    <FontAwesome5
                      name={
                        sortDir === 'asc' ? 'sort-alpha-down' : 'sort-alpha-up'
                      }
                      size={14}
                      color="#0A66C2"
                    />
                  )}
                </TouchableOpacity>
              );
            })}

            {/* A-Z / 0-9 quick options */}
            <View style={sfStyles.quickSortRow}>
              <Text style={sfStyles.quickSortLabel}>Quick Sort Direction:</Text>
              <TouchableOpacity
                style={[
                  sfStyles.quickSortBtn,
                  sortDir === 'asc' && sfStyles.quickSortBtnActive,
                ]}
                onPress={() => {
                  if (sortKey) {
                    setSortDir('asc');
                    applyAll(
                      searchText,
                      selectedFilters,
                      sortKey,
                      'asc',
                      sortType,
                    );
                  }
                }}>
                <Text
                  style={[
                    sfStyles.quickSortBtnText,
                    sortDir === 'asc' && sfStyles.quickSortBtnTextActive,
                  ]}>
                  A → Z / 0 → 9
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  sfStyles.quickSortBtn,
                  sortDir === 'desc' && sfStyles.quickSortBtnActive,
                ]}
                onPress={() => {
                  if (sortKey) {
                    setSortDir('desc');
                    applyAll(
                      searchText,
                      selectedFilters,
                      sortKey,
                      'desc',
                      sortType,
                    );
                  }
                }}>
                <Text
                  style={[
                    sfStyles.quickSortBtnText,
                    sortDir === 'desc' && sfStyles.quickSortBtnTextActive,
                  ]}>
                  Z → A / 9 → 0
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={sfStyles.applyBtn}
              onPress={() => setSortModalVisible(false)}>
              <Text style={sfStyles.applyBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const sfStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },

  // Search group
  searchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  // Icon button
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#0A66C2',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: '#0A66C2',
    borderColor: '#0A66C2',
  },

  // Badge
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#e53935',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },

  // Search input
  searchInputWrap: {
    overflow: 'hidden',
    height: 36,
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#0A66C2',
    paddingHorizontal: 10,
    color: '#222',
    fontSize: 14,
    backgroundColor: '#f5f9ff',
  },

  // Chips
  chipsRow: {
    marginTop: 8,
  },
  chipsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f0fe',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#c5d8fb',
  },
  chipSort: {
    backgroundColor: '#e8f5e9',
    borderColor: '#c8e6c9',
  },
  chipClear: {
    backgroundColor: '#fce4ec',
    borderColor: '#f8bbd0',
  },
  chipText: {
    fontSize: 12,
    color: '#0A66C2',
    fontWeight: '500',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 16,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#777',
    marginBottom: 12,
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fce4ec',
    borderRadius: 6,
  },
  clearBtnText: {
    color: '#e53935',
    fontSize: 13,
    fontWeight: '600',
  },

  // Filter list
  filterList: {
    maxHeight: 320,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#f5f5f5',
  },
  filterItemActive: {
    backgroundColor: '#e8f0fe',
    borderWidth: 1.5,
    borderColor: '#0A66C2',
  },
  filterItemText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  filterItemTextActive: {
    color: '#0A66C2',
    fontWeight: '600',
  },

  // Sort list
  sortItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#f5f5f5',
  },
  sortItemActive: {
    backgroundColor: '#e8f0fe',
    borderWidth: 1.5,
    borderColor: '#0A66C2',
  },
  sortItemText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },
  sortItemTextActive: {
    color: '#0A66C2',
    fontWeight: '600',
  },

  // Quick sort
  quickSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  quickSortLabel: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
    marginRight: 4,
  },
  quickSortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  quickSortBtnActive: {
    backgroundColor: '#0A66C2',
    borderColor: '#0A66C2',
  },
  quickSortBtnText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  quickSortBtnTextActive: {
    color: '#fff',
  },

  // Apply button
  applyBtn: {
    marginTop: 14,
    backgroundColor: '#0A66C2',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default SearchFilterBar;
