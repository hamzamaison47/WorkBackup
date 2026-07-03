// ─────────────────────────────────────────────
// components/AttendanceManagement/useAttendanceTheme.js
//
// Theme hook for the Attendance Management feature. Reads the same redux
// theme mode that the app-wide useAppTokens() uses (state.theme.mode), and
// returns the light/dark variants of the attendance design tokens.
//
// Usage:
//   const {C, R, Sh, DK, isDark} = useAttendanceTheme();
//   const S = useMemo(() => makeStyles(C, R, Sh), [C, R, Sh]);
// ─────────────────────────────────────────────
import {useSelector} from 'react-redux';
import {C_LIGHT, C_DARK, DK_LIGHT, DK_DARK, R, Sh} from './theme';

const useAttendanceTheme = () => {
  const mode = useSelector(state => state.theme?.mode);
  const isDark = mode === 'dark';
  return {
    C: isDark ? C_DARK : C_LIGHT,
    DK: isDark ? DK_DARK : DK_LIGHT,
    R,
    Sh,
    isDark,
  };
};

export default useAttendanceTheme;
