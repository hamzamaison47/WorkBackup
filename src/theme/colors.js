// src/theme/colors.js

const baseTokens = {
  primary: null,
  background: null,
  surface: null,
  card: null,
  text: null,
  subText: null,
  titleText: null,
  subtitleText: null,
  border: null,
  divider: null,
  shadow: null,
  inputBg: null,
  placeholder: null,
  icon: null,
  iconActive: null,
  error: null,
  success: null,
  warning: null,
  disabled: null,
  disabledText: null,
  overlay: null,
  tabBar: null,
  tabBarInactive: null,
};

export const lightTheme = {
  ...baseTokens,
  primary: '#6200EE',
  background: '#F5F7FA',
  surface: '#F2F2F2',
  card: '#FFFFFF',
  text: '#000000',
  subText: '#666666',
  titleText: '#111827',
  subtitleText: '#6B7280',
  border: '#CCCCCC',
  divider: '#F0F0F0',
  shadow: '#000000',
  inputBg: '#F5F7FA',
  placeholder: '#999999',
  icon: '#444444',
  iconActive: '#6200EE',
  error: '#B00020',
  success: '#2E7D32',
  warning: '#F57C00',
  disabled: '#CCCCCC',
  disabledText: '#AAAAAA',
  overlay: 'rgba(0,0,0,0.4)',
  tabBar: '#FFFFFF',
  tabBarInactive: '#999999',
};

export const darkTheme = {
  ...baseTokens,
  primary: '#BB86FC',
  background: '#0F0F0F',
  surface: '#1E1E1E',
  card: '#1C1C1E',
  text: '#FFFFFF',
  subText: '#AAAAAA',
  titleText: '#F1F1F1',
  subtitleText: '#9CA3AF',
  border: '#333333',
  divider: '#2C2C2C',
  shadow: '#000000',
  inputBg: '#2A2A2A',
  placeholder: '#666666',
  icon: '#AAAAAA',
  iconActive: '#BB86FC',
  error: '#CF6679',
  success: '#66BB6A',
  warning: '#FFB74D',
  disabled: '#444444',
  disabledText: '#666666',
  overlay: 'rgba(0,0,0,0.7)',
  tabBar: '#1C1C1E',
  tabBarInactive: '#666666',
};

// Dev-time key parity check
if (__DEV__) {
  const lightKeys = new Set(Object.keys(lightTheme));
  const darkKeys = new Set(Object.keys(darkTheme));
  lightKeys.forEach(k => {
    if (!darkKeys.has(k)) {
      console.warn(`darkTheme missing key: "${k}"`);
    }
  });
  darkKeys.forEach(k => {
    if (!lightKeys.has(k)) {
      console.warn(`lightTheme missing key: "${k}"`);
    }
  });
}
