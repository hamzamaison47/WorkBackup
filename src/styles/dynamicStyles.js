import {StyleSheet, Dimensions} from 'react-native';

const {height, width} = Dimensions.get('window');

export const createDynamicStyles = isRTL => {
  return StyleSheet.create({
    // Leave Request List Page
    LReqLP_ListContainer: {
      paddingBottom: height * 0.05,
      paddingHorizontal: width * 0.03,
      paddingTop: height * 0.01,
    },
    LReqLP_NoDataText: {
      flex: 1,
      textAlign: 'center',
      textAlignVertical: 'center',
      fontSize: width * 0.04,
      fontWeight: 'bold',
      color: '#999999',
    },

    // Leave Save Record
    LReqSR_SafeArea: {
      flex: 1,
      backgroundColor: '#fefefe',
    },
    LReqSR_ContentWrapper: {
      flex: 1,
      justifyContent: 'space-between',
      paddingHorizontal: width * 0.04,
      paddingTop: height * 0.015,
    },
    LReqSR_FormContainer: {
      padding: width * 0.01,
      paddingBottom: height * 0.02,
    },
    LReqSR_Label: {
      fontSize: width * 0.038,
      marginTop: height * 0.015,
      fontWeight: '600',
      color: '#444',
      //   textAlign: isRTL ? 'right' : 'left',
    },
    LReqSR_Input: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: width * 0.02,
      padding: width * 0.025,
      marginTop: height * 0.007,
      fontSize: width * 0.04,
      color: '#333',
      backgroundColor: '#fff',
      //   textAlign: isRTL ? 'right' : 'left',
      //   writingDirection: isRTL ? 'rtl' : 'ltr',
    },
    LReqSR_DropdownPlaceholder: {
      color: '#444',
      fontSize: width * 0.038,
      //   textAlign: isRTL ? 'right' : 'left',
    },
    LReqSR_DropdownSelectedText: {
      color: '#444',
      fontWeight: '400',
      fontSize: width * 0.038,
      //   textAlign: isRTL ? 'right' : 'left',
    },
    LReqSR_DropdownItemText: {
      color: '#444',
      fontSize: width * 0.038,
      //   textAlign: isRTL ? 'right' : 'left',
    },
    LReqSR_DropdownContainer: {
      borderWidth: 1.5,
      borderColor: '#4A90E2',
      borderRadius: width * 0.025,
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 6,
    },
    LReqSR_DropdownItemContainer: {
      paddingHorizontal: width * 0.03,
    },
    LReqSR_DropdownSearchInput: {
      color: '#444',
      backgroundColor: '#fff',
      fontSize: width * 0.038,
      //   textAlign: isRTL ? 'right' : 'left',
    },
    LReqSR_DropdownIcon: {
      width: width * 0.055,
      height: width * 0.055,
    },
    LReqSR_Disabled: {
      backgroundColor: '#f1f1f1',
      color: '#999',
    },
    LReqSR_TextArea: {
      height: height * 0.15,
      textAlignVertical: 'top',
      fontSize: width * 0.04,
    },
    LReqSR_DateSelector: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: width * 0.02,
      padding: width * 0.025,
      marginTop: height * 0.007,
    },
    LReqSR_DateText: {
      fontSize: width * 0.04,
      color: '#333',
      //   textAlign: isRTL ? 'right' : 'left',
    },
  });
};
