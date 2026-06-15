import React from 'react';
import {View, Text, TouchableOpacity, I18nManager} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import IconBadge from './IconBadge';
import useAppTokens from './useAppTokens';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
} from '../../store/utils/scaling';

export const SettingRow = ({
  icon,
  iconColor,
  iconBg,
  iconLib = 'feather',
  title,
  subtitle,
  onPress,
  isLast = false,
  rightLabel,
  rightElement,
  disabled = false,
  style,
}) => {
  const T = useAppTokens();
  const effectiveOnPress = rightElement || disabled ? undefined : onPress;
  const effectiveActiveOpacity = rightElement || disabled ? 1 : 0.72;

  const rowStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(14, 15, 16, 16),
    paddingVertical: conditionalVerticalScale(13, 14, 15, 15),
    borderBottomWidth: isLast ? 0 : 1,
    borderBottomColor: T.rowDivider,
    opacity: disabled ? 0.5 : 1,
  };

  const renderRight = () => {
    if (rightElement) {
      return rightElement;
    }
    if (rightLabel) {
      return (
        <Text
          style={{
            fontSize: conditionalFontScale(11, 11, 12, 12),
            color: T.subtitleText,
            fontWeight: '500',
            maxWidth: conditionalScale(100, 110, 120, 120),
            textAlign: 'right',
          }}>
          {rightLabel}
        </Text>
      );
    }
    return (
      <FeatherIcon
        name={I18nManager.isRTL ? 'chevron-left' : 'chevron-right'}
        size={conditionalFontScale(14, 15, 16, 16)}
        color={disabled ? '#E2E8F0' : T.chevronColor}
      />
    );
  };

  return (
    <TouchableOpacity
      style={[rowStyle, style]}
      onPress={effectiveOnPress}
      activeOpacity={effectiveActiveOpacity}>
      <IconBadge
        name={icon}
        color={disabled ? '#CBD5E1' : iconColor}
        bgColor={disabled ? '#F8FAFC' : iconBg}
        lib={iconLib}
      />
      <View style={{flex: 1, marginRight: conditionalScale(8, 9, 10, 10)}}>
        <Text
          style={{
            fontSize: conditionalFontScale(13, 13, 14, 14),
            fontWeight: '600',
            color: T.titleText,
            marginBottom: 2,
          }}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontSize: conditionalFontScale(10, 10, 11, 11),
              color: T.subtitleText,
              fontWeight: '400',
              lineHeight: conditionalFontScale(14, 14, 15, 15),
            }}
            numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {renderRight()}
    </TouchableOpacity>
  );
};

export const InfoRow = ({
  icon,
  iconColor,
  iconBg,
  iconLib = 'feather',
  title,
  value,
  isLast = false,
  style,
}) => {
  const T = useAppTokens();
  const rowStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(14, 15, 16, 16),
    paddingVertical: conditionalVerticalScale(13, 14, 15, 15),
    borderBottomWidth: isLast ? 0 : 1,
    borderBottomColor: T.rowDivider,
  };
  return (
    <View style={[rowStyle, style]}>
      <IconBadge name={icon} color={iconColor} bgColor={iconBg} lib={iconLib} />
      <View style={{flex: 1, marginRight: conditionalScale(8, 9, 10, 10)}}>
        <Text
          style={{
            fontSize: conditionalFontScale(13, 13, 14, 14),
            fontWeight: '600',
            color: T.titleText,
            marginBottom: 2,
          }}>
          {title}
        </Text>
      </View>
      {value ? (
        <Text
          style={{
            fontSize: conditionalFontScale(12, 12, 13, 13),
            color: T.subtitleText,
            fontWeight: '500',
            maxWidth: conditionalScale(140, 150, 160, 160),
            textAlign: 'right',
          }}
          numberOfLines={1}>
          {value}
        </Text>
      ) : null}
    </View>
  );
};
