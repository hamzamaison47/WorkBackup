import React from 'react';
import {TouchableOpacity, Image, Text, View} from 'react-native';
import useAppTokens from '../AppComponentsDesign/useAppTokens';
import usePalette from '../../hooks/usePalette';
import {AppTokens} from '../AppComponentsDesign/Appcomponents';
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
  const P = usePalette();

  const isReactComponent = icon =>
    typeof icon === 'function' ||
    (typeof icon === 'object' &&
      icon !== null &&
      (icon.$$typeof === Symbol.for('react.forward_ref') ||
        icon.$$typeof === Symbol.for('react.memo')));

  const isLucideIcon = isReactComponent(card.icon);

  // Box stays sized off the original iconSize so spacing/layout is
  // unaffected; only the rendered icon itself shrinks.
  const iconBoxSize = Math.round(iconSize * 1.7);
  const renderedIconSize = Math.round(iconSize * 0.8);

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
      <View
        style={{
          width: iconBoxSize,
          height: iconBoxSize,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: AppTokens.blueBg,
          marginBottom: 8,
        }}>
        {isLucideIcon ? (
          <card.icon size={renderedIconSize} color={P.primaryStrong} />
        ) : (
          <Image
            source={
              typeof card.icon === 'string' ? {uri: card.icon} : card.icon
            }
            style={[
              styles.MainDash_CardIcon,
              {width: renderedIconSize, height: renderedIconSize},
            ]}
            resizeMode="contain"
          />
        )}
      </View>
      <Text
        style={[styles.MainDash_CardTitle, {color: T.titleText}]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.75}>
        {card.title}
      </Text>
    </TouchableOpacity>
  );
};

export default MenuCard;
