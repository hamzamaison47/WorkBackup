import React, {useState, useRef, useMemo} from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import styles from '../styles/styles';
import usePalette from '../hooks/usePalette';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const SORT_OPTIONS = [
  {key: 'asc', label: 'Date Ascending', icon: 'sort-amount-asc'},
  {key: 'desc', label: 'Date Descending', icon: 'sort-amount-desc'},
  {key: null, label: 'Clear Sort', icon: 'times'},
];

const SearchBar = ({
  pageTitle = '',
  onSearchChange = () => {},
  onSortChange = () => {},
  placeholder = 'Search...',
  activeSortOrder = null,
  showDocumentTypeFilter = false,
  documentTypes = [],
  selectedDocumentType = null,
  onDocumentTypeChange = () => {},
}) => {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownVisible, setVisible] = useState(false);
  const [dropdownPos, setPos] = useState({top: 0, right: 0});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flaskRef = useRef(null);
  const inputRef = useRef(null);

  const [docTypeVisible, setDocTypeVisible] = useState(false);
  const [docTypePos, setDocTypePos] = useState({top: 0, right: 0});
  const docTypeAnim = useRef(new Animated.Value(0)).current;
  const docTypeRef = useRef(null);

  const P = usePalette();
  const S = useMemo(() => makeStyles(P), [P]);

  const handleSearch = text => {
    setQuery(text);
    onSearchChange(text);
  };

  const clearSearch = () => {
    setQuery('');
    onSearchChange('');
  };

  const toggleSearch = () => {
    if (searchOpen) {
      // closing — clear query too
      clearSearch();
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
      // auto focus input after state update
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const openDropdown = () => {
    flaskRef.current?.measure((fx, fy, w, h, px, py) => {
      setPos({top: py + h + 6, right: SCREEN_WIDTH - px - w});
      setVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  const closeDropdown = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  const handleSort = key => {
    closeDropdown();
    onSortChange(key);
  };

  const isFilterActive = activeSortOrder !== null;

  const openDocTypeDropdown = () => {
    docTypeRef.current?.measure((fx, fy, w, h, px, py) => {
      setDocTypePos({top: py + h + 6, right: SCREEN_WIDTH - px - w});
      setDocTypeVisible(true);
      Animated.timing(docTypeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  const closeDocTypeDropdown = () => {
    Animated.timing(docTypeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => setDocTypeVisible(false));
  };

  const handleDocTypeSelect = type => {
    closeDocTypeDropdown();
    onDocumentTypeChange(type);
  };
  return (
    <View style={styles.SearchBar_row}>
      {/* Page Title — hidden when search is open */}
      {!searchOpen && (
        <Text style={styles.APCont_pageTitleText} numberOfLines={1}>
          {pageTitle}
        </Text>
      )}

      {/* Search Input — expands when open */}
      {searchOpen && (
        <View style={styles.SearchBar_inputWrapper}>
          <FontAwesome
            name="search"
            size={14}
            color="rgba(255,255,255,0.7)"
            style={styles.SearchBar_searchIcon}
          />
          <TextInput
            ref={inputRef}
            style={styles.SearchBar_input}
            value={query}
            onChangeText={handleSearch}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.6)"
            color="#ffffff"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              style={styles.SearchBar_clearButton}>
              <FontAwesome
                name="times-circle"
                size={14}
                color="rgba(255,255,255,0.7)"
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Right side icons */}
      <View style={styles.SearchBar_rightIcons}>
        <TouchableOpacity onPress={toggleSearch}>
          <FontAwesome
            name={searchOpen ? 'times' : 'search'}
            size={16}
            color="#ffffff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          ref={flaskRef}
          onPress={openDropdown}
          style={[
            styles.SearchBar_flaskButton,
            isFilterActive && styles.SearchBar_flaskButtonActive,
          ]}>
          <FontAwesome
            name="sort"
            size={15}
            color={isFilterActive ? P.primary : '#ffffff'}
          />
        </TouchableOpacity>

        {showDocumentTypeFilter && (
          <TouchableOpacity
            ref={docTypeRef}
            onPress={openDocTypeDropdown}
            style={[
              styles.SearchBar_flaskButton,
              selectedDocumentType && styles.SearchBar_flaskButtonActive,
            ]}>
            <FontAwesome
              name="filter"
              size={14}
              color={selectedDocumentType ? P.primary : '#ffffff'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Sort Dropdown Modal ── */}
      <Modal
        transparent
        visible={dropdownVisible}
        animationType="none"
        onRequestClose={closeDropdown}>
        <TouchableWithoutFeedback onPress={closeDropdown}>
          <View style={styles.SearchBar_modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.SearchBar_dropdown,
                  {
                    top: dropdownPos.top,
                    right: dropdownPos.right,
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-6, 0],
                        }),
                      },
                    ],
                  },
                ]}>
                {SORT_OPTIONS.map((opt, idx) => {
                  const isActive =
                    activeSortOrder === opt.key && opt.key !== null;
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleSort(opt.key)}
                      style={[
                        styles.SearchBar_dropdownItem,
                        idx < SORT_OPTIONS.length - 1 &&
                          styles.SearchBar_dropdownItemBorder,
                        isActive && styles.SearchBar_dropdownItemActive,
                      ]}>
                      <FontAwesome
                        name={opt.icon}
                        size={13}
                        color={isActive ? P.primary : '#6B7280'}
                        style={styles.SearchBar_dropdownIcon}
                      />
                      <Text
                        style={[
                          styles.SearchBar_dropdownText,
                          isActive && styles.SearchBar_dropdownTextActive,
                        ]}>
                        {opt.label}
                      </Text>
                      {isActive && (
                        <FontAwesome name="check" size={11} color={P.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Document Type Dropdown Modal — Modern Sleek ── */}
      {showDocumentTypeFilter && (
        <Modal
          transparent
          visible={docTypeVisible}
          animationType="none"
          onRequestClose={closeDocTypeDropdown}>
          <TouchableWithoutFeedback onPress={closeDocTypeDropdown}>
            <View style={styles.SearchBar_modalOverlay}>
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[
                    S.panel,
                    {
                      top: docTypePos.top,
                      right: docTypePos.right,
                      opacity: docTypeAnim,
                      transform: [
                        {
                          translateY: docTypeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-8, 0],
                          }),
                        },
                      ],
                    },
                  ]}>
                  {/* Header */}
                  <View style={S.header}>
                    <View style={S.headerLeft}>
                      <View style={S.headerIconWrap}>
                        <FontAwesome
                          name="filter"
                          size={11}
                          color={P.primary}
                        />
                      </View>
                      <Text style={S.headerTitle}>Document Type</Text>
                    </View>
                    {selectedDocumentType && (
                      <TouchableOpacity
                        onPress={() => handleDocTypeSelect(null)}
                        style={S.clearBtn}>
                        <Text style={S.clearBtnText}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Divider */}
                  <View style={S.divider} />

                  {/* All Types */}
                  <TouchableOpacity
                    onPress={() => handleDocTypeSelect(null)}
                    style={[S.option, !selectedDocumentType && S.optionActive]}>
                    <View style={S.optionLeft}>
                      <View
                        style={[
                          S.radioOuter,
                          !selectedDocumentType && S.radioOuterActive,
                        ]}>
                        {!selectedDocumentType && <View style={S.radioInner} />}
                      </View>
                      <Text
                        style={[
                          S.optionText,
                          !selectedDocumentType && S.optionTextActive,
                        ]}>
                        All Types
                      </Text>
                    </View>
                    {!selectedDocumentType && (
                      <View style={S.activeBadge}>
                        <Text style={S.activeBadgeText}>
                          {documentTypes.length} types
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Document Types */}
                  {documentTypes.map((type, idx) => {
                    const isActive = selectedDocumentType === type;
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => handleDocTypeSelect(type)}
                        style={[
                          S.option,
                          isActive && S.optionActive,
                          idx === documentTypes.length - 1 && S.optionLast,
                        ]}>
                        <View style={S.optionLeft}>
                          <View
                            style={[
                              S.radioOuter,
                              isActive && S.radioOuterActive,
                            ]}>
                            {isActive && <View style={S.radioInner} />}
                          </View>
                          <Text
                            style={[
                              S.optionText,
                              isActive && S.optionTextActive,
                            ]}
                            numberOfLines={1}>
                            {type}
                          </Text>
                        </View>
                        {isActive && (
                          <FontAwesome
                            name="check"
                            size={12}
                            color={P.primary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
};

const makeStyles = P =>
  StyleSheet.create({
    panel: {
      position: 'absolute',
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      minWidth: 220,
      maxWidth: 280,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#F0F4F8',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: '#FAFBFC',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerIconWrap: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor: P.tint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#1A1A2E',
      letterSpacing: 0.2,
    },
    clearBtn: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: '#FEE2E2',
    },
    clearBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#DC2626',
    },
    divider: {
      height: 1,
      backgroundColor: '#F0F4F8',
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: '#F5F7FA',
    },
    optionActive: {
      backgroundColor: '#F0F7FF',
    },
    optionLast: {
      borderBottomWidth: 0,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      marginRight: 8,
    },
    radioOuter: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#D1D5DB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOuterActive: {
      borderColor: P.primary,
    },
    radioInner: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: P.primary,
    },
    optionText: {
      fontSize: 13,
      color: '#4B5563',
      fontWeight: '500',
      flex: 1,
    },
    optionTextActive: {
      color: P.primary,
      fontWeight: '600',
    },
    activeBadge: {
      backgroundColor: P.tint,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
    },
    activeBadgeText: {
      fontSize: 10,
      color: P.primary,
      fontWeight: '600',
    },
  });

export default SearchBar;
