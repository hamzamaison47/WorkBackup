/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import brand from '../../theme/brand';

const PRLinesList = ({
  item,
  index = 0,
  leftFields = [],
  rightFields = [],
  labels = {},
  onPress = null,
  onEdit = null,
  onDelete = null,
  isActionsDisabled = false,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const dotsRef = useRef(null);
  const [menuPos, setMenuPos] = useState({x: 0, y: 0});

  const measureButton = () =>
    new Promise(resolve =>
      dotsRef.current?.measure((fx, fy, w, h, px, py) =>
        resolve({x: px, y: py, w, h}),
      ),
    );

  const toggleMenu = async () => {
    if (menuVisible) {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      const pos = await measureButton();
      setMenuPos({x: pos.x, y: pos.y + pos.h + 8});
      setMenuVisible(true);
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  };

  const formatValue = v => {
    if (v === null || v === undefined || v === '') return '-';

    const num = Number(v);

    // Check if it's a valid number
    if (!isNaN(num)) {
      return num.toFixed(2);
    }
    return v.toString();
  };

  const leftTop = leftFields[0];
  const leftBottom = leftFields[1];

  return (
    <View
      style={[
        styles.wrapper,
        {backgroundColor: index % 2 === 0 ? '#F8FAFC' : '#fff'},
      ]}>
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.card}
        onPress={() => onPress && onPress(item)}>
        {/* LEFT SIDE */}
        <View style={styles.leftSection}>
          <Text style={styles.leftTop} numberOfLines={1}>
            {formatValue(item[leftTop])}
          </Text>
          <Text style={styles.leftBottom} numberOfLines={2}>
            {item[leftBottom]?.split('/')[0].trim() || '-'}
          </Text>
        </View>

        {/* RIGHT SIDE */}
        <View style={styles.rightSection}>
          {rightFields.map((field, i) => (
            <View key={i} style={styles.rightItem}>
              <Text style={styles.rightLabel} numberOfLines={1}>
                {labels?.[field] || field}
              </Text>
              <Text style={styles.rightValue} numberOfLines={1}>
                {formatValue(item[field])}
              </Text>
            </View>
          ))}
        </View>

        {/* MENU BUTTON */}
        <TouchableOpacity
          ref={dotsRef}
          style={styles.menuBtn}
          onPress={toggleMenu}>
          <Icon name="more-vert" size={20} color="#64748B" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* MENU */}
      <Modal transparent visible={menuVisible} animationType="none">
        <Pressable style={styles.overlay} onPress={toggleMenu}>
          <Animated.View
            style={[
              styles.menuContainer,
              {
                top: menuPos.y,
                right: 16,
                transform: [{scale: scaleAnim}],
                opacity: scaleAnim,
              },
            ]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                toggleMenu();
                onEdit && onEdit(item);
              }}>
              <Icon name="edit" size={18} color={brand.primaryStrong} />
              <Text style={[styles.menuText, {color: brand.primaryStrong}]}>
                Edit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                toggleMenu();
                onDelete && onDelete(item);
              }}>
              <Icon name="delete" size={18} color="#EF4444" />
              <Text style={[styles.menuText, {color: '#EF4444'}]}>Delete</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  /* LEFT */
  leftSection: {
    flex: 1.1,
    justifyContent: 'center',
  },
  leftTop: {
    fontSize: 16,
    fontWeight: '700',
    color: brand.text,
    letterSpacing: -0.2,
  },
  leftBottom: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 16,
  },

  /* RIGHT GRID */
  rightSection: {
    flex: 1.9,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-end',
  },
  rightItem: {
    width: '44%',
    alignItems: 'flex-end',
  },
  rightLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rightValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },

  menuBtn: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    marginLeft: 8,
  },

  overlay: {
    flex: 1,
  },

  menuContainer: {
    position: 'absolute',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 150,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuText: {
    fontSize: 14,
    marginLeft: 10,
    fontWeight: '600',
  },
});

export default PRLinesList;
