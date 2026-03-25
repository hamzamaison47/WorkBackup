// import {useSelector, useDispatch} from 'react-redux';
// import {toggleTheme, setTheme} from '../store/slices/themeSlice';
// import {lightTheme, darkTheme} from './colors';

// const useTheme = () => {
//   const dispatch = useDispatch();
//   const mode = useSelector(state => state.theme.mode);

//   const colors = mode === 'dark' ? darkTheme : lightTheme;

//   return {
//     colors, // the actual color values.
//     mode, // 'light' or 'dark'
//     isDark: mode === 'dark', // handy boolean
//     toggleTheme: () => dispatch(toggleTheme()),
//     setTheme: m => dispatch(setTheme(m)),
//   };
// };

// export default useTheme;
import {useMemo} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {toggleTheme, setTheme} from '../store/slices/themeSlice';
import {lightTheme, darkTheme} from './colors';

const useTheme = () => {
  const dispatch = useDispatch();
  const mode = useSelector(state => state.theme.mode);

  if (__DEV__ && mode !== 'dark' && mode !== 'light') {
    console.warn(`useTheme: unexpected mode "${mode}", defaulting to light.`);
  }

  const colors = useMemo(
    () => (mode === 'dark' ? darkTheme : lightTheme),
    [mode],
  );

  return useMemo(
    () => ({
      colors,
      mode,
      isDark: mode === 'dark',
      toggleTheme: () => dispatch(toggleTheme()),
      setTheme: m => dispatch(setTheme(m)),
    }),
    [colors, mode, dispatch],
  );
};

export default useTheme;
