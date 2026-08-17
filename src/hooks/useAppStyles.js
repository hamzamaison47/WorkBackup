// hooks/useAppStyles.js
import {useMemo} from 'react';
import useAppTokens from '../components/AppComponentsDesign/useAppTokens';
import staticStyles, {getDSRStyles} from '../styles/styles';

const useAppStyles = () => {
  const tokens = useAppTokens();
  const dsrStyles = useMemo(() => getDSRStyles(tokens), [tokens]);
  return useMemo(() => ({...staticStyles, ...dsrStyles}), [dsrStyles]);
};

export default useAppStyles;
