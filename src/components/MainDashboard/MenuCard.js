import React from 'react';
import {TouchableOpacity, Image, Text} from 'react-native';
import useAppTokens from '../AppComponentsDesign/useAppTokens';
import styles from '../../styles/styles';

const MenuCard = ({
  card,
  cardWidth,
  cardHeight,
  iconSize,
  gridGap,
  onPress,
}) => {
  // ✅ useAppTokens — reactive
  const T = useAppTokens();

  return (
    <TouchableOpacity
      style={[
        styles.MainDash_Card,
        {
          width: cardWidth,
          height: cardHeight,
          marginBottom: gridGap,
          // ✅ card bg and shadow react to theme
          backgroundColor: T.cardBg,
          shadowColor: T.shadowColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}>
      <Image
        source={typeof card.icon === 'string' ? {uri: card.icon} : card.icon}
        style={[styles.MainDash_CardIcon, {width: iconSize, height: iconSize}]}
      />
      <Text
        style={[styles.MainDash_CardTitle, {color: T.titleText}]}
        numberOfLines={2}>
        {card.title}
      </Text>
    </TouchableOpacity>
  );
};

export default MenuCard;
