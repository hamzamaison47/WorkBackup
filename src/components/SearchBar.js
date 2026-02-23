import React, {useState, useRef} from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import styles from '../styles/styles';

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
}) => {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownVisible, setVisible] = useState(false);
  const [dropdownPos, setPos] = useState({top: 0, right: 0});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flaskRef = useRef(null);
  const inputRef = useRef(null);

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

      {/* Right side icons — always visible */}
      <View style={styles.SearchBar_rightIcons}>
        {/* Search toggle */}
        <TouchableOpacity onPress={toggleSearch}>
          <FontAwesome
            name={searchOpen ? 'times' : 'search'}
            size={16}
            color="#ffffff"
          />
        </TouchableOpacity>

        {/* Filter flask */}
        <TouchableOpacity
          ref={flaskRef}
          onPress={openDropdown}
          style={[
            styles.SearchBar_flaskButton,
            isFilterActive && styles.SearchBar_flaskButtonActive,
          ]}>
          <FontAwesome
            name="filter"
            size={15}
            color={isFilterActive ? '#0A66C2' : '#ffffff'}
          />
        </TouchableOpacity>
      </View>

      {/* Sort Dropdown Modal */}
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
                        color={isActive ? '#0A66C2' : '#6B7280'}
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
                        <FontAwesome name="check" size={11} color="#0A66C2" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default SearchBar;
