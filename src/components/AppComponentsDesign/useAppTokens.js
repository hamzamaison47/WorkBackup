import {useSelector} from 'react-redux';
import {LightTokens, DarkTokens, BrandTokens} from './Tokens';

const useAppTokens = () => {
  const mode = useSelector(state => state.theme.mode);
  const base = mode === 'dark' ? DarkTokens : LightTokens;
  return {...base, ...BrandTokens};
};

export default useAppTokens;
