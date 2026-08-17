import {useSelector} from 'react-redux';
import {LightTokens, DarkTokens, BrandTokens} from './Tokens';
import usePalette from '../../hooks/usePalette';

const useAppTokens = () => {
  const mode = useSelector(state => state.theme.mode);
  const base = mode === 'dark' ? DarkTokens : LightTokens;
  const P = usePalette();

  return {
    ...base,
    ...BrandTokens,
    // Override the brand color from the API-driven palette (static
    // BrandTokens.blue/blueBg remain the defaults inside usePalette).
    blue: P.primary,
    blueBg: P.tint,
    onPrimary: P.onPrimary,
  };
};

export default useAppTokens;
