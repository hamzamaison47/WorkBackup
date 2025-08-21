import {StyleSheet, Dimensions} from 'react-native';

const {height, width} = Dimensions.get('window');
const cardWidth = (width - 56) / 2;
const PROFILE_IMAGE_SIZE = width * 0.35; // responsive image size
const BORDER_WIDTH = 5;

const styles = StyleSheet.create({
  // start of  splash_ page name
  splash_Container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splash_Logo: {
    width: 200,
    height: 80,
    marginBottom: 20,
  },
  splash_Text: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
  },
  splash_Tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 10,
    fontStyle: 'italic',
    fontWeight: '300',
  },
  splash_Loader: {
    marginTop: 20,
  },
  // end of splash_ screen name

  // Start of Maindashboard Screen
  Main_Container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  Main_ScrollView: {
    flex: 1,
  },
  Main_ScrollContainer: {
    flexGrow: 1,
    paddingBottom: height * 0.1, // Extra padding for fixed button
  },
  Main_HeaderContainer: {
    width: width * 0.9,
    alignSelf: 'center',
    marginTop: height * 0.03,
    // marginBottom: height * 0.001,
  },
  Main_WelcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 6},
    shadowRadius: 8,
    elevation: 8,
    marginBottom: height * 0.035,
  },
  Main_HeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  Main_ProfilePicture: {
    width: height * 0.1,
    height: height * 0.1,
    borderRadius: height * 0.125,
    marginRight: width * 0.02,
    borderWidth: 4,
    borderColor: '#0A66C2',
  },
  Main_TextColumn: {
    flexDirection: 'column',
    flex: 1,
  },
  Main_WelcomeText: {
    fontSize: height * 0.0235,
    fontWeight: 'bold',
    color: '#1A1A1A',
    // marginBottom: height * 0.008,
    textAlign: 'left',
  },
  Main_NameText: {
    fontSize: height * 0.022,
    color: '#0A66C2',
    fontWeight: '600',
    textAlign: 'left',
    // marginBottom: height * 0.005,
  },
  Main_EmailText: {
    fontSize: height * 0.015,
    color: '#5A5A5A',
    textAlign: 'left',
  },
  Main_Grid: {
    paddingHorizontal: 20,
    // paddingTop: 10,
    paddingBottom: 40,
  },
  Main_Row: {
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  Main_Card: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 6,
    elevation: 5,
  },
  Main_IconWrapper: {
    backgroundColor: '#0A66C2',
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
    shadowColor: '#0A66C2',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
  },
  Main_CardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },
  Main_ModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  Main_ModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  Main_ModalImage: {
    width: width * 0.08,
    height: height * 0.06,
    borderRadius: 10,
  },
  // End Of MainDashboard

  // Start of Login_ Screen
  Login_Container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  Login_Logo: {
    width: 200,
    height: 80,
    marginBottom: 20,
  },
  Login_Title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
    textAlign: 'center',
  },
  Login_Subtitle: {
    fontSize: 18,
    color: '#333333',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 15,
    fontStyle: 'italic',
  },
  Login_Button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.8, // 80% of screen width
    height: 55, // Fixed height
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#0A66C2',
    marginVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  Login_ButtonText: {
    color: '#0A66C2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  Login_Icon: {
    marginRight: 10,
  },

  Login_LoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  Login_LoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  Login_DialogContainer: {
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  Login_DialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  Login_DialogContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  Login_DialogMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  Login_DialogButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  Login_DialogButton: {
    flex: 1,
    backgroundColor: '#0A66C2',
    borderRadius: 6,
    paddingVertical: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  Login_DialogButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // End Of Login_

  //WorkAssigned
  Team_Container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  Team_MainTxt: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9f9f9fff',
  },
  // End WorkAssigned

  //Start of Display List Page
  DisplayContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  DisplayScrollView: {
    flex: 1,
  },
  DisplayScrollContent: {
    flexGrow: 1,
  },
  DisplayFilterContainer: {
    backgroundColor: '#ebf5ff',
    paddingBottom: 0,
    paddingHorizontal: 0,
    marginBottom: height * 0.01,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 2,
  },
  DisplayFilterScrollContent: {
    paddingHorizontal: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  DisplayFilterButton: {
    flex: 1,
    paddingVertical: height * 0.02,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  DisplayActiveFilterButton: {
    borderBottomWidth: 5,
    borderBottomColor: '#0A66C2',
  },
  DisplayFilterButtonText: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  DisplayActiveFilterButtonText: {
    color: '#0A66C2',
    fontWeight: '700',
  },
  DisplayMenuContainer: {
    paddingTop: width * 0.05,
    paddingHorizontal: width * 0.03,
  },
  DisplayMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.015,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    minHeight: height * 0.08,
  },
  DisplayIconWrapper: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.04,
  },
  DisplayMenuTitle: {
    flex: 1,
    fontSize: width * 0.042,
    fontWeight: '600',
    color: '#1f2937',
  },
  DisplayNoMenuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: height * 0.1,
  },
  DisplayNoMenuText: {
    fontSize: width * 0.045,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: width * 0.055,
  },
  DisplayBottomPadding: {
    height: height * 0.05,
  },
  // end of Display List page

  // Start of Salary Slip

  SSlip_Container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  SSlip_ScrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.05,
    marginTop: width * 0.1,
  },
  SSlip_Icon: {
    marginBottom: height * 0.03,
  },
  SSlip_ScreenTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.01,
  },
  SSlip_ScreenSubtitle: {
    fontSize: width * 0.04,
    color: '#666',
    textAlign: 'center',
    marginBottom: height * 0.025,
  },
  SSlip_FieldsHeading: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.015,
  },
  SSlip_Dropdown: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.03,
    backgroundColor: '#fff',
    marginBottom: height * 0.025,
    width: '100%',
  },
  SSlip_ItemText: {
    color: '#000',
    fontSize: width * 0.04,
  },
  SSlip_DropdownPlaceholder: {
    color: '#999',
    fontSize: width * 0.04,
  },
  SSlip_DropdownSelected: {
    color: '#000',
    fontSize: width * 0.04,
  },
  SSlip_Button: {
    borderRadius: 8,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.05,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.025,
    width: '100%',
  },
  SSlip_ButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  SSlip_ButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  // End oF Salary Slip

  // Start of Leave Request Save Record
  LReqSR_SafeArea: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  LReqSR_ContentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.03,
    paddingTop: height * 0.01,
  },
  LReqSR_FormContainer: {
    padding: 5,
    paddingBottom: 100,
  },
  LReqSR_Label: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: '600',
    color: '#444',
  },
  LReqSR_Input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fff',
  },
  LReqSR_Disabled: {
    backgroundColor: '#f1f1f1',
    color: '#999',
  },
  LReqSR_TextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  LReqSR_DateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  LReqSR_DateText: {
    fontSize: 15,
    color: '#333',
  },
  LReqSR_Footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  LReqSR_Button: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#0A66C2',
    borderRadius: 20,
    paddingVertical: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  LReqSR_SubmitButton: {
    borderColor: '#0A66C2',
    backgroundColor: '#0A66C2',
  },
  LReqSR_DisabledButton: {
    opacity: 0.6,
  },
  LReqSR_ButtonText: {
    fontWeight: 'bold',
    color: '#0A66C2',
  },
  LReqSR_SubmitButtonText: {
    fontWeight: 'bold',
    color: '#ffffffff',
  },
  LReqSR_PressedButton: {
    backgroundColor: '#0A66C2',
  },
  LReqSR_pressedSubmitButton: {
    backgroundColor: '#3d95edff',
    borderColor: '#3d95edff',
  },
  LReqSR_pressedText: {
    color: '#fff',
  },
  // End oF Leave Req Save Record

  // Start oF Leave Req List Page
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
  // End Of Leave Req List Page

  // Start Of Display Personal Info
  DPI_Container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  DPI_ScrollView: {
    flex: 1,
  },
  DPI_ScrollContainer: {
    flexGrow: 1,
    //paddingBottom: screenHeight * 0.1, // Extra padding for fixed button
  },
  DPI_TopContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  DPI_ImageContainer: {
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.025,
    paddingBottom: height * 0.01,
    alignItems: 'center',
  },
  DPI_FixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: width * 0.025,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  TCert_Container: {
    flex: 1,
    backgroundColor: '#f7f7f7', // Matches SSlip_Container for consistency
    justifyContent: 'center',
    alignItems: 'center',
  },
  TCert_ScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.05,
    paddingTop: height * 0.1,
    paddingBottom: height * 0.1, // Ensure enough space for scrolling
  },
  TCert_Icon: {
    marginBottom: height * 0.03,
    alignSelf: 'center',
  },
  TCert_ScreenTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.01,
    textAlign: 'center',
  },
  TCert_ScreenSubtitle: {
    fontSize: width * 0.04,
    color: '#666',
    textAlign: 'center',
    marginBottom: height * 0.025,
    paddingHorizontal: width * 0.05,
  },
  TCert_Label: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#444',
    marginTop: height * 0.015,
    marginBottom: height * 0.01,
    textAlign: 'center',
    width: '100%',
  },
  TCert_Input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    fontSize: width * 0.04,
    color: '#333',
    backgroundColor: '#fff',
    width: '100%',
    textAlign: 'center',
  },
  TCert_Disabled: {
    backgroundColor: '#f1f1f1',
    color: '#999',
  },
  TCert_DateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    marginBottom: height * 0.015,
    width: '100%',
    justifyContent: 'space-between',
  },
  TCert_DateText: {
    fontSize: width * 0.04,
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  TCert_Button: {
    borderRadius: 8,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.05,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.025,
    width: '100%',
  },
  TCert_ButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  TCert_ButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // end of tax certificate

  // start of display list page

  DisLp_container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  DisLp_ScrollView: {
    flex: 1,
  },
  DisLp_ScrollContent: {
    flexGrow: 1,
  },
  DisLp_FilterContainer: {
    backgroundColor: '#ebf5ff',
    paddingBottom: 0,
    paddingHorizontal: 0,
    marginBottom: height * 0.01,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 2,
  },
  DisLp_FilterScrollContent: {
    paddingHorizontal: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  DisLp_FilterButton: {
    flex: 1,
    paddingVertical: height * 0.02,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  DisLp_ActiveFilterButton: {
    borderBottomWidth: 5,
    borderBottomColor: '#0A66C2',
  },
  DisLp_FilterButtonText: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  DisLp_ActiveFilterButtonText: {
    color: '#0A66C2',
    fontWeight: '700',
  },
  DisLp_MenuContainer: {
    paddingTop: width * 0.05,
    paddingHorizontal: width * 0.03,
  },
  DisLp_MenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.015,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    minHeight: height * 0.08,
  },
  DisLp_IconWrapper: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.04,
  },
  DisLp_MenuTitle: {
    flex: 1,
    fontSize: width * 0.042,
    fontWeight: '600',
    color: '#1f2937',
  },
  DisLp_NoMenuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: height * 0.1,
  },
  DisLp_NoMenuText: {
    fontSize: width * 0.045,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: width * 0.055,
  },
  DisLp_BottomPadding: {
    height: height * 0.05,
  },

  // end of display list page

  // start of Alert

  Alert_ModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  Alert_ModalBox: {
    width: width * 0.85,
    paddingVertical: height * 0.035,
    paddingHorizontal: width * 0.06,
    backgroundColor: '#fff',
    borderRadius: width * 0.04,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 6,
    alignItems: 'center',
  },
  Alert_ModalHeading: {
    fontSize: width * 0.05,
    fontWeight: '700',
    color: '#333',
    marginBottom: height * 0.015,
    textAlign: 'center',
  },
  Alert_ModalText: {
    fontSize: width * 0.038,
    color: '#555',
    textAlign: 'center',
    marginBottom: height * 0.02,
    lineHeight: 22,
  },
  Alert_ButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  Alert_CancelButton: {
    flex: 1,
    paddingVertical: height * 0.014,
    backgroundColor: '#ccc',
    borderRadius: width * 0.025,
    alignItems: 'center',
    marginRight: width * 0.025,
  },
  Alert_DeleteButton: {
    flex: 1,
    paddingVertical: height * 0.014,
    backgroundColor: '#FF5252',
    borderRadius: width * 0.025,
    alignItems: 'center',
    marginLeft: width * 0.025,
  },
  Alert_ButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.04,
  },
  Alert_OkButton: {
    marginTop: height * 0.001,
    backgroundColor: '#0A66C2',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.3,
    borderRadius: width * 0.03,
    alignItems: 'center',
  },
  Alert_OkButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.04,
  },

  // end of Alert

  // start of Alert Logout

  AlrtLg_CenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  AlrtLg_ModalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    AlrtLg_ShadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  AlrtLg_headingText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#525252',
  },
  AlrtLg_modalText: {
    marginTop: height * 0.005,
    marginBottom: height * 0.03,
    textAlign: 'center',
    color: 'grey',
    fontSize: 16,
  },
  AlrtLg_buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width * 0.7,
  },
  AlrtLg_button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    width: width * 0.3,
    marginHorizontal: width * 0.02,
  },
  AlrtLg_cancelButton: {
    backgroundColor: '#ff6666', // Red for cancel button
  },
  AlrtLg_confirmButton: {
    backgroundColor: '#4caf50', // Green for confirm button
  },
  AlrtLg_buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  // End of Alertlogout and alert component

  // Start of Custom Indicator component

  CInd_Container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // end of custom indicator component

  // start of leaves component
  // start of calender modal

  CalMod_ModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  CalMod_ModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
  },
  CalMod_CloseButton: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: '#0A66C2',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  CalMod_CloseButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // end of calendar modal

  // start of dynamic request card

  DRC_CardContainer: {
    marginVertical: height * 0.01,
    marginHorizontal: width * 0.01,
  },
  DRC_HighlightedContainer: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: width * 0.045,
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  DRC_Card: {
    borderRadius: width * 0.04,
    padding: width * 0.045,
    elevation: 3,
  },
  DRC_CardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.015,
  },
  DRC_CardHeaderText: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#37474F',
  },
  DRC_CardSubHeaderText: {
    fontWeight: '600',
    color: '#455A64',
    fontSize: width * 0.035,
  },
  DRC_ButtonsContainer: {
    flexDirection: 'row',
    gap: width * 0.025,
  },
  DRC_IconButton: {
    backgroundColor: '#0A66C2',
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  DRC_TextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#0A66C2',
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  DRC_Disabled: {
    backgroundColor: '#BDBDBD',
    borderColor: '#BDBDBD',
  },
  DRC_DisabledText: {
    color: '#999',
  },
  DRC_IconButtonText: {
    color: '#fff',
    fontSize: width * 0.025,
    marginLeft: 4,
  },
  DRC_TextButtonText: {
    color: '#0A66C2',
    fontWeight: '600',
    fontSize: width * 0.03,
    marginLeft: 6,
  },
  DRC_InfoBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height * 0.008,
  },
  DRC_Label: {
    fontWeight: '600',
    color: '#455A64',
    fontSize: width * 0.035,
  },
  DRC_Value: {
    color: '#263238',
    fontSize: Math.min(width * 0.035, 16), // max 16px
    flexShrink: 1,
    flexWrap: 'wrap',
    textAlign: 'right',
  },
  DRC_StatusText: {
    fontWeight: '900',
    fontSize: width * 0.035,
    textTransform: 'uppercase',
    color: '#112936ff',
  },
  DRC_SectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#555555',
    marginVertical: 8,
  },
  DRC_BottomContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    marginTop: height * 0.01,
  },
  DRC_BottomButtonsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    flexDirection: 'row',
    gap: 8,
  },
  DRC_ExpandToggle: {
    alignItems: 'center',
    padding: 5,
    backgroundColor: '#0A66C2',
    borderRadius: 50,
    alignSelf: 'center',
  },
  // end of dyanmic request card and also leaves component

  // start of page header component
  // start of company dropdown
  CD_Overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  CD_DropdownContainer: {
    marginTop: 10,
    marginRight: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    width: 200,
    maxHeight: 400,
  },
  CD_DropdownContent: {
    padding: 0,
  },
  CD_DropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A66C2',
    textAlign: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  CD_ScrollView: {
    maxHeight: 300,
  },
  CD_CompanyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  CD_CompanyInfo: {
    flex: 1,
  },
  CD_CompanyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  CD_SelectedCompanyName: {
    color: '#0A66C2',
  },
  CD_CheckIcon: {
    marginLeft: 10,
  },
  CD_NoDataText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  CD_FirstSelectedItem: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  CD_LastSelectedItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  CD_SelectedCompanyItem: {
    backgroundColor: '#ebf5ff',
    zIndex: 1,
  },
  // end of company dropdown

  // start of logout

  LgOut_ButtonContainer: {
    marginRight: 10,
    // Remove any background color or additional styles
  },
  // end of logout button

  //start of Main page header

  MPH_leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: width * 0.02, // wp(2)
  },
  MPH_leftSide: {
    width: width * 0.09, // wp(9)
    alignItems: 'center',
    height: height * 0.06, // hp(6)
    justifyContent: 'center',
    marginRight: width * 0.01, // wp(2)
  },
  MPH_title: {
    color: '#ffffff',
    fontSize: height * 0.021, // hp(4)
    fontWeight: 'bold',
  },
  MPH_rightSideView: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: width * 0.03, // wp(3)
  },
  MPH_dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: width * 0.017, // wp(2.5)
    paddingVertical: height * 0.01, // hp(2.2)
    borderRadius: width * 0.018, // wp(1.8)
    marginRight: width * 0.02, // wp(2)
  },
  MPH_dropdownText: {
    color: '#ffffff',
    fontSize: height * 0.016, // hp(3)
    fontWeight: '600',
  },
  MPH_dropdownIcon: {
    marginLeft: width * 0.01, // wp(1)
  },
  // end of Main Page header

  // start of notification Button

  NB_button: {
    marginRight: 10, // Adjust the right margin for proper spacing
  },
  NB_iconContainer: {
    position: 'relative', // Allows badge to position relative to the icon
    justifyContent: 'center',
    alignItems: 'center',
  },
  NB_badgeContainer: {
    position: 'absolute',
    top: -5, // Adjust vertical position of the badge
    right: -5, // Adjust horizontal position of the badge
    backgroundColor: '#FF4500', // Badge background color
    borderRadius: 10, // Makes the badge circular
    width: 18, // Set width of the badge
    height: 18, // Set height of the badge
    justifyContent: 'center', // Center align text in the badge
    alignItems: 'center', // Center align text in the badge
    borderWidth: 1, // Optional: Add border to improve visibility
    borderColor: '#FFFFFF', // Optional: Set border color
  },
  NB_badgeText: {
    color: '#FFFFFF', // Text color
    fontSize: 12, // Font size of the badge text
    fontWeight: 'bold', // Font weight of the badge text
  },

  // End of notification button
  // start of notification dropdown
  NotDD_overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  NotDD_dropdownContainer: {
    marginTop: 10,
    marginRight: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    width: 300,
  },
  NotDD_dropdownContent: {
    padding: 15,
  },
  NotDD_dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A66C2',
    marginBottom: 10,
    textAlign: 'center',
  },
  NotDD_dropdownText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 5,
  },
  NotDD_scrollView: {
    maxHeight: 300,
  },
  // end of notification dropdown or also end of page header

  // start of personal information component
  // start of contactdetail section
  CntDtlSec_detailsContainer: {
    padding: 16,
    backgroundColor: '#bddeff',
  },
  CntDtlSec_detailsContainerBorder: {
    padding: 16,
    marginTop: 16,
    backgroundColor: '#cce6ff',
    borderRadius: 5,
    elevation: 3,
  },
  CntDtlSec_textContainer: {
    marginBottom: 16,
  },
  CntDtlSec_textContainers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  CntDtlSec_cardTextHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
  CntDtlSec_insideCardTextHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    flexShrink: 1,
  },
  CntDtlSec_cardSideTextHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#808080',
    flexShrink: 0,
    width: '30%',
  },
  CntDtlSec_cardText: {
    fontSize: 14,
    color: '#808080',
    flexShrink: 1,
  },
  CntDtlSec_iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  CntDtlSec_editIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A66C2',
    borderRadius: 25,
    height: 30,
    width: 30,
    alignSelf: 'flex-end',
    marginLeft: 5,
  },
  CntDtlSec_deleteIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff292c',
    borderRadius: 25,
    height: 30,
    width: 30,
    alignSelf: 'flex-end',
    marginRight: 5,
  },
  CntDtlSec_createIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A66C2',
    borderRadius: 5,
    padding: 8,
    marginTop: 15,
  },
  // end of contact detail section

  // start of contact info modal

  CntInfoMdl_modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  CntInfoMdl_modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    justifyContent: 'center',
  },
  CntInfoMdl_modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  CntInfoMdl_modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#707070',
  },
  CntInfoMdl_label: {
    fontSize: 16,
    marginTop: 10,

    fontWeight: 'bold',
    color: '#8a8a8a',
  },
  CntInfoMdl_input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,

    fontSize: 16,
    fontWeight: '500',
    color: '#707070',
  },
  CntInfoMdl_disable: {
    backgroundColor: '#f7f7f7',
  },
  CntInfoMdl_modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  CntInfoMdl_button: {
    flex: 1,
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  CntInfoMdl_submitButton: {
    backgroundColor: '#0A66C2',
  },
  CntInfoMdl_buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // end of contact info modal

  // start of display  profile picture
  DispPP_headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  DispPP_profilePictureContainer: {
    position: 'relative',
    marginHorizontal: 18,
  },
  DispPP_profilePicture: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  DispPP_editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0A66C2',
    borderRadius: 25,
    padding: 10,
  },
  DispPP_headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 10,
  },

  // Modal Styles
  DispPP_modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  DispPP_modalContent: {
    backgroundColor: 'white',
    // padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  DispPP_modalImage: {
    width: width * 0.8,
    height: height * 0.6,
    borderRadius: 10,
    // marginBottom: 20,
  },
  // end of display profile picture

  // start of  profile picture editor

  PPEdit_headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  PPEdit_profileImageWrapper: {
    position: 'relative',
    marginHorizontal: 18,
  },
  PPEdit_profilePictureContainer: {
    width: PROFILE_IMAGE_SIZE + BORDER_WIDTH * 2,
    height: PROFILE_IMAGE_SIZE + BORDER_WIDTH * 2,
    borderRadius: (PROFILE_IMAGE_SIZE + BORDER_WIDTH * 2) / 2,
    borderWidth: BORDER_WIDTH,
    borderColor: '#0A66C2',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  PPEdit_profilePicture: {
    width: PROFILE_IMAGE_SIZE,
    height: PROFILE_IMAGE_SIZE,
    borderRadius: PROFILE_IMAGE_SIZE / 2,
  },
  PPEdit_loadingContainer: {
    width: PROFILE_IMAGE_SIZE,
    height: PROFILE_IMAGE_SIZE,
    borderRadius: PROFILE_IMAGE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  PPEdit_editIconContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#0A66C2',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  PPEdit_headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 15,
    textAlign: 'center',
  },

  // Modal Styles
  PPEdit_modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  PPEdit_modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  PPEdit_modalImage: {
    width: width * 0.8,
    height: height * 0.8,
    borderRadius: 10,
  },
  // end of profile picture editor

  // start of save button
  SB_saveButton: {
    backgroundColor: '#0A66C2',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    position: 'relative',
    alignSelf: 'center',
    width: 320,
    marginTop: 10,
  },
  SB_saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // end of save button and also personal information component

  // start of worker assigned component

  AWC_cardContainer: {
    marginVertical: height * 0.01,
    marginHorizontal: width * 0.03,
  },

  AWC_card: {
    borderRadius: width * 0.04,
    padding: width * 0.045,
    elevation: 3,
  },

  AWC_cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.015,
  },

  AWC_cardHeaderText: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#37474F',
    flex: 1,
  },

  AWC_profilePicture: {
    width: width * 0.14,
    height: width * 0.14,
    borderRadius: width * 0.07,
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: '#0A66C2',
  },

  AWC_cardContent: {
    marginTop: height * 0.01,
  },

  AWC_textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height * 0.008,
    flexWrap: 'wrap',
  },

  AWC_cardTextHeading: {
    fontWeight: '600',
    color: '#455A64',
    fontSize: width * 0.035,
    flex: 1,
  },

  AWC_cardText: {
    color: '#263238',
    fontSize: width * 0.035,
    flex: 1,
    textAlign: 'right',
  },

  AWC_sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#BDBDBD',
    marginVertical: height * 0.012,
  },

  AWC_navigateButton: {
    borderColor: '#0A66C2',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.04,
    marginVertical: height * 0.008,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

  AWC_navigateButtonText: {
    color: '#000000ff',
    fontWeight: 'bold',
    fontSize: width * 0.038,
  },

  AWC_expandButton: {
    alignItems: 'center',
    marginTop: height * 0.015,
    padding: 6,
    backgroundColor: '#0A66C2',
    borderRadius: 50,
    alignSelf: 'center',
  },
  // end of assigned worker card
  // action pane container

  APCont_container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  APCont_content: {
    flex: 1,
    // paddingHorizontal: width * 0.03,
    // paddingTop: height * 0.01,
  },

  APCont_bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#0A66C2',
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.18,
    justifyContent: 'space-between',
    alignItems: 'center',
    height: height * 0.075,
  },

  APCont_tabButton: {
    alignItems: 'center',
  },

  APCont_tabButtonText: {
    fontSize: width * 0.032,
    color: '#ffffff',
    marginTop: 2,
    fontWeight: '500',
  },

  APCont_floatingPlusButtonContainer: {
    position: 'absolute',
    bottom: height * 0.035,
    left: width / 2 - 28,
  },

  APCont_floatingPlusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#0A66C2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  APCont_plusIcon: {
    fontSize: 24,
    color: '#0A66C2',
  },
  // end of worker assigned me component
});

export default styles;
