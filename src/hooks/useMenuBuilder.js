/* eslint-disable curly */
import {useSelector} from 'react-redux';
import {screenMapping, iconMapping} from '../Controller/screenMapping';

export const useMenuBuilder = (userData, selectedLegalEntity, navigation) => {
  const {menuItems} = useSelector(state => state.menuItem);

  const getNavigationParams = menuItem => {
    const baseParams = {
      employeeId: userData.employeeId,
      employeeName: userData.employeeName,
      WorkerRecId: userData.WorkerRecId,
      userData: userData,
      cameFrom: 'MainDashboard',
      selectedLegalEntity,
    };

    if (menuItem.Type === '1') {
      if (menuItem.MenuId === 'LeaveSaveRecord') {
        return {
          ...baseParams,
          mode: 'create',
          leaveData: {
            employeeId: userData.employeeId,
            employeeName: userData.employeeName,
            WorkerRecId: userData.WorkerRecId,
            recId: '',
            leaveCode: '',
            leaveCategory: '',
            balance: '0.00',
            leaveStartDate: '',
            leaveEndDate: '',
            leaveDays: '',
            reason: '',
          },
        };
      }
      if (menuItem.MenuId === 'GenericAdvanceSaveScreen') {
        return {
          ...baseParams,
          mode: 'create',
          advanceData: {
            employeeId: userData.employeeId,
            employeeName: userData.employeeName,
            WorkerRecId: userData.WorkerRecId,
            RecId: '',
            AdvanceTypeCode: '',
            AdvanceAmount: '0.00',
            RequestedPaymentDate: '',
            RecoveryStartDate: '',
            RequestedInstallmentAmount: '0.00',
            RequestedInstallments: '0',
            AdvanceDescription: '',
          },
        };
      }
      return {...baseParams, mode: 'create'};
    }

    return baseParams;
  };

  const getDynamicMenus = () => {
    const filtered = menuItems.filter(item => {
      const hasScreen = screenMapping[item.MenuId];
      const isVisible = item.Visible === '1';
      const isOnMainScreen = item.DisplayOnMainScreen === 'Yes';
      return hasScreen && isVisible && isOnMainScreen;
    });

    if (filtered.length === 0) return [];

    return filtered.map((menuItem, index) => ({
      id: menuItem.MenuId || index.toString(),
      title: menuItem.Label || menuItem.DisplayName || menuItem.MenuId,
      icon:
        iconMapping[menuItem.MenuId] ||
        require('../assets/Maindashboard/calendar.png'),
      menuItem,
    }));
  };

  const handleCardPress = card => {
    navigation.navigate(
      card.menuItem.MenuId,
      getNavigationParams(card.menuItem),
    );
  };

  const dynamicMenus = getDynamicMenus();

  return {
    dynamicMenus,
    handleCardPress,
  };
};
