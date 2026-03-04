/* eslint-disable react-native/no-inline-styles */
import React, {useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  StyleSheet,
  Image,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');

// ─── Arrow Button ─────────────────────────────────────────────────────────────
export const QuickAccessButton = ({onPress}) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  return (
    <View style={btnStyles.wrapper}>
      <Animated.View style={{transform: [{scale: pulse}]}}>
        <TouchableOpacity
          style={btnStyles.button}
          onPress={onPress}
          activeOpacity={0.8}>
          <Ionicons name="chevron-up" size={22} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const btnStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute', // ← sticky
    bottom: 10, // ← sits above the tab bar
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    elevation: 10,
  },
  button: {
    width: 28,
    height: 28,
    borderRadius: 24,
    backgroundColor: '#0A66C2',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#0A66C2',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
});

// ─── Full Screen Sheet ────────────────────────────────────────────────────────
const QuickAccessSheet = ({visible, onClose, menus, onCardPress}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const isRendered = useRef(false);

  useEffect(() => {
    if (visible) {
      isRendered.current = true;
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 3,
        speed: 14,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 280,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const numColumns = 3;
  const cardSize = (SCREEN_WIDTH - 48) / numColumns;

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={[sheet.card, {width: cardSize, height: cardSize * 0.9}]}
      activeOpacity={0.75}
      onPress={() => {
        handleClose();
        onCardPress(item);
      }}>
      <View style={sheet.iconBox}>
        <Image
          source={typeof item.icon === 'string' ? {uri: item.icon} : item.icon}
          style={sheet.icon}
          resizeMode="contain"
        />
      </View>
      <Text style={sheet.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  if (!visible && !isRendered.current) return null;

  return (
    <Animated.View style={[sheet.container, {transform: [{translateY}]}]}>
      <StatusBar backgroundColor="#0A66C2" barStyle="light-content" />

      {/* Blue Header */}
      <View style={sheet.header}>
        <TouchableOpacity onPress={handleClose} style={sheet.backBtn}>
          <Ionicons name="chevron-down" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={sheet.headerTitle}>Quick Access</Text>
        <View style={{width: 40}} />
      </View>

      {/* Grid */}
      <FlatList
        data={menus}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        numColumns={numColumns}
        contentContainerStyle={sheet.gridContent}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={sheet.columnWrapper}
      />
    </Animated.View>
  );
};

const sheet = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8FAFF',
    zIndex: 9999, // higher than floating button
    elevation: 99, // higher than floating button
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A66C2',
    paddingHorizontal: 12,
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
    marginBottom: 4,
  },
  card: {
    margin: 6,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E8EFF8',
    elevation: 2,
    shadowColor: '#0A66C2',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EBF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    width: 26,
    height: 26,
  },
  cardTitle: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 4,
  },
});

export default QuickAccessSheet;
