import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';

const PRHeaderList = ({
  item,
  index = 0,
  leftFields = [],
  rightFields = [],
  labels = {},
  onPress = null,
}) => {
  const formatValue = (key, value) => {
    if (!value && value !== 0) return '-';
    if (key?.toLowerCase()?.includes('date')) {
      const d = new Date(value);
      return d.toLocaleDateString();
    }
    return value.toString();
  };

  const leftTop = leftFields[0];
  const leftBottom = leftFields[1];

  const rightTop = rightFields[0];
  const rightMiddle = rightFields[1];
  const rightBottom = rightFields[2];

  return (
    <View
      style={[
        styles.wrapper,
        {backgroundColor: index % 2 === 0 ? '#F9F9F9' : '#fff'},
      ]}>
      <TouchableOpacity
        activeOpacity={onPress ? 0.7 : 1}
        onPress={() => onPress && onPress(item)}>
        <View style={styles.row}>
          {/* SERIAL NUMBER */}
          <Text style={styles.serial}>{index + 1}</Text>

          <View style={styles.card}>
            {/* LEFT SIDE */}
            <View style={styles.left}>
              <Text style={styles.leftTopClickable}>
                {formatValue(leftTop, item[leftTop])}
              </Text>
              <Text style={styles.leftBottomSmall}>
                {formatValue(leftBottom, item[leftBottom])}
              </Text>
            </View>

            {/* RIGHT SIDE */}
            <View style={styles.right}>
              {rightTop && (
                <Text style={styles.rightTop}>
                  {formatValue(rightTop, item[rightTop])}
                </Text>
              )}

              {rightMiddle && (
                <Text style={styles.rightMiddle}>
                  {formatValue(rightMiddle, item[rightMiddle])}
                </Text>
              )}

              {rightBottom && (
                <View style={styles.rightBottomContainer}>
                  <Text style={styles.rightBottom}>
                    {formatValue(rightBottom, item[rightBottom])}
                  </Text>

                  {/* Badge if exists */}
                  {item.status && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.status}</Text>
                    </View>
                  )}

                  {/* Small indicator if exists */}
                  {item.indicator && <View style={styles.smallCircle} />}
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.divider} />
    </View>
  );
};

export default PRHeaderList;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  serial: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0A66C2',
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    marginRight: 12,
    fontSize: 14,
  },

  card: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  left: {
    flex: 1,
    paddingRight: 10,
  },

  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  leftTopClickable: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A66C2',
    marginBottom: 2,
  },

  leftBottomSmall: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },

  rightTop: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },

  rightMiddle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginTop: 2,
  },

  rightBottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  rightBottom: {
    fontSize: 13,
    color: '#009688',
    fontWeight: '600',
  },

  badge: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  smallCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginLeft: 6,
    alignSelf: 'center',
  },

  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 6,
  },
});
