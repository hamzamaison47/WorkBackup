/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PRHeaderList = ({
  item,
  index = 0,
  leftFields = [],
  rightFields = [],
  labels = {},
  onPress = null,
  onSubmit = null, // ✅ Added Submit prop
  onEdit = null,
  onDelete = null,
  processingButtons = {},
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const threeDotsRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({x: 0, y: 0});
  const isDraft = item.RequisitionStatus?.toUpperCase() === 'DRAFT';

  const submitLoading =
    processingButtons[item.RecId]?.includes('submit') || false;

  const editLoading = processingButtons[item.RecId]?.includes('edit') || false;

  const deleteLoading =
    processingButtons[item.RecId]?.includes('delete') || false;

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

  const measureButton = () => {
    return new Promise(resolve => {
      threeDotsRef.current?.measure((fx, fy, width, height, px, py) => {
        resolve({x: px, y: py, width, height});
      });
    });
  };

  const toggleMenu = async () => {
    if (menuVisible) {
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      const position = await measureButton();
      setMenuPosition({
        x: position.x,
        y: position.y + position.height + 8,
      });
      setMenuVisible(true);
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSubmit = () => {
    // ✅ Added handler
    toggleMenu();
    onSubmit && onSubmit(item);
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
          {/* LEFT SIDE */}
          <View style={styles.left}>
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

          {/* RIGHT SIDE */}
          <View style={styles.rightContent}>
            {rightTop && (
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor:
                      item[rightTop]?.toUpperCase() === 'APPROVED'
                        ? '#FFEBEE' // Red background
                        : item[rightTop]?.toUpperCase() === 'IN REVIEW'
                        ? '#FFF9C4' // Yellow background
                        : item[rightTop]?.toUpperCase() === 'CLOSED'
                        ? '#E8F5E8' // Green background
                        : item[rightTop]?.toUpperCase() === 'DRAFT'
                        ? '#F3F4F6' // Grey background
                        : '#F5F5F5',
                    borderColor:
                      item[rightTop]?.toUpperCase() === 'APPROVED'
                        ? '#F44336' // Red border
                        : item[rightTop]?.toUpperCase() === 'IN REVIEW'
                        ? '#FBC02D' // Yellow border
                        : item[rightTop]?.toUpperCase() === 'CLOSED'
                        ? '#4CAF50' // Green border
                        : item[rightTop]?.toUpperCase() === 'DRAFT'
                        ? '#9E9E9E' // Grey border
                        : '#9E9E9E',
                  },
                ]}>
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        item[rightTop]?.toUpperCase() === 'APPROVED'
                          ? '#D32F2F' // Red text
                          : item[rightTop]?.toUpperCase() === 'IN REVIEW'
                          ? '#F57F17' // Yellow text
                          : item[rightTop]?.toUpperCase() === 'CLOSED'
                          ? '#2E7D32' // Green text
                          : item[rightTop]?.toUpperCase() === 'DRAFT'
                          ? '#616161' // Grey text
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
              ref={threeDotsRef}
              style={styles.menuButton}
              onPress={toggleMenu}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Icon name="more-vert" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* ✅ MODAL DROPDOWN - With Submit button added */}
      <Modal
        transparent={true}
        visible={menuVisible}
        animationType="none"
        onRequestClose={toggleMenu}>
        <Pressable style={styles.modalOverlay} onPress={toggleMenu}>
          <Animated.View
            style={[
              styles.menuContainer,
              {
                position: 'absolute',
                top: menuPosition.y,
                right: 16,
                transform: [{scale: scaleAnim}],
                opacity: scaleAnim,
              },
            ]}
            onStartShouldSetResponder={() => true}>
            {/* ✅ SUBMIT BUTTON - Added at top */}
            <TouchableOpacity
              disabled={!isDraft || submitLoading}
              style={[
                styles.menuItem,
                (!isDraft || submitLoading) && styles.disabledMenuItem,
              ]}
              onPress={isDraft && !submitLoading ? handleSubmit : undefined}>
              {submitLoading ? (
                <ActivityIndicator size={16} color="#4CAF50" />
              ) : (
                <>
                  <Icon name="send" size={18} color="#4CAF50" />
                  <Text style={[styles.menuText, {color: '#4CAF50'}]}>
                    Submit
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              disabled={!isDraft || editLoading}
              style={[
                styles.menuItem,
                (!isDraft || editLoading) && styles.disabledMenuItem,
              ]}
              onPress={isDraft && !editLoading ? handleEdit : undefined}>
              {editLoading ? (
                <ActivityIndicator size={16} color="#2196F3" />
              ) : (
                <>
                  <Icon name="edit" size={18} color="#2196F3" />
                  <Text style={[styles.menuText, {color: '#2196F3'}]}>
                    Edit
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              disabled={!isDraft || deleteLoading}
              style={[
                styles.menuItem,
                (!isDraft || deleteLoading) && styles.disabledMenuItem,
              ]}
              onPress={isDraft && !deleteLoading ? handleDelete : undefined}>
              {deleteLoading ? (
                <ActivityIndicator size={16} color="#F44336" />
              ) : (
                <>
                  <Icon name="delete" size={18} color="#F44336" />
                  <Text style={[styles.menuText, {color: '#F44336'}]}>
                    Delete
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>

      <View style={styles.divider} />
    </View>
  );
};

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
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 120,
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
  disabledMenuItem: {
    opacity: 0.5,
  },
});

export default PRHeaderList;
