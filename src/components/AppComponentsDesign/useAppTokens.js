import {useSelector} from 'react-redux';
import {LightTokens, DarkTokens, BrandTokens} from './Tokens';
import brand from '../../theme/brand';

const useAppTokens = () => {
  const mode = useSelector(state => state.theme.mode);
  const base = mode === 'dark' ? DarkTokens : LightTokens;

  return {
    ...base,
    ...BrandTokens,
    // Brand colour comes from the compile-time constant in src/theme/brand.js.
    // Note blueBg here is the derived tint, whereas the static
    // BrandTokens.blueBg is brand.primaryBg — two different values today.
    blue: brand.primary, // filled surfaces
    blueStrong: brand.primaryStrong, // primary as text / thin border / icon
    blueBg: brand.tint,
    onPrimary: brand.onPrimary, // content on a primary fill
  };
};

export default useAppTokens;
