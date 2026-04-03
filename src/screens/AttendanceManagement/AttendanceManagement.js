// ─────────────────────────────────────────────
// screens/AttendanceManagement/AttendanceManagement.js
// Root entry. Wraps everything in GeofenceProvider
// so permission + GPS + API runs exactly once.
// ─────────────────────────────────────────────
import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import {GeofenceProvider} from '../../components/AttendanceManagement/GeofenceContext';
import HomeScreen from '../../components/AttendanceManagement/Screen/HomeScreen';
import TimeClockScreen from '../../components/AttendanceManagement/Screen/TimeClockScreen';
import AttendanceRecordsScreen from '../../components/AttendanceManagement/Screen/AttendanceRecordsScreen';

const TITLES = {
  Home: 'Attendance',
  TimeClock: 'Time Clock',
  Records: 'Timesheets',
};

const AttendanceManagement = () => {
  const [screen, setScreen] = useState('Home');
  const {userData} = useSelector(s => s.user);
  const person = userData?.Person;

  const renderScreen = () => {
    switch (screen) {
      case 'TimeClock':
        return <TimeClockScreen onNavigate={setScreen} />;
      case 'Records':
        return <AttendanceRecordsScreen onNavigate={setScreen} />;
      default:
        return <HomeScreen onNavigate={setScreen} />;
    }
  };

  return (
    <GeofenceProvider person={person}>
      <ActionPaneContainer
        pageTitle={TITLES[screen]}
        isBackButton={true}
        showFooter={true}
        showFloatingButton={false}
        isHeaderActive={true}
        showPageTitleRow={true}>
        {renderScreen()}
      </ActionPaneContainer>
    </GeofenceProvider>
  );
};

export default AttendanceManagement;
