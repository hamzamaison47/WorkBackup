import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PRHeaderList = ({
  item,
  index = 0,
  leftFields = [],
  rightFields = [],
  labels = {},
  onPress = null,
  onEdit = null,
  onDelete = null,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const scaleAnim = new Animated.Value(0);

  const formatValue = (key, value) => {
    if (!value && value !== 0) return '-';
    if (key?.toLowerCase()?.includes('date')) {
      const d = new Date(value);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    return value.toString();
  };

  const toggleMenu = () => {
    if (menuVisible) {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleEdit = () => {
    toggleMenu();
    onEdit && onEdit(item);
  };

  const handleDelete = () => {
    toggleMenu();
    onDelete && onDelete(item);
  };

  const leftTop = leftFields[0];
  const leftBottom = leftFields[1];
  const leftThird = leftFields[2];
  const leftFourth = leftFields[3];
  const leftFifth = leftFields[4];
  const rightTop = rightFields[0];

  return (
    <View
      style={[
        styles.wrapper,
        {backgroundColor: index % 2 === 0 ? '#F8FAFF' : '#fff'},
      ]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress && onPress(item)}
        style={styles.mainContent}>
        <View style={styles.card}>
          {/* LEFT SIDE - Creative layout with highlights */}
          <View style={styles.left}>
            {/* Main Title Row */}
            <View style={styles.titleRow}>
              <View style={styles.idBadge}>
                <Text style={styles.idText} numberOfLines={1}>
                  {formatValue(leftTop, item[leftTop])}
                </Text>
              </View>
              <Text style={styles.title} numberOfLines={2}>
                {formatValue(leftBottom, item[leftBottom])}
              </Text>
            </View>

            {/* Details Row */}
            <View style={styles.detailsContainer}>
              {leftThird && (
                <View style={styles.detailItem}>
                  <Icon
                    name="person"
                    size={14}
                    color="#666"
                    style={styles.detailIcon}
                  />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {formatValue(leftThird, item[leftThird])}
                  </Text>
                </View>
              )}

              {leftFourth && (
                <View style={styles.detailItem}>
                  <Icon
                    name="description"
                    size={14}
                    color="#666"
                    style={styles.detailIcon}
                  />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {formatValue(leftFourth, item[leftFourth])}
                  </Text>
                </View>
              )}

              {leftFifth && (
                <View style={styles.detailItem}>
                  <Icon
                    name="event"
                    size={14}
                    color="#666"
                    style={styles.detailIcon}
                  />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {formatValue(leftFifth, item[leftFifth])}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* RIGHT SIDE - Compact status field */}
          <View style={styles.rightContent}>
            {rightTop && (
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor:
                      item[rightTop]?.toUpperCase() === 'APPROVED'
                        ? '#E8F5E8'
                        : item[rightTop]?.toUpperCase() === 'IN REVIEW'
                        ? '#FFF3E0'
                        : item[rightTop]?.toUpperCase() === 'DRAFT'
                        ? '#F3F4F6'
                        : '#F5F5F5',
                    borderColor:
                      item[rightTop]?.toUpperCase() === 'APPROVED'
                        ? '#4CAF50'
                        : item[rightTop]?.toUpperCase() === 'IN REVIEW'
                        ? '#FF9800'
                        : item[rightTop]?.toUpperCase() === 'DRAFT'
                        ? '#9E9E9E'
                        : '#9E9E9E',
                  },
                ]}>
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        item[rightTop]?.toUpperCase() === 'APPROVED'
                          ? '#2E7D32'
                          : item[rightTop]?.toUpperCase() === 'IN REVIEW'
                          ? '#EF6C00'
                          : item[rightTop]?.toUpperCase() === 'DRAFT'
                          ? '#616161'
                          : '#616161',
                    },
                  ]}
                  numberOfLines={1}>
                  {formatValue(rightTop, item[rightTop])}
                </Text>
              </View>
            )}

            {/* THREE DOTS MENU */}
            <TouchableOpacity
              style={styles.menuButton}
              onPress={toggleMenu}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Icon name="more-vert" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* DROPDOWN MENU */}
      {menuVisible && (
        <Animated.View
          style={[
            styles.menuContainer,
            {
              transform: [{scale: scaleAnim}],
              opacity: scaleAnim,
            },
          ]}>
          <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
            <Icon name="edit" size={18} color="#2196F3" />
            <Text style={[styles.menuText, {color: '#2196F3'}]}>Edit</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
            <Icon name="delete" size={18} color="#F44336" />
            <Text style={[styles.menuText, {color: '#F44336'}]}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={styles.divider} />
    </View>
  );
};

export default PRHeaderList;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  mainContent: {
    flex: 1,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  left: {
    flex: 1,
    paddingRight: 12,
  },
  rightContent: {
    alignItems: 'flex-end',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  idBadge: {
    backgroundColor: '#0A66C2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
    minWidth: 80,
  },
  idText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 20,
  },
  detailsContainer: {
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 6,
    width: 16,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  menuButton: {
    padding: 4,
  },
  menuContainer: {
    position: 'absolute',
    right: 26,
    top: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 120,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginTop: 8,
  },
});
