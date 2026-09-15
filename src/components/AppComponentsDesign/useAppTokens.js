import {useSelector} from 'react-redux';
import {LightTokens, DarkTokens, BrandTokens} from './Tokens';
import brand from '../../theme/brand';

const useAppTokens = () => {
  const mode = useSelector(state => state.theme.mode);
  const isDark = mode === 'dark';
  const base = isDark ? DarkTokens : LightTokens;

  return {
    ...base,
    ...BrandTokens,
    // The mode flag. Use this — never compare a token value to a hex literal
    // to detect dark mode; token values change with the brand.
    isDark,
    // Brand colour comes from the compile-time constant in src/theme/brand.js.
    blue: brand.primary, // filled surfaces
    blueStrong: brand.primaryStrong, // primary as text / thin border / icon
    blueBg: brand.tint, // pale primary: selected rows, chips, icon tiles
    onPrimary: brand.onPrimary, // content on a primary fill
    onPrimaryMuted: brand.onPrimaryMuted, // de-emphasised content on a fill
  };
};

export default useAppTokens;
