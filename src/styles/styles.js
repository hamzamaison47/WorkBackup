/* eslint-disable no-unused-vars */
import {StyleSheet, Dimensions, Platform} from 'react-native';
import {
  scale,
  verticalScale,
  moderateScale,
  fontScale,
  isSmallScreen,
  isTablet,
  conditionalScale,
  conditionalValue,
} from '../store/utils/scaling';
const {height, width} = Dimensions.get('window');

const PROFILE_IMAGE_SIZE = width * 0.35; // responsive image size
const BORDER_WIDTH = 5;

const styles = StyleSheet.create({
  // ============================================
  // SPLASH SCREEN - RESPONSIVE STYLES
  // ============================================
  splash_Container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  splash_Logo: {
    width: scale(200),
    height: verticalScale(80),
    marginBottom: verticalScale(20),
  },
  splash_Text: {
    fontSize: fontScale(30),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
    textAlign: 'center',
    paddingHorizontal: scale(20),
    lineHeight: fontScale(36),
  },
  splash_Tagline: {
    fontSize: fontScale(18),
    color: '#FFFFFF',
    marginTop: verticalScale(10),
    fontStyle: 'italic',
    fontWeight: '300',
    textAlign: 'center',
    paddingHorizontal: scale(20),
    lineHeight: fontScale(22),
  },
  splash_Loader: {
    marginTop: verticalScale(20),
  },
  splash_Circle1: {
    position: 'absolute',
    width: scale(300),
    height: scale(300),
    borderRadius: scale(150),
    backgroundColor: '#FFFFFF',
    top: '-15%',
    right: '-15%',
  },
  splash_Circle2: {
    position: 'absolute',
    width: scale(200),
    height: scale(200),
    borderRadius: scale(100),
    backgroundColor: '#FFFFFF',
    bottom: '-10%',
    left: '-10%',
  },
  splash_Circle3: {
    position: 'absolute',
    width: scale(150),
    height: scale(150),
    borderRadius: scale(75),
    backgroundColor: '#FFFFFF',
    top: '60%',
    right: '20%',
  },

  // ============================================
  // MAIN DASHBOARD - RESPONSIVE STYLES (DETAILED)
  // ============================================
  MainDash_Container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  MainDash_ScrollView: {
    flex: 1,
  },

  MainDash_HeaderContainer: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(20),
    borderBottomLeftRadius: moderateScale(32),
    borderBottomRightRadius: moderateScale(32),
    backgroundColor: '#0A66C2',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 6,
    elevation: 4,
  },

  MainDash_HeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  MainDash_HeaderContentSmall: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  MainDash_ProfilePicture: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    borderWidth: scale(3),
    borderColor: '#fff',
    backgroundColor: '#EAF2FB',
  },

  MainDash_AvatarContainer: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    borderWidth: scale(3),
    borderColor: '#fff',
    backgroundColor: '#bed8f6ff',
    marginRight: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },

  MainDash_AvatarContainerSmall: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    borderWidth: scale(3),
    borderColor: '#fff',
    backgroundColor: '#bed8f6ff',
    marginRight: 0,
    marginBottom: verticalScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },

  MainDash_AvatarText: {
    fontSize: fontScale(28),
    fontWeight: '700',
    color: '#0A66C2',
  },

  MainDash_TextColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },

  MainDash_TextColumnSmall: {
    flex: 1,
    alignItems: 'center',
  },

  MainDash_NameText: {
    fontSize: fontScale(20),
    fontWeight: '700',
    color: '#fff',
    marginBottom: verticalScale(2),
    textAlign: 'left',
  },

  MainDash_NameTextSmall: {
    fontSize: fontScale(20),
    fontWeight: '700',
    color: '#fff',
    marginBottom: verticalScale(2),
    textAlign: 'center',
  },

  MainDash_EmailText: {
    fontSize: fontScale(13),
    color: '#DCE6F5',
    textAlign: 'left',
    lineHeight: fontScale(16),
  },

  MainDash_EmailTextSmall: {
    fontSize: fontScale(13),
    color: '#DCE6F5',
    textAlign: 'center',
    lineHeight: fontScale(16),
  },

  MainDash_BoldText: {
    fontSize: fontScale(13),
    color: '#DCE6F5',
    fontWeight: 'bold',
  },

  MainDash_MainContent: {
    flex: 1,
    paddingTop: verticalScale(22),
  },

  MainDash_SectionTitle: {
    fontSize: fontScale(18),
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: verticalScale(18),
    paddingHorizontal: scale(20),
  },

  MainDash_Card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(10),
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 6,
    elevation: 2,
  },

  MainDash_CardTitle: {
    fontSize: fontScale(12),
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: fontScale(14),
    marginTop: verticalScale(8),
  },

  MainDash_IndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(12),
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(20),
  },

  MainDash_IndicatorDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: '#0A66C2',
    marginHorizontal: scale(4),
  },

  MainDash_IndicatorDotInactive: {
    opacity: 0.3,
  },

  MainDash_NoMenuContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
    paddingHorizontal: scale(20),
  },

  MainDash_NoMenuText: {
    fontSize: fontScale(16),
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },

  MainDash_CardIcon: {
    resizeMode: 'contain',
  },

  MainDash_PageContainer: {
    paddingHorizontal: scale(20),
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },

  // ============================================
  // LOGIN SCREEN - RESPONSIVE STYLES
  // ============================================
  Login_Container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
  },

  Login_Header: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
    width: '100%',
  },

  Login_QRButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? verticalScale(50) : verticalScale(50),
    right: scale(20),
    width: scale(50),
    height: scale(50),
    borderRadius: scale(28),
    backgroundColor: '#fff',
    borderWidth: moderateScale(2),
    borderColor: '#0A66C2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: moderateScale(2)},
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(3.84),
    zIndex: 10,
  },

  Login_FingerprintButton: {
    position: 'absolute',
    bottom: verticalScale(50),
    width: scale(70),
    height: scale(70),
    borderRadius: scale(40),
    backgroundColor: '#fff',
    borderWidth: moderateScale(2),
    borderColor: '#0A66C2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: moderateScale(2)},
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(3.84),
  },

  Login_Logo: {
    width: scale(210),
    height: verticalScale(100),
    marginBottom: verticalScale(20),
    resizeMode: 'contain',
  },

  Login_Title: {
    fontSize: fontScale(24),
    fontWeight: 'bold',
    marginBottom: verticalScale(8),
    color: '#333333',
    textAlign: 'center',
    lineHeight: fontScale(30),
  },

  Login_Subtitle: {
    fontSize: fontScale(14),
    color: '#666666',
    // marginBottom: verticalScale(10),
    textAlign: 'center',
    paddingHorizontal: scale(20),
    lineHeight: fontScale(20),
    maxWidth: scale(300),
  },

  Login_ButtonsContainer: {
    width: '100%',
    alignItems: 'center',
    // marginBottom: verticalScale(20),
  },

  Login_Button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '85%',
    maxWidth: scale(320),
    height: verticalScale(52),
    borderRadius: moderateScale(25),
    borderWidth: moderateScale(2),
    borderColor: '#0A66C2',
    marginVertical: verticalScale(8),
    paddingHorizontal: scale(20),
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  Login_ButtonText: {
    color: '#0A66C2',
    fontSize: fontScale(15),
    fontWeight: '600',
  },

  Login_Icon: {
    marginRight: scale(12),
  },

  Login_LoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },

  Login_LoadingText: {
    marginTop: verticalScale(16),
    fontSize: fontScale(15),
    color: '#333',
    textAlign: 'center',
    lineHeight: fontScale(20),
    paddingHorizontal: scale(20),
  },

  Login_DialogContainer: {
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  Login_DialogTitle: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: verticalScale(12),
  },

  Login_DialogMessage: {
    fontSize: fontScale(14),
    color: '#666',
    textAlign: 'center',
    marginBottom: verticalScale(20),
    paddingHorizontal: scale(10),
    lineHeight: fontScale(20),
  },

  Login_DialogButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: scale(10),
  },

  Login_DialogButton: {
    flex: 1,
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    minHeight: verticalScale(44),
  },

  Login_DialogButtonText: {
    color: '#fff',
    fontSize: fontScale(14),
    fontWeight: '600',
  },

  Login_Divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(20),
    width: '100%',
    maxWidth: scale(300),
  },

  Login_DividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },

  Login_DividerText: {
    marginHorizontal: scale(16),
    fontSize: fontScale(13),
    color: '#6B7280',
    fontWeight: '600',
  },

  // ============================================
  // CONFIG SELECTION SCREEN - RESPONSIVE STYLES
  // ============================================
  ConfigSelection_Container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },

  ConfigSelection_Header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(16),
    paddingTop: verticalScale(20),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },

  ConfigSelection_HeaderButton: {
    width: scale(44),
    height: scale(44),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scale(22),
    backgroundColor: '#f0f8ff',
  },

  ConfigSelection_HeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },

  ConfigSelection_HeaderTitle: {
    fontSize: fontScale(20),
    fontWeight: '700',
    color: '#1a1a1a',
  },

  ConfigSelection_HeaderSubtitle: {
    fontSize: fontScale(12),
    color: '#666',
    marginTop: verticalScale(2),
  },

  ConfigSelection_ListContainer: {
    padding: scale(16),
    paddingBottom: verticalScale(32),
  },

  ConfigSelection_ConfigCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    borderWidth: 2,
    borderColor: '#e8eaed',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: verticalScale(16),
  },

  ConfigSelection_ActiveConfigCard: {
    borderColor: '#0A66C2',
    backgroundColor: '#f8fbff',
  },

  ConfigSelection_ActiveBadge: {
    position: 'absolute',
    top: moderateScale(12),
    right: moderateScale(12),
    backgroundColor: '#0A66C2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    gap: scale(4),
  },

  ConfigSelection_ActiveBadgeText: {
    color: '#fff',
    fontSize: fontScale(10),
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  ConfigSelection_CardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(16),
  },

  ConfigSelection_CardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  ConfigSelection_IconContainer: {
    width: scale(44),
    height: scale(44),
    borderRadius: moderateScale(12),
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },

  ConfigSelection_ActiveIconContainer: {
    backgroundColor: '#0A66C2',
  },

  ConfigSelection_ConfigTitle: {
    fontSize: fontScale(18),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: verticalScale(4),
  },

  ConfigSelection_ConfigSubtitle: {
    fontSize: fontScale(12),
    color: '#666',
  },

  ConfigSelection_CardActions: {
    marginTop: verticalScale(24),
    flexDirection: 'row',
    gap: scale(8),
  },

  ConfigSelection_ActionButton: {
    width: scale(36),
    height: scale(36),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(8),
    backgroundColor: '#f5f7fa',
  },

  ConfigSelection_CardDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    gap: verticalScale(10),
  },

  ConfigSelection_DetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ConfigSelection_DetailIcon: {
    marginRight: scale(8),
    width: scale(16),
  },

  ConfigSelection_DetailLabel: {
    fontSize: fontScale(12),
    color: '#666',
    fontWeight: '600',
    width: scale(90),
  },

  ConfigSelection_DetailValue: {
    fontSize: fontScale(12),
    color: '#1a1a1a',
    flex: 1,
    fontWeight: '500',
  },

  ConfigSelection_EmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(40),
  },

  ConfigSelection_EmptyIconContainer: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },

  ConfigSelection_EmptyStateTitle: {
    fontSize: fontScale(24),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: verticalScale(12),
  },

  ConfigSelection_EmptyStateSubtitle: {
    fontSize: fontScale(15),
    color: '#666',
    textAlign: 'center',
    lineHeight: fontScale(22),
    marginBottom: verticalScale(32),
    paddingHorizontal: scale(20),
  },

  ConfigSelection_PrimaryButton: {
    backgroundColor: '#0A66C2',
    paddingHorizontal: scale(28),
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0A66C2',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  ConfigSelection_ButtonIcon: {
    marginRight: scale(8),
  },

  ConfigSelection_PrimaryButtonText: {
    color: '#fff',
    fontSize: fontScale(16),
    fontWeight: '700',
  },

  // Modal Styles
  ConfigSelection_ModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },

  ConfigSelection_ModalContent: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    width: '100%',
    maxWidth: scale(400),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  ConfigSelection_ModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },

  ConfigSelection_ModalTitle: {
    fontSize: fontScale(20),
    fontWeight: '700',
    color: '#1a1a1a',
  },

  ConfigSelection_ModalCloseButton: {
    width: scale(32),
    height: scale(32),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: scale(16),
    backgroundColor: '#f5f7fa',
  },

  ConfigSelection_ModalBody: {
    padding: moderateScale(20),
  },

  ConfigSelection_InputLabel: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: verticalScale(8),
  },

  ConfigSelection_Input: {
    borderWidth: 2,
    borderColor: '#e8eaed',
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    fontSize: fontScale(16),
    color: '#1a1a1a',
    backgroundColor: '#f8f9fa',
  },

  ConfigSelection_ModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: moderateScale(20),
    gap: scale(12),
    borderTopWidth: 1,
    borderTopColor: '#e8eaed',
  },

  ConfigSelection_SecondaryButton: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(10),
    backgroundColor: '#f5f7fa',
  },

  ConfigSelection_SecondaryButtonText: {
    color: '#666',
    fontSize: fontScale(15),
    fontWeight: '600',
  },

  ConfigSelection_PrimaryButtonModal: {
    backgroundColor: '#0A66C2',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(10),
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ============================================
  // QR SETUP SCREEN - RESPONSIVE STYLES
  // ============================================
  QRSetup_Container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },

  QRSetup_Header: {
    paddingTop: Platform.OS === 'ios' ? verticalScale(60) : verticalScale(40),
    paddingBottom: verticalScale(24),
    paddingHorizontal: scale(20),
    backgroundColor: '#fff',
    borderBottomLeftRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  QRSetup_BackButton: {
    position: 'absolute',
    left: scale(20),
    top: Platform.OS === 'ios' ? verticalScale(60) : verticalScale(40),
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  QRSetup_HeaderContent: {
    alignItems: 'center',
  },

  QRSetup_IconBackground: {
    width: scale(80),
    height: scale(80),
    borderRadius: moderateScale(20),
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0A66C2',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: verticalScale(16),
  },

  QRSetup_Title: {
    fontSize: fontScale(24), // Reduced from 26 for better scaling
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },

  QRSetup_Subtitle: {
    fontSize: fontScale(14), // Reduced from 15 for better scaling
    color: '#666',
    textAlign: 'center',
    lineHeight: fontScale(20),
    maxWidth: '85%',
  },

  QRSetup_ScannerWrapper: {
    flex: 1,
    padding: scale(16),
  },

  QRSetup_ScannerContainer: {
    flex: 1,
    borderRadius: moderateScale(20), // Reduced from 24
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  QRSetup_Camera: {
    height: '100%',
  },

  QRSetup_Overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  QRSetup_OverlaySection: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },

  QRSetup_MiddleSection: {
    flexDirection: 'row',
    height: verticalScale(250), // Added fixed height for scanner frame area
  },

  QRSetup_ScannerFrame: {
    width: scale(250), // Reduced from 280 for better small screen support
    height: verticalScale(250),
    position: 'relative',
    alignSelf: 'center', // Center the frame
  },

  QRSetup_Corner: {
    position: 'absolute',
    width: scale(25), // Reduced from 30
    height: scale(25), // Reduced from 30
    borderColor: '#0A66C2',
  },

  QRSetup_TopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3, // Reduced from 4
    borderLeftWidth: 3, // Reduced from 4
    borderTopLeftRadius: moderateScale(6),
  },

  QRSetup_TopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3, // Reduced from 4
    borderRightWidth: 3, // Reduced from 4
    borderTopRightRadius: moderateScale(6),
  },

  QRSetup_BottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3, // Reduced from 4
    borderLeftWidth: 3, // Reduced from 4
    borderBottomLeftRadius: moderateScale(6),
  },

  QRSetup_BottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3, // Reduced from 4
    borderRightWidth: 3, // Reduced from 4
    borderBottomRightRadius: moderateScale(6),
  },

  QRSetup_ScanLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#0A66C2',
    shadowColor: '#0A66C2',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },

  QRSetup_InstructionsContainer: {
    position: 'absolute',
    bottom: verticalScale(10), // Increased from 5 for better spacing
    left: scale(20),
    right: scale(20),
    alignItems: 'center',
  },

  QRSetup_InstructionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  QRSetup_InstructionText: {
    fontSize: fontScale(14), // Reduced from 15
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: scale(8),
  },

  QRSetup_ProcessingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },

  QRSetup_ProcessingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: moderateScale(24),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    minWidth: scale(250), // Reduced from 280
    margin: scale(20),
  },

  QRSetup_ProcessingText: {
    fontSize: fontScale(16), // Reduced from 18
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },

  QRSetup_ProcessingSubtext: {
    fontSize: fontScale(13), // Reduced from 14
    color: '#666',
    textAlign: 'center',
    lineHeight: fontScale(18),
  },

  QRSetup_PermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },

  QRSetup_PermissionCard: {
    backgroundColor: '#fff',
    padding: moderateScale(24),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    maxWidth: scale(300), // Reduced from 320
    margin: scale(20),
  },

  QRSetup_PermissionIcon: {
    width: scale(80), // Reduced from 100
    height: scale(80), // Reduced from 100
    borderRadius: scale(40),
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },

  QRSetup_PermissionTitle: {
    fontSize: fontScale(18), // Reduced from 20
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },

  QRSetup_PermissionText: {
    fontSize: fontScale(14), // Reduced from 15
    color: '#666',
    textAlign: 'center',
    lineHeight: fontScale(20),
  },

  QRSetup_Footer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  QRSetup_FooterContent: {
    padding: scale(20),
    paddingBottom:
      Platform.OS === 'ios' ? verticalScale(30) : verticalScale(20),
  },

  QRSetup_GalleryButton: {
    backgroundColor: '#0A66C2',
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(12),
    shadowColor: '#0A66C2',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  QRSetup_GalleryButtonText: {
    color: '#fff',
    fontSize: fontScale(15), // Reduced from 16
    fontWeight: '700',
  },

  QRSetup_SkipButton: {
    backgroundColor: '#f0f8ff',
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0A66C2',
    marginBottom: verticalScale(16),
  },

  QRSetup_ButtonIcon: {
    marginRight: scale(8),
  },

  QRSetup_SkipButtonText: {
    color: '#0A66C2',
    fontSize: fontScale(15), // Reduced from 16
    fontWeight: '700',
  },

  QRSetup_HelpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
  },

  QRSetup_HelpText: {
    fontSize: fontScale(12), // Reduced from 13
    color: '#999',
    textAlign: 'center',
    lineHeight: fontScale(16),
  },

  // Modal Styles
  QRSetup_ModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(16),
  },

  QRSetup_ModalContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    padding: moderateScale(24),
    width: '100%',
    maxWidth: scale(340), // Reduced from 380
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  QRSetup_ModalIconContainer: {
    width: scale(70), // Reduced from 80
    height: scale(70), // Reduced from 80
    borderRadius: scale(35),
    backgroundColor: '#fff3e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },

  QRSetup_ModalTitle: {
    fontSize: fontScale(20), // Reduced from 22
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: verticalScale(12),
    textAlign: 'center',
  },

  QRSetup_ModalMessage: {
    fontSize: fontScale(14), // Reduced from 15
    color: '#666',
    textAlign: 'center',
    lineHeight: fontScale(20),
    marginBottom: verticalScale(24),
  },

  QRSetup_ModalButtons: {
    flexDirection: 'column',
    width: '100%',
    gap: verticalScale(12),
  },

  QRSetup_ModalButtonPrimary: {
    backgroundColor: '#0A66C2',
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    shadowColor: '#0A66C2',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  QRSetup_ModalButtonPrimaryText: {
    color: '#fff',
    fontSize: fontScale(15), // Reduced from 16
    fontWeight: '700',
  },

  QRSetup_ModalButtonSecondary: {
    backgroundColor: '#f5f7fa',
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8eaed',
  },

  QRSetup_ModalButtonSecondaryText: {
    color: '#666',
    fontSize: fontScale(15), // Reduced from 16
    fontWeight: '600',
  },

  // ============================================
  // BIOMETRIC SETTINGS SCREEN - RESPONSIVE STYLES
  // ============================================
  Biometric_container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  Biometric_scrollView: {
    flex: 1,
  },

  Biometric_scrollContent: {
    flexGrow: 1,
    paddingTop: 0,
  },

  Biometric_headerContainer: {
    paddingTop: verticalScale(40),
    paddingBottom: verticalScale(30),
    paddingHorizontal: scale(24),
    borderBottomLeftRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
    elevation: 8,
    shadowColor: '#0A66C2',
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(12),
    shadowOffset: {width: 0, height: verticalScale(6)},
    marginBottom: verticalScale(8),
  },

  Biometric_headerContent: {
    gap: verticalScale(16),
  },

  Biometric_headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },

  Biometric_headerIconContainer: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: moderateScale(1.5),
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  Biometric_headerIconSize: fontScale(28),

  Biometric_headerTitle: {
    fontSize: fontScale(24),
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },

  Biometric_headerSubtitle: {
    fontSize: fontScale(15),
    color: '#E0E7FF',
    lineHeight: fontScale(22),
    marginTop: verticalScale(4),
  },

  Biometric_statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    gap: scale(6),
    borderWidth: moderateScale(1),
  },

  Biometric_statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },

  Biometric_statusInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  Biometric_statusIconSize: fontScale(14),

  Biometric_statusText: {
    fontSize: fontScale(13),
    fontWeight: '600',
  },

  Biometric_statusTextActive: {
    color: '#10B981',
  },

  Biometric_statusTextInactive: {
    color: '#E0E7FF',
  },

  Biometric_unavailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(40),
    backgroundColor: '#FFFFFF',
  },

  Biometric_unavailableIconSize: scale(64),

  Biometric_unavailableTitle: {
    fontSize: fontScale(20),
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: verticalScale(24),
    marginBottom: verticalScale(8),
  },

  Biometric_unavailableText: {
    fontSize: fontScale(15),
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: fontScale(22),
    paddingHorizontal: scale(20),
  },

  Biometric_sectionAccount: {
    padding: scale(24),
  },

  Biometric_sectionHeader: {
    marginBottom: verticalScale(16),
  },

  Biometric_sectionTitle: {
    fontSize: fontScale(18),
    fontWeight: '600',
    color: '#1C1C1E',
  },

  Biometric_accountsContainer: {
    gap: verticalScale(20),
  },

  Biometric_providerSection: {
    gap: verticalScale(8),
  },

  Biometric_accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    borderColor: 'transparent',
  },

  Biometric_selectedAccountItem: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },

  Biometric_accountIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
    borderWidth: moderateScale(1),
    borderColor: '#F2F2F7',
  },

  Biometric_accountIconSize: fontScale(20),

  Biometric_accountInfo: {
    flex: 1,
  },

  Biometric_accountEmail: {
    fontSize: fontScale(16),
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: verticalScale(2),
  },

  Biometric_selectedAccountEmail: {
    color: '#007AFF',
    fontWeight: '600',
  },

  Biometric_accountName: {
    fontSize: fontScale(14),
    color: '#8E8E93',
  },

  Biometric_enabledBadge: {
    fontSize: fontScale(12),
    color: '#10B981',
    fontWeight: '600',
    marginTop: verticalScale(4),
  },

  Biometric_checkIconSize: fontScale(20),

  Biometric_emptyState: {
    alignItems: 'center',
    padding: scale(40),
  },

  Biometric_emptyStateIconSize: scale(48),

  Biometric_emptyStateText: {
    fontSize: fontScale(16),
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
  },

  Biometric_emptyStateSubtext: {
    fontSize: fontScale(14),
    color: '#C7C7CC',
    textAlign: 'center',
    lineHeight: fontScale(20),
    paddingHorizontal: scale(20),
  },

  // ============================================
  // CONFIRMATION ALERT - RESPONSIVE STYLES
  // ============================================
  ConfAlert_overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },

  ConfAlert_modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(24),
    paddingVertical: verticalScale(28),
    paddingHorizontal: scale(24),
    width: Math.min(width * 0.85, scale(340)),
    maxWidth: scale(340),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(20),
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(25),
    elevation: 25,
  },

  ConfAlert_iconContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },

  ConfAlert_iconBackground: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: moderateScale(2),
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  ConfAlert_iconSize: fontScale(32),

  ConfAlert_contentContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },

  ConfAlert_heading: {
    fontSize: fontScale(20),
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: verticalScale(12),
    lineHeight: fontScale(26),
  },

  ConfAlert_description: {
    fontSize: fontScale(15),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: fontScale(22),
  },

  ConfAlert_buttonContainer: {
    flexDirection: 'row',
    gap: scale(12),
  },

  ConfAlert_button: {
    flex: 1,
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: verticalScale(48),
  },

  ConfAlert_secondaryButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: moderateScale(1.5),
    borderColor: '#E5E7EB',
  },

  ConfAlert_primaryButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(4),
    },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(8),
    elevation: 8,
  },

  ConfAlert_secondaryButtonText: {
    fontSize: fontScale(15),
    fontWeight: '600',
    color: '#6B7280',
  },

  ConfAlert_primaryButtonText: {
    fontSize: fontScale(15),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ============================================
  // SAVE RECORD BUTTONS - RESPONSIVE STYLES
  // ============================================
  SRBtn_Footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(10),
    paddingHorizontal: conditionalScale(8, 12, 16),
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    position: 'relative',
    minHeight: verticalScale(70),
    gap: conditionalScale(6, 8, 12),
  },

  SRBtn_SingleButtonFooter: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  SRBtn_Button: {
    borderWidth: conditionalValue(1, 2, 2),
    borderColor: '#0A66C2',
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    minWidth: conditionalScale(80, 100, 120),
    minHeight: verticalScale(44),
  },

  SRBtn_SingleButton: {
    flex: 0.5,
    alignSelf: 'center',
    maxWidth: conditionalScale(200, 250, 300),
  },

  SRBtn_SubmitButton: {
    borderColor: '#0A66C2',
    backgroundColor: '#0A66C2',
  },

  SRBtn_CancelButton: {
    borderColor: '#cccccc',
    backgroundColor: 'transparent',
  },

  SRBtn_DisabledButton: {
    opacity: 0.6,
  },

  SRBtn_ButtonText: {
    fontWeight: conditionalValue('600', 'bold', 'bold'),
    fontSize: fontScale(conditionalValue(12, 14, 16)),
    color: '#0A66C2',
    textAlign: 'center',
    includeFontPadding: false,
  },

  SRBtn_SubmitButtonText: {
    fontWeight: conditionalValue('600', 'bold', 'bold'),
    fontSize: fontScale(conditionalValue(12, 13, 15)),
    color: '#fff',
    textAlign: 'center',
    includeFontPadding: false,
  },

  SRBtn_CancelButtonText: {
    fontWeight: conditionalValue('600', 'bold', 'bold'),
    fontSize: fontScale(conditionalValue(12, 14, 16)),
    color: '#666666',
    textAlign: 'center',
    includeFontPadding: false,
  },

  SRBtn_SingleButtonText: {
    fontSize: fontScale(conditionalValue(14, 16, 18)),
    fontWeight: 'bold',
  },

  SRBtn_PressedButton: {
    backgroundColor: '#0A66C2',
    transform: [{scale: 0.98}],
  },

  SRBtn_pressedSubmitButton: {
    backgroundColor: '#3d95edff',
    borderColor: '#3d95edff',
    transform: [{scale: 0.98}],
  },

  SRBtn_pressedCancelButton: {
    backgroundColor: '#e6e6e6',
    transform: [{scale: 0.98}],
  },

  SRBtn_pressedText: {
    color: '#fff',
  },

  SRBtn_pressedCancelText: {
    color: '#959595ff',
  },

  // // ============================================
  // // DYNAMIC REQUEST CARD - RESPONSIVE STYLES
  // // ============================================
  // DRC_CardContainer: {
  //   marginVertical: verticalScale(8),
  //   marginHorizontal: scale(8),
  // },

  // DRC_HighlightedContainer: {
  //   borderWidth: moderateScale(2),
  //   borderColor: '#4CAF50',
  //   borderRadius: moderateScale(16),
  //   elevation: 8,
  //   shadowColor: '#4CAF50',
  //   shadowOffset: {width: 0, height: 4},
  //   shadowOpacity: 0.3,
  //   shadowRadius: 8,
  // },

  // DRC_Card: {
  //   borderRadius: moderateScale(16),
  //   padding: moderateScale(16),
  //   elevation: 3,
  //   shadowColor: '#000',
  //   shadowOffset: {width: 0, height: 2},
  //   shadowOpacity: 0.1,
  //   shadowRadius: 4,
  // },

  // DRC_CardHeader: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'flex-start',
  //   marginBottom: verticalScale(12),
  // },

  // DRC_CardHeaderText: {
  //   fontSize: fontScale(18),
  //   fontWeight: '700',
  //   color: '#37474F',
  //   lineHeight: fontScale(22),
  // },

  // DRC_CardSubHeaderText: {
  //   fontWeight: '600',
  //   color: '#455A64',
  //   fontSize: fontScale(14),
  //   lineHeight: fontScale(18),
  //   marginTop: verticalScale(2),
  // },

  // DRC_ButtonsContainer: {
  //   flexDirection: 'row',
  //   gap: scale(8),
  //   flexShrink: 1,
  // },

  // // KEEP original style but FIX icon visibility - change iconColor to dark color
  // DRC_IconButton: {
  //   backgroundColor: '#0A66C2', // Keep original blue background
  //   borderRadius: moderateScale(20),
  //   padding: moderateScale(8),
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   minWidth: moderateScale(36),
  //   minHeight: moderateScale(36),
  // },

  // // Remove text from icon buttons - set to null
  // DRC_IconButtonText: null, // Remove text styling

  // DRC_TextButton: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   borderColor: '#0A66C2',
  //   borderWidth: moderateScale(2),
  //   paddingHorizontal: scale(12),
  //   paddingVertical: verticalScale(6),
  //   borderRadius: moderateScale(20),
  // },

  // DRC_Disabled: {
  //   backgroundColor: '#BDBDBD',
  //   borderColor: '#BDBDBD',
  //   opacity: 0.6,
  // },

  // DRC_DisabledText: {
  //   color: '#999',
  // },

  // DRC_TextButtonText: {
  //   color: '#0A66C2',
  //   fontWeight: '600',
  //   fontSize: fontScale(14),
  //   marginLeft: scale(6),
  // },

  // DRC_InfoBlock: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'flex-start',
  //   marginBottom: verticalScale(8),
  //   flexWrap: 'wrap',
  // },

  // DRC_Label: {
  //   fontWeight: '600',
  //   color: '#455A64',
  //   fontSize: fontScale(14),
  //   lineHeight: fontScale(18),
  //   flex: 1,
  // },

  // DRC_Value: {
  //   color: '#263238',
  //   fontSize: fontScale(14),
  //   lineHeight: fontScale(18),
  //   flex: 1,
  //   textAlign: 'right',
  //   flexWrap: 'wrap',
  // },

  // DRC_StatusText: {
  //   fontWeight: '700',
  //   fontSize: fontScale(14),
  //   color: '#112936',
  //   textAlign: 'center',
  // },

  // DRC_SectionDivider: {
  //   borderBottomWidth: moderateScale(1),
  //   borderBottomColor: 'rgba(85, 85, 85, 0.3)',
  //   marginVertical: verticalScale(8),
  // },

  // DRC_BottomContainer: {
  //   flexDirection: 'column',
  //   alignItems: 'center',
  //   position: 'relative',
  // },

  // DRC_BottomButtonsContainer: {
  //   position: 'absolute',
  //   right: 0,
  //   top: 0,
  //   flexDirection: 'row',
  //   gap: scale(8),
  // },

  // DRC_ExpandToggle: {
  //   alignItems: 'center',
  //   padding: moderateScale(4),
  //   backgroundColor: '#0A66C2',
  //   borderRadius: moderateScale(15),
  //   alignSelf: 'center',
  //   minWidth: moderateScale(30),
  //   minHeight: moderateScale(30),
  //   justifyContent: 'center',
  // },

  // DRC_NavigationArrow: {
  //   position: 'absolute',
  //   right: scale(12),
  //   top: '50%',
  //   transform: [{translateY: -12}],
  //   width: scale(24),
  //   height: scale(24),
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },

  // DRC_ClickableContainer: {
  //   position: 'relative',
  // },

  // DRC_HeaderContentWithArrow: {
  //   flex: 1,
  //   marginRight: scale(40),
  // },

  // DRC_ButtonsContainerWithArrow: {
  //   marginRight: scale(30),
  // },

  // DRC_ValueWithArrow: {
  //   marginRight: scale(30),
  // },

  // DRC_BottomButtonsContainerWithArrow: {
  //   right: scale(30),
  // },

  // ============================================
  // DYNAMIC REQUEST CARD - FULLY DYNAMIC STYLES
  // ============================================
  DRC_CardContainer: {
    marginVertical: verticalScale(6),
    marginHorizontal: scale(2),
  },

  DRC_HighlightedContainer: {
    borderWidth: moderateScale(2),
    borderColor: '#4CAF50',
    borderRadius: moderateScale(16),
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  DRC_Card: {
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  DRC_CardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
  },

  DRC_CardHeaderText: {
    fontSize: fontScale(18),
    fontWeight: '700',
    color: '#37474F',
    lineHeight: fontScale(22),
  },

  DRC_CardSubHeaderText: {
    fontWeight: '600',
    color: '#455A64',
    fontSize: fontScale(14),
    lineHeight: fontScale(18),
    marginTop: verticalScale(2),
  },

  DRC_ButtonsContainer: {
    flexDirection: 'row',
    gap: scale(8),
    flexShrink: 1,
  },

  // Icon button with customizable background
  DRC_IconButton: {
    borderRadius: moderateScale(20),
    padding: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(36),
    minHeight: moderateScale(36),
  },

  DRC_TextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#0A66C2',
    borderWidth: moderateScale(2),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(20),
    gap: scale(6),
  },

  DRC_Disabled: {
    backgroundColor: '#BDBDBD',
    borderColor: '#BDBDBD',
    opacity: 0.6,
  },

  DRC_DisabledText: {
    color: '#999',
  },

  DRC_TextButtonText: {
    color: '#0A66C2',
    fontWeight: '600',
    fontSize: fontScale(14),
  },

  DRC_InfoBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(8),
    flexWrap: 'wrap',
  },

  DRC_Label: {
    fontWeight: '600',
    color: '#455A64',
    fontSize: fontScale(14),
    lineHeight: fontScale(18),
    flex: 1,
  },

  DRC_Value: {
    color: '#263238',
    fontSize: fontScale(14),
    lineHeight: fontScale(18),
    flex: 1,
    textAlign: 'right',
    flexWrap: 'wrap',
  },

  DRC_StatusText: {
    fontWeight: '800',
    fontSize: fontScale(14),
    color: '#112936',
    textAlign: 'left',
    width: '100%',
  },

  DRC_SectionDivider: {
    borderBottomWidth: moderateScale(1),
    borderBottomColor: 'rgba(85, 85, 85, 0.3)',
    marginVertical: verticalScale(8),
  },

  // Dynamic bottom container - adapts to content
  DRC_BottomContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    marginTop: verticalScale(8),
  },

  DRC_BottomButtonsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    flexDirection: 'row',
    gap: scale(8),
  },

  DRC_ExpandToggle: {
    alignItems: 'center',
    padding: moderateScale(4),
    backgroundColor: '#0A66C2',
    borderRadius: moderateScale(15),
    alignSelf: 'center',
    minWidth: moderateScale(30),
    minHeight: moderateScale(30),
    justifyContent: 'center',
  },

  // Navigation arrow styles
  DRC_NavigationArrow: {
    position: 'absolute',
    right: scale(12),
    top: '50%',
    transform: [{translateY: -12}],
    width: scale(24),
    height: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  DRC_ClickableContainer: {
    position: 'relative',
  },

  DRC_HeaderContentWithArrow: {
    flex: 1,
    marginRight: scale(40),
  },

  DRC_ButtonsContainerWithArrow: {
    marginRight: scale(30),
  },

  DRC_ValueWithArrow: {
    marginRight: scale(30),
  },

  DRC_BottomButtonsContainerWithArrow: {
    right: scale(30),
  },

  // ============================================
  // NOTIFICATION PANEL - RESPONSIVE STYLES
  // ============================================
  notif_Overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  notif_OverlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  notif_Panel: {
    width: conditionalScale(300, 350, 400),
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: scale(-4), height: 0},
    shadowOpacity: 0.1,
    shadowRadius: scale(12),
    elevation: 20,
  },
  notif_Header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    backgroundColor: '#0A66C2',
    borderBottomWidth: 1,
    borderBottomColor: '#0c5298',
  },
  notif_HeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  notif_BellIcon: {
    fontSize: fontScale(24),
    color: '#ffffff',
  },
  notif_HeaderTitle: {
    fontSize: fontScale(18),
    fontWeight: '700',
    color: '#ffffff',
  },
  notif_HeaderCount: {
    fontSize: fontScale(12),
    color: '#e2e8f0',
    marginTop: verticalScale(2),
  },
  notif_HeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  notif_MarkAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(16),
    gap: scale(6),
    marginRight: scale(45),
  },
  notif_MarkAllButtonDisabled: {
    opacity: 0.5,
  },
  notif_MarkAllIcon: {
    fontSize: fontScale(14),
    color: '#ffffff',
  },
  notif_MarkAllText: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: '#ffffff',
  },
  notif_RefreshButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  notif_RefreshIcon: {
    fontSize: fontScale(20),
    color: '#ffffff',
  },
  notif_ScrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  notif_SectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  notif_SectionTitle: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#475569',
  },
  notif_CountBadge: {
    backgroundColor: '#e2e8f0',
    borderRadius: scale(12),
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(2),
    minWidth: scale(24),
  },
  notif_CountText: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  notif_NotificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  notif_NotificationItemToday: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 2,
    borderLeftColor: '#0A66C2',
  },
  notif_NotificationItemRead: {
    backgroundColor: '#fafafa',
    opacity: 0.8,
  },
  notif_LogoContainer: {
    position: 'relative',
    marginRight: scale(12),
  },
  notif_IconContainer: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notif_NotificationIcon: {
    fontSize: fontScale(20),
    color: '#0A66C2',
  },
  notif_NotificationIconToday: {
    color: '#0369a1',
  },
  notif_MarkReadButtonContainer: {
    position: 'absolute',
    bottom: verticalScale(-4),
    right: scale(-4),
    zIndex: 1,
  },
  notif_MarkReadButton: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(11),
    backgroundColor: '#0A66C2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  notif_MarkReadButtonToday: {
    backgroundColor: '#0A66C2',
  },
  notif_MarkReadButtonRead: {
    backgroundColor: '#94a3b8',
  },
  notif_MarkReadButtonDisabled: {
    opacity: 0.5,
  },
  notif_MarkReadIcon: {
    fontSize: fontScale(4),
    color: '#ffffff',
  },
  notif_MarkReadIconToday: {
    color: '#ffffff',
  },
  notif_MarkReadIconRead: {
    color: '#ffffff',
  },
  notif_ContentContainer: {
    flex: 1,
  },
  notif_NotificationTitle: {
    fontSize: fontScale(15),
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: verticalScale(4),
  },
  notif_NotificationTitleToday: {
    color: '#0A66C2',
  },
  notif_NotificationMessage: {
    fontSize: fontScale(14),
    color: '#64748b',
    lineHeight: fontScale(20),
    marginBottom: verticalScale(4),
  },
  notif_NotificationMessageToday: {
    color: '#475569',
  },
  notif_NotificationTime: {
    fontSize: fontScale(12),
    color: '#94a3b8',
  },
  notif_NotificationTimeToday: {
    color: '#0A66C2',
  },
  notif_EmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(80),
  },
  notif_EmptyIcon: {
    fontSize: fontScale(56),
    color: '#cbd5e1',
    marginBottom: verticalScale(16),
  },
  notif_EmptyText: {
    fontSize: fontScale(16),
    color: '#64748b',
  },
  notif_CloseButton: {
    position: 'absolute',
    top: verticalScale(16),
    right: scale(20),
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notif_CloseIcon: {
    fontSize: fontScale(16),
    color: '#64748b',
  },

  // ============================================
  // ??? - RESPONSIVE STYLES
  // ============================================

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
    marginTop: height * 0.025,
    width: '100%',
    overflow: 'hidden', // Important for rounded corners with gradient
  },
  SSlip_ButtonContent: {
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.05,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  SSlip_ButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  // SSlip_Button: {
  //   borderRadius: 8,
  //   paddingVertical: height * 0.015,
  //   paddingHorizontal: width * 0.05,
  //   elevation: 4,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   marginTop: height * 0.025,
  //   width: '100%',
  // },
  // SSlip_ButtonContent: {
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  // SSlip_ButtonText: {
  //   color: '#FFFFFF',
  //   fontSize: width * 0.045,
  //   fontWeight: 'bold',
  // },
  // End oF Salary Slip

  // // Start of Leave Request Save Record
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
    // flexDirection: isRTL ? 'row-reverse' : 'row',
    flexDirection: 'row',
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
  // LReqSR_SafeArea: {
  //   flex: 1,
  //   backgroundColor: '#fefefe',
  // },
  // LReqSR_ContentWrapper: {
  //   flex: 1,
  //   justifyContent: 'space-between',
  //   paddingHorizontal: width * 0.04, // responsive padding
  //   paddingTop: height * 0.015,
  // },
  // LReqSR_FormContainer: {
  //   padding: width * 0.01,
  //   paddingBottom: height * 0.02, // spacing relative to screen
  // },
  // LReqSR_Label: {
  //   fontSize: width * 0.038, // scales with width
  //   marginTop: height * 0.015,
  //   fontWeight: '600',
  //   color: '#444',
  // },
  // LReqSR_Input: {
  //   borderWidth: 1,
  //   borderColor: '#ddd',
  //   borderRadius: width * 0.02,
  //   padding: width * 0.025,
  //   marginTop: height * 0.007,
  //   fontSize: width * 0.04,
  //   color: '#333',
  //   backgroundColor: '#fff',
  // },
  // LReqSR_DropdownPlaceholder: {
  //   color: '#444',
  //   fontSize: width * 0.038,
  // },
  // LReqSR_DropdownSelectedText: {
  //   color: '#444',
  //   fontWeight: '400',
  //   fontSize: width * 0.038,
  // },
  // LReqSR_DropdownItemText: {
  //   color: '#444',
  //   fontSize: width * 0.038,
  // },
  // LReqSR_DropdownContainer: {
  //   borderWidth: 1.5,
  //   borderColor: '#4A90E2',
  //   borderRadius: width * 0.025,
  //   backgroundColor: '#fff',
  //   shadowColor: '#000',
  //   shadowOffset: {width: 0, height: 2},
  //   shadowOpacity: 0.25,
  //   shadowRadius: 6,
  //   elevation: 6,
  // },
  // LReqSR_DropdownItemContainer: {
  //   paddingHorizontal: width * 0.03,
  // },
  // LReqSR_DropdownSearchInput: {
  //   color: '#444',
  //   backgroundColor: '#fff',
  //   fontSize: width * 0.038,
  // },
  // LReqSR_DropdownIcon: {
  //   width: width * 0.055,
  //   height: width * 0.055,
  // },
  // LReqSR_Disabled: {
  //   backgroundColor: '#f1f1f1',
  //   color: '#999',
  // },
  // LReqSR_TextArea: {
  //   height: height * 0.15,
  //   textAlignVertical: 'top',
  //   fontSize: width * 0.04,
  // },
  LReqSR_CharCount: {
    fontSize: width * 0.034,
    color: '#333',
  },
  // LReqSR_DateSelector: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   borderWidth: 1,
  //   borderColor: '#ddd',
  //   borderRadius: width * 0.02,
  //   padding: width * 0.025,
  //   marginTop: height * 0.007,
  // },
  // LReqSR_DateText: {
  //   fontSize: width * 0.04,
  //   color: '#333',
  // },
  formHeader: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0A66C2',
    borderRadius: 8,
  },
  formHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A66C2',
    marginBottom: 4,
  },
  formHeaderSubtext: {
    fontSize: 14,
    color: '#666',
  },

  // // End oF Leave Req Save Record here???

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
  // LReqLP_ListContainer: {
  //   paddingBottom: height * 0.05,
  //   paddingHorizontal: width * 0.03,
  //   paddingTop: height * 0.01,
  // },
  // LReqLP_NoDataText: {
  //   flex: 1,
  //   textAlign: 'center',
  //   textAlignVertical: 'center',
  //   fontSize: width * 0.04,
  //   fontWeight: 'bold',
  //   color: '#999999',
  // },
  // End Of Leave Req List Page

  // Start Of Display Personal Info
  DPI_Container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
    marginTop: height * 0.025,
    width: '100%',
    overflow: 'hidden', // Important for rounded corners with gradient
    elevation: 4, // Keep elevation here for shadow
  },
  TCert_ButtonContent: {
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.05,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  TCert_ButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Add to your styles.js file
  TCert_Dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: height * 0.02,
    width: '100%',
    backgroundColor: '#fff',
  },
  TCert_ItemText: {
    fontSize: width * 0.04,
    color: '#333',
  },
  TCert_DropdownPlaceholder: {
    fontSize: width * 0.04,
    color: '#999',
  },
  TCert_DropdownSelected: {
    fontSize: width * 0.04,
    color: '#333',
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
    fontSize: height * 0.02, // hp(4)
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
    // marginBottom: 20,
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

  PPEdit_initialsContainer: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  PPEdit_initialsText: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#374151',
  },

  PPEdit_initialsTextModal: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#374151',
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

  // Start of worker assigned to me component
  // orgStyles_rootContainer: {
  //   alignItems: 'center',
  //   paddingHorizontal: 16,
  // },
  orgStyles_rootCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#0A66C2',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 200,
  },
  orgStyles_rootAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#0A66C2',
    alignSelf: 'center',
    marginBottom: 8,
  },
  // orgStyles_rootName: {
  //   fontSize: 18,
  //   fontWeight: '700',
  //   color: '#111827',
  //   textAlign: 'center',
  // },
  // orgStyles_rootRole: {
  //   fontSize: 14,
  //   color: '#0A66C2',
  //   textAlign: 'center',
  //   marginTop: 4,
  //   fontWeight: '600',
  // },
  orgStyles_connectorFromRoot: {
    width: 2,
    height: 40,
    backgroundColor: '#0A66C2',
    alignSelf: 'center',
  },
  orgStyles_departmentHeader: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#0A66C2',
  },
  orgStyles_departmentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orgStyles_departmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  orgStyles_departmentCount: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  orgStyles_employeeContainer: {
    marginHorizontal: 18,
    marginVertical: 4,
  },
  orgStyles_employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginLeft: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orgStyles_employeeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  orgStyles_employeeInfo: {
    flex: 1,
  },
  orgStyles_employeeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  orgStyles_employeeRole: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  orgStyles_hierarchyConnector: {
    position: 'absolute',
    left: 10,
    top: -12,
    width: 15,
    height: 50,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#0A66C2',
  },
  orgStyles_verticalLine: {
    position: 'absolute',
    left: 20,
    top: 0,
    bottom: 38,
    width: 1.5,
    backgroundColor: '#0A66C2',
  },
  orgStyles_horizontalConnector: {
    position: 'absolute',
    left: 2,
    top: '50%',
    width: 20,
    height: 1.5,
    backgroundColor: '#0A66C2',
  },
  orgStyles_scrollContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 16,
  },
  orgStyles_contentWrapper: {
    paddingBottom: 40,
  },
  orgStyles_noDataText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  eorgStyles_xpandButton: {
    padding: 4,
  },
  orgStyles_backButton: {
    color: '#0A66C2',
    textAlign: 'center',
    marginVertical: 8,
    fontWeight: '600',
  },
  orgStyles_rootContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  orgStyles_rootCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#0A66C2',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 370,
  },
  orgStyles_rootAvatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#0A66C2',
    marginRight: 16,
  },
  orgStyles_rootInfo: {
    flex: 1,
    flexDirection: 'column',
  },
  orgStyles_rootInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  orgStyles_rootName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginRight: 12,
    flexShrink: 1,
  },
  orgStyles_rootRole: {
    fontSize: 14,
    color: '#0A66C2',
    fontWeight: '600',
    flexShrink: 1,
  },
  orgStyles_rootMeta: {
    fontSize: 13,
    color: '#374151',
    marginRight: 12,
    flexShrink: 1,
  },
  // end of worker assigned to me card

  // Tab Bar styles - More responsive
  TNav_TabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#0A66C2',
    height: Math.max(height * 0.08, 60), // Minimum 60px, responsive to screen
    borderTopColor: '#ccc',
    borderColor: '#0A66C2',
    borderTopWidth: 3,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingBottom: 4, // Add padding for better touch targets
  },

  APCont_customTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8, // Increased for better touch area
    minHeight: 48, // Minimum touch target size
  },

  TNav_TabLabel: {
    fontSize: Math.max(width * 0.025, 11), // Responsive font size
    fontWeight: '600',
    marginTop: 2,
    color: 'white',
    textAlign: 'center',
  },

  // Floating button styles - More responsive positioning
  APCont_container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  APCont_content: {
    flex: 1,
  },
  APCont_floatingPlusButtonContainer: {
    position: 'absolute',
    bottom: Math.max(height * 0.1, 70), // Responsive positioning above tab bar
    right: width * 0.05, // 5% from right edge
    zIndex: 1000,
  },

  APCont_floatingPlusButton: {
    width: Math.max(width * 0.15, 56), // Responsive size with minimum
    height: Math.max(width * 0.15, 56),
    borderRadius: Math.max(width * 0.075, 28),
    backgroundColor: '#0A66C2',
    borderWidth: 4,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },

  APCont_plusIcon: {
    fontSize: Math.max(width * 0.06, 20),
    color: '#ffffff',
  },
  // End of ActionPaneContainer

  // Start of RequestTypeSelectionModal
  RTSModal_ModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  RTSModal_ModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  RTSModal_ModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  RTSModal_ModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  RTSModal_CloseButton: {
    padding: 4,
  },
  RTSModal_OptionsContainer: {
    marginBottom: 10,
  },
  RTSModal_OptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  RTSModal_IconContainer: {
    marginRight: 16,
    width: 40,
    alignItems: 'center',
  },
  RTSModal_TextContainer: {
    flex: 1,
  },
  RTSModal_OptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  RTSModal_OptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  RTSModal_ArrowContainer: {
    marginLeft: 8,
  },
  RTSModal_CancelButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  RTSModal_CancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  // End of RequestTypeSelectionModal

  // Start of EntitlementCards
  EntCards_CardContainer: {
    marginVertical: 10,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  EntCards_Card: {
    borderRadius: 16,
    padding: 16,
  },
  EntCards_CardHeader: {
    borderBottomWidth: 2,
    borderBottomColor: '#ffffffff',
    paddingBottom: 8,
    marginBottom: 12,
  },
  EntCards_CardHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#004aad',
    textAlign: 'center',
  },
  EntCards_CardContent: {
    flexDirection: 'column',
    gap: 8,
  },
  EntCards_TextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  EntCards_CardTextHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  EntCards_CardText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111',
  },
  // End of EntitlementCards

  // Start of DrawerNavigator
  // DNav_DrawerItem: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   paddingVertical: 12,
  //   paddingHorizontal: 20,
  // },
  // DNav_DrawerIcon: {
  //   width: 20,
  //   height: 20,
  //   marginRight: 12,
  //   resizeMode: 'contain',
  // },
  // DNav_ActiveDrawerItem: {
  //   backgroundColor: '#E0E7FF',
  // },
  // DNav_DrawerItemText: {
  //   fontSize: 15,
  //   color: '#374151',
  // },
  // DNav_ActiveDrawerItemText: {
  //   color: '#2563EB',
  //   fontWeight: '600',
  // },
  // DNav_HeaderBackground: {
  //   width: '100%',
  //   height: 150,
  //   justifyContent: 'flex-end',
  // },
  // DNav_MaisonLogo: {
  //   position: 'absolute',
  //   top: 16,
  //   right: 16,
  //   width: 100,
  //   height: 40,
  // },
  // DNav_EmpInfoContainer: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   marginVertical: 16,
  //   marginLeft: 8,
  // },
  // DNav_AvatarContainer: {
  //   position: 'relative',
  //   marginRight: 12,
  // },
  // DNav_Avatar: {
  //   width: 70,
  //   height: 70,
  //   borderRadius: 35,
  //   backgroundColor: 'rgba(255,255,255,0.20)',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   borderWidth: 1,
  //   borderColor: 'rgba(255,255,255,0.5)',
  // },
  // DNav_AvatarText: {
  //   color: '#FFFFFF',
  //   fontSize: 18,
  //   fontWeight: '600',
  // },
  // DNav_OnlineIndicator: {
  //   position: 'absolute',
  //   bottom: 0,
  //   right: 0,
  //   width: 14,
  //   height: 14,
  //   borderRadius: 7,
  //   backgroundColor: '#10B981',
  //   borderWidth: 2,
  //   borderColor: '#FFFFFF',
  // },
  // DNav_UserInfo: {
  //   flex: 1,
  // },
  // DNav_UserName: {
  //   color: '#FFFFFF',
  //   fontSize: 16,
  //   fontWeight: '600',
  // },
  // DNav_UserEmail: {
  //   color: 'rgba(255,255,255,0.9)',
  //   fontSize: 10,
  // },
  // DNav_ProfilePicture: {
  //   width: 70,
  //   height: 70,
  //   borderRadius: 35,
  // },
  // DNav_LogoutButton: {
  //   flexDirection: 'row',
  //   alignItems: 'stretch',
  //   marginHorizontal: 16,
  //   marginVertical: 16,
  //   borderRadius: 8,
  //   overflow: 'hidden',
  //   shadowColor: '#000',
  //   shadowOffset: {width: 0, height: 2},
  //   shadowOpacity: 0.15,
  //   shadowRadius: 4,
  //   elevation: 4,
  // },
  // DNav_LogoutIconSection: {
  //   backgroundColor: '#2196F3',
  //   paddingHorizontal: 16,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   borderTopLeftRadius: 8,
  //   borderBottomLeftRadius: 8,
  // },
  // DNav_LogoutTextSection: {
  //   backgroundColor: '#1976D2',
  //   paddingVertical: 12,
  //   paddingHorizontal: 24,
  //   justifyContent: 'center',
  //   flex: 1,
  // },
  // DNav_LogoutText: {
  //   color: '#FFFFFF',
  //   fontSize: 14,
  //   fontWeight: '700',
  //   letterSpacing: 0.5,
  // },
  DNav_DrawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: height * 0.015, // Responsive vertical padding
    paddingHorizontal: width * 0.05, // Responsive horizontal padding
    minHeight: 48, // Minimum touch target
  },

  DNav_DrawerIcon: {
    width: Math.max(width * 0.05, 20), // Responsive icon size
    height: Math.max(width * 0.05, 20),
    marginRight: width * 0.03,
    resizeMode: 'contain',
  },

  DNav_ActiveDrawerItem: {
    backgroundColor: '#E0E7FF',
    marginHorizontal: width * 0.02,
    borderRadius: 8,
  },

  DNav_DrawerItemText: {
    fontSize: Math.max(width * 0.035, 14), // Responsive font size
    color: '#374151',
  },

  DNav_ActiveDrawerItemText: {
    color: '#2563EB',
    fontWeight: '600',
  },

  DNav_HeaderBackground: {
    width: '100%',
    height: Math.max(height * 0.2, 140), // Responsive header height
    justifyContent: 'flex-end',
  },

  DNav_MaisonLogo: {
    position: 'absolute',
    top: height * 0.02,
    right: width * 0.04,
    width: Math.max(width * 0.25, 80),
    height: Math.max(height * 0.05, 30),
  },

  DNav_EmpInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: height * 0.02,
    marginLeft: width * 0.02,
  },

  DNav_AvatarContainer: {
    position: 'relative',
    marginRight: width * 0.03,
  },

  DNav_Avatar: {
    width: Math.max(width * 0.16, 60), // Responsive avatar size
    height: Math.max(width * 0.16, 60),
    borderRadius: Math.max(width * 0.08, 30),
    backgroundColor: 'rgba(255,255,255,0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },

  DNav_AvatarText: {
    color: '#FFFFFF',
    fontSize: Math.max(width * 0.04, 16),
    fontWeight: '600',
  },

  DNav_OnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: Math.max(width * 0.035, 12),
    height: Math.max(width * 0.035, 12),
    borderRadius: Math.max(width * 0.0175, 6),
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  DNav_UserInfo: {
    flex: 1,
    marginRight: width * 0.02,
  },

  DNav_UserName: {
    color: '#FFFFFF',
    fontSize: Math.max(width * 0.04, 15),
    fontWeight: '600',
  },

  DNav_UserEmail: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: Math.max(width * 0.025, 10),
    marginTop: 2,
  },

  DNav_ProfilePicture: {
    width: Math.max(width * 0.16, 60),
    height: Math.max(width * 0.16, 60),
    borderRadius: Math.max(width * 0.08, 30),
  },

  DNav_LogoutButton: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginHorizontal: width * 0.04,
    marginVertical: height * 0.02,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    minHeight: 48, // Minimum touch target
  },

  DNav_LogoutIconSection: {
    backgroundColor: '#2196F3',
    paddingHorizontal: width * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },

  DNav_LogoutTextSection: {
    backgroundColor: '#1976D2',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.06,
    justifyContent: 'center',
    flex: 1,
  },

  DNav_LogoutText: {
    color: '#FFFFFF',
    fontSize: Math.max(width * 0.035, 13),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // End of DrawerNavigator

  // Start of TabNavigator
  // TNav_TabBarO: {
  //   // backgroundColor: '#ebf5ff',
  //   backgroundColor: '#0A66C2',
  //   height: 60,
  //   borderColor: '#0A66C2',
  //   borderTopWidth: 3,
  // },
  // TNav_TabLabelO: {
  //   fontSize: 11,
  //   fontWeight: '600',
  //   marginBottom: 6,
  //   color: 'white',
  // },
  TNav_TabBarO: {
    backgroundColor: '#0A66C2',
    height: Math.max(height * 0.08, 60),
    borderColor: '#0A66C2',
    borderTopWidth: 3,
    paddingBottom: 4,
  },
  TNav_TabLabelO: {
    fontSize: Math.max(width * 0.025, 11),
    fontWeight: '600',
    marginTop: 2,
    color: 'white',
  },
  // End of TabNavigator

  // Start of EntitlementBalance
  EntBal_NoDataText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#cccccc',
  },
  // End of EntitlementBalance

  //Start of IdentificationRequestCard
  ID_CardContainer: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  ID_CardHighlighted: {
    borderWidth: 1.5,
    borderColor: '#7bd98e',
  },
  ID_Header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ID_HeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ID_ProfileImage: {
    width: 45,
    height: 45,
    borderRadius: 22,
  },
  ID_ProfilePlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ID_HeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ID_HeaderSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  ID_FieldsContainer: {
    marginTop: 4,
  },
  ID_FieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderColor: '#e2e2e2',
  },
  ID_FieldLabel: {
    fontSize: 13,
    color: '#444',
    flex: 1,
  },
  ID_FieldValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#222',
    flex: 1,
    textAlign: 'right',
  },
  ID_ExpandableSection: {
    marginTop: 8,
    borderTopWidth: 0.5,
    borderColor: '#ccc',
    paddingTop: 8,
  },
  ID_Footer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ID_ExpandToggle: {
    padding: 4,
  },
  ID_FooterButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  ID_Button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#0A66C2',
  },
  ID_ButtonDisabled: {
    opacity: 0.6,
  },
  ID_ButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  //End of IdentificationRequestCard
});

export default styles;
