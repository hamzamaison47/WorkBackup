import {StyleSheet, Dimensions} from 'react-native';

const {height, width} = Dimensions.get('window');
const cardWidth = (width - 56) / 2;

export const styles = StyleSheet.create({
  // start of  splash page name
  splashcontainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  Splashlogo: {
    width: 200,
    height: 80,
    marginBottom: 20,
  },
  Splashtext: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
  },
  Splashtagline: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 10,
    fontStyle: 'italic',
    fontWeight: '300',
  },
  Splashloader: {
    marginTop: 20,
  },
  // end of splash screen name

  // Start of Maindashboard Screen
  Maincontainer: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  MainscrollView: {
    flex: 1,
  },
  MainscrollContainer: {
    flexGrow: 1,
    paddingBottom: height * 0.1, // Extra padding for fixed button
  },
  MainheaderContainer: {
    width: width * 0.9,
    alignSelf: 'center',
    marginTop: height * 0.03,
    // marginBottom: height * 0.001,
  },
  MainwelcomeCard: {
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
  MainHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  MainProfilePicture: {
    width: height * 0.12,
    height: height * 0.12,
    borderRadius: height * 0.125,
    marginRight: width * 0.02,
    borderWidth: 4,
    borderColor: '#0A66C2',
  },
  MainTextColumn: {
    flexDirection: 'column',
    flex: 1,
  },
  MainWelcomeText: {
    fontSize: height * 0.025,
    fontWeight: 'bold',
    color: '#1A1A1A',
    // marginBottom: height * 0.008,
    textAlign: 'left',
  },
  MainNameText: {
    fontSize: height * 0.022,
    color: '#0A66C2',
    fontWeight: '600',
    textAlign: 'left',
    // marginBottom: height * 0.005,
  },
  MainEmailText: {
    fontSize: height * 0.015,
    color: '#5A5A5A',
    textAlign: 'left',
  },
  Maingrid: {
    paddingHorizontal: 20,
    // paddingTop: 10,
    paddingBottom: 40,
  },
  Mainrow: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  Maincard: {
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
  MainIconWrapper: {
    backgroundColor: '#0A66C2',
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
    shadowColor: '#0A66C2',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
  },
  MainCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },
  MainModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  MainModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  MainModalImage: {
    width: width * 0.08,
    height: height * 0.06,
    borderRadius: 10,
  },
  // End Of MainDashboard

  // Start of Login Screen
  LoginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  Loginlogo: {
    width: 200,
    height: 80,
    marginBottom: 20,
  },
  LoginTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333333',
    textAlign: 'center',
  },
  LoginSubtitle: {
    fontSize: 18,
    color: '#333333',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 15,
    fontStyle: 'italic',
  },
  LoginButton: {
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
  LoginButtonText: {
    color: '#0A66C2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  LoginIcon: {
    marginRight: 10,
  },

  LoginLoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  LoginLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  LoginDialogContainer: {
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  LoginDialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  LoginDialogContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  LoginDialogMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  LoginDialogButton: {
    backgroundColor: '#0A66C2',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  LoginDialogButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // End Of Login

  //WorkAssigned
  TeamContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  TeamMainTxt: {
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

  SalarySlipContainer: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  SalarySlipScrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.05,
    marginTop: width * 0.1,
  },
  SalarySlipIcon: {
    marginBottom: height * 0.03,
  },
  SalarySlipScreenTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.01,
  },
  SalarySlipScreenSubtitle: {
    fontSize: width * 0.04,
    color: '#666',
    textAlign: 'center',
    marginBottom: height * 0.025,
  },
  SalarySlipFieldsHeading: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.015,
  },
  SalarySlipDropdown: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.03,
    backgroundColor: '#fff',
    marginBottom: height * 0.025,
    width: '100%',
  },
  SalarySlipItemText: {
    color: '#000',
    fontSize: width * 0.04,
  },
  SalarySlipDropdownPlaceholder: {
    color: '#999',
    fontSize: width * 0.04,
  },
  SalarySlipDropdownSelected: {
    color: '#000',
    fontSize: width * 0.04,
  },
  SalarySlipButton: {
    borderRadius: 8,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.05,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.025,
    width: '100%',
  },
  SalarySlipButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  SalarySlipButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  // End oF Salary Slip

  // Start of Leave Request Save Record
  LeaveReqSRSafeArea: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  LeaveReqSRContentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.03,
    paddingTop: height * 0.01,
  },
  LeaveReqSRFormContainer: {
    padding: 5,
    paddingBottom: 100,
  },
  LeaveReqSRLabel: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: '600',
    color: '#444',
  },
  LeaveReqSRInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fff',
  },
  LeaveReqSRDisabled: {
    backgroundColor: '#f1f1f1',
    color: '#999',
  },
  LeaveReqSRTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  LeaveReqSRDateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  LeaveReqSRDateText: {
    fontSize: 15,
    color: '#333',
  },
  LeaveReqSRFooter: {
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
  LeaveReqSRButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#0A66C2',
    borderRadius: 20,
    paddingVertical: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  LeaveReqSRSubmitButton: {
    borderColor: '#0A66C2',
    backgroundColor: '#0A66C2',
  },
  LeaveReqSRDisabledButton: {
    opacity: 0.6,
  },
  LeaveReqSRButtonText: {
    fontWeight: 'bold',
    color: '#0A66C2',
  },
  LeaveReqSRSubmitButtonText: {
    fontWeight: 'bold',
    color: '#ffffffff',
  },
  LeaveReqSRPressedButton: {
    backgroundColor: '#0A66C2',
  },
  LeaveReqSRpressedSubmitButton: {
    backgroundColor: '#3d95edff',
    borderColor: '#3d95edff',
  },
  LeaveReqSRpressedText: {
    color: '#fff',
  },
  // End oF Leave Req Save Record

  // Start oF Leave Req List Page
  LeaveReqLpListContainer: {
    paddingBottom: height * 0.05,
    paddingHorizontal: width * 0.03,
    paddingTop: height * 0.01,
  },
  LeaveReqLpNoDataText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: width * 0.04,
    fontWeight: 'bold',
    color: '#999999',
  },
  // End Of Leave Req List Page

  // Start Of Display Personal Info
  DisplayPIContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  DisplayPIScrollView: {
    flex: 1,
  },
  DisplayPIScrollContainer: {
    flexGrow: 1,
    //paddingBottom: screenHeight * 0.1, // Extra padding for fixed button
  },
  DisplayPITopContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  DisplayPIImageContainer: {
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.025,
    paddingBottom: height * 0.01,
    alignItems: 'center',
  },
  DisplayPIFixedButtonContainer: {
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
  TaxCertificateContainer: {
    flex: 1,
    backgroundColor: '#f7f7f7', // Matches SalarySlipContainer for consistency
    justifyContent: 'center',
    alignItems: 'center',
  },
  TaxCertificateScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: width * 0.05,
    paddingTop: height * 0.1,
    paddingBottom: height * 0.1, // Ensure enough space for scrolling
  },
  TaxCertificateIcon: {
    marginBottom: height * 0.03,
    alignSelf: 'center',
  },
  TaxCertificateScreenTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.01,
    textAlign: 'center',
  },
  TaxCertificateScreenSubtitle: {
    fontSize: width * 0.04,
    color: '#666',
    textAlign: 'center',
    marginBottom: height * 0.025,
    paddingHorizontal: width * 0.05,
  },
  TaxCertificateLabel: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#444',
    marginTop: height * 0.015,
    marginBottom: height * 0.01,
    textAlign: 'center',
    width: '100%',
  },
  TaxCertificateInput: {
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
  TaxCertificateDisabled: {
    backgroundColor: '#f1f1f1',
    color: '#999',
  },
  TaxCertificateDateSelector: {
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
  TaxCertificateDateText: {
    fontSize: width * 0.04,
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  TaxCertificateButton: {
    borderRadius: 8,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.05,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.025,
    width: '100%',
  },
  TaxCertificateButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  TaxCertificateButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
