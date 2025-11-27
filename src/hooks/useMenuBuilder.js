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
      const validType = [1, 2, 3].includes(Number(item.Type));
      const isVisible = item.Visible === '1';
      return hasScreen && validType && isVisible;
    });

    if (filtered.length === 0) return [];

    let cards = filtered
      .filter(item => item.MenuId !== 'GenericAdvanceSaveScreen')
      .map((menuItem, index) => ({
        id: menuItem.MenuId || index.toString(),
        title: menuItem.Label || menuItem.DisplayName || menuItem.MenuId,
        icon:
          iconMapping[menuItem.MenuId] ||
          require('../assets/Maindashboard/calendar.png'),
        menuItem,
      }));

    // Add Loan Request
    const loanCard = {
      id: 'GenericLoanSaveScreen',
      title: 'Loan Request',
      icon: require('../assets/Maindashboard/signing.png'),
      menuItem: {MenuId: 'GenericAdvanceSaveScreen', Type: '1'},
      isLoanRequest: true,
    };

    cards.push(loanCard);
    return cards;
  };

  const handleCardPress = card => {
    if (card.isLoanRequest) {
      const params = getNavigationParams({
        MenuId: 'GenericAdvanceSaveScreen',
        Type: '1',
      });

      navigation.navigate('GenericAdvanceSaveScreen', {
        ...params,
        cameFrom: 'MainDashboard',
        requestType: 'Loan',
        advanceType: 0,
        screenName: 'Loan Request',
      });
    } else {
      navigation.navigate(
        card.menuItem.MenuId,
        getNavigationParams(card.menuItem),
      );
    }
  };

  const dynamicMenus = getDynamicMenus();

  return {
    dynamicMenus,
    handleCardPress,
  };
};
