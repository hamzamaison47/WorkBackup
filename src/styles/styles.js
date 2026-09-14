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
  conditionalVerticalScale,
  conditionalFontScale,
  spacing,
  borderRadius,
  iconSize,
} from '../store/utils/scaling';
import {AppTokens} from '../components/AppComponentsDesign/Tokens';
import brand from '../theme/brand';

const {height, width} = Dimensions.get('window');

const PROFILE_IMAGE_SIZE = width * 0.35; // responsive image size
const BORDER_WIDTH = 5;

const styles = StyleSheet.create({
  // ==================================================================================================================
  // APP-WIDE DESIGN TOKENS — shared across all screens
  // Place this block inside StyleSheet.create({...}), right after the BORDER_WIDTH constant block
  // ==================================================================================================================

  APP_card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: conditionalScale(16, 18, 20, 22),
    borderRadius: borderRadius.lg,
    paddingVertical: conditionalVerticalScale(4, 5, 6, 7),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: moderateScale(3),
    shadowOffset: {width: 0, height: moderateScale(1.5)},
    elevation: moderateScale(2),
  },

  APP_cardHeading: {
    fontSize: conditionalFontScale(11, 11.5, 12, 12.5),
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: conditionalVerticalScale(4, 5, 6, 7),
    marginTop: conditionalVerticalScale(10, 12, 14, 16),
    marginHorizontal: conditionalScale(16, 18, 20, 22),
  },

  APP_settingRow: {
    paddingHorizontal: conditionalScale(14, 15, 16, 17),
    paddingVertical: conditionalVerticalScale(12, 13, 14, 15),
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: moderateScale(1),
    borderBottomColor: '#F5F5F5',
  },

  APP_iconBadge: {
    width: conditionalScale(32, 34, 36, 38),
    height: conditionalScale(32, 34, 36, 38),
    borderRadius: conditionalScale(16, 17, 18, 19),
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: conditionalScale(12, 13, 14, 15),
  },

  APP_rowTitle: {
    fontSize: conditionalFontScale(15, 15.5, 16, 16),
    fontWeight: '500',
    color: '#1A1A1A',
    flex: 1,
  },

  APP_rowSubtitle: {
    fontSize: conditionalFontScale(12, 12.5, 13, 13),
    color: '#757575',
    lineHeight: conditionalFontScale(16, 17, 18, 19),
  },

  APP_divider: {
    height: moderateScale(1),
    backgroundColor: '#F5F5F5',
    marginHorizontal: conditionalScale(14, 15, 16, 17),
  },

  APP_sectionLabel: {
    fontSize: conditionalFontScale(11, 11.5, 12, 12.5),
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: conditionalScale(16, 18, 20, 22),
    paddingTop: conditionalVerticalScale(20, 22, 24, 26),
    paddingBottom: conditionalVerticalScale(6, 7, 8, 9),
  },

  APP_emptyText: {
    fontSize: conditionalFontScale(14, 15, 16, 16),
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: conditionalVerticalScale(32, 36, 40, 44),
  },

  // ==================================================================================================================
  // END OF APP-WIDE DESIGN TOKENS
  // ==================================================================================================================
  // ==================================================================================================================
  // START OF SCREEN - RESPONSIVE SCREEN STYLES
  // ==================================================================================================================

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
    width: conditionalScale(180, 200, 220, 280),
    height: conditionalVerticalScale(70, 80, 90, 110),
    marginBottom: conditionalVerticalScale(16, 20, 24, 32),
  },
  splash_Text: {
    fontSize: conditionalFontScale(26, 30, 32, 38),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: conditionalFontScale(32, 36, 40, 46),
  },
  splash_Tagline: {
    fontSize: conditionalFontScale(16, 18, 20, 24),
    color: '#FFFFFF',
    marginTop: conditionalVerticalScale(8, 10, 12, 16),
    fontStyle: 'italic',
    fontWeight: '300',
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: conditionalFontScale(20, 22, 24, 28),
  },
  splash_Loader: {
    marginTop: conditionalVerticalScale(16, 20, 24, 32),
  },
  splash_Circle1: {
    position: 'absolute',
    width: conditionalScale(260, 300, 340, 420),
    height: conditionalScale(260, 300, 340, 420),
    borderRadius: conditionalScale(130, 150, 170, 210),
    backgroundColor: '#FFFFFF',
    top: '-15%',
    right: '-15%',
  },
  splash_Circle2: {
    position: 'absolute',
    width: conditionalScale(170, 200, 230, 300),
    height: conditionalScale(170, 200, 230, 300),
    borderRadius: conditionalScale(85, 100, 115, 150),
    backgroundColor: '#FFFFFF',
    bottom: '-10%',
    left: '-10%',
  },
  splash_Circle3: {
    position: 'absolute',
    width: conditionalScale(130, 150, 170, 220),
    height: conditionalScale(130, 150, 170, 220),
    borderRadius: conditionalScale(65, 75, 85, 110),
    backgroundColor: '#FFFFFF',
    top: '60%',
    right: '20%',
  },

  // ============================================
  // LOGIN SCREEN - RESPONSIVE STYLES
  // ============================================
  Login_Container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  Login_Header: {
    alignItems: 'center',
    marginBottom: conditionalVerticalScale(16, 20, 24, 32),
    width: '100%',
  },

  Login_QRButton: {
    position: 'absolute',
    top:
      Platform.OS === 'ios'
        ? conditionalVerticalScale(45, 50, 55, 60)
        : conditionalVerticalScale(45, 50, 55, 60),
    right: spacing.md,
    width: conditionalScale(46, 50, 54, 64),
    height: conditionalScale(46, 50, 54, 64),
    borderRadius: conditionalScale(23, 25, 27, 32),
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
    bottom: conditionalVerticalScale(90, 95, 100, 100),
    width: conditionalScale(64, 70, 76, 76), // was 90
    height: conditionalScale(64, 70, 76, 76), // was 90
    borderRadius: conditionalScale(32, 35, 38, 38), // was 45
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
    width: conditionalScale(80, 90, 100, 110),
    height: conditionalVerticalScale(40, 45, 50, 60),
    position: 'absolute', // 👈 ADD THIS
    bottom: 20, // 👈 Move to bottom
    alignSelf: 'center', // 👈 Keep centered horizontally
    resizeMode: 'contain',
  },

  Login_Title: {
    fontSize: conditionalFontScale(22, 24, 26, 26),
    fontWeight: 'bold',
    marginBottom: conditionalVerticalScale(6, 8, 10, 12),
    color: '#333333',
    textAlign: 'center',
    lineHeight: conditionalFontScale(28, 30, 34, 40),
  },

  Login_Subtitle: {
    fontSize: conditionalFontScale(13, 14, 15, 15),
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: conditionalFontScale(18, 20, 22, 26),
    maxWidth: conditionalScale(280, 300, 320, 400),
  },

  Login_ButtonsContainer: {
    width: '100%',
    alignItems: 'center',
  },

  Login_Button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: isTablet ? '70%' : '85%',
    maxWidth: conditionalScale(300, 320, 340, 340),
    height: conditionalVerticalScale(48, 52, 56, 64),
    borderRadius: borderRadius.xxl,
    borderWidth: moderateScale(2),
    borderColor: '#0A66C2',
    marginVertical: conditionalVerticalScale(6, 8, 10, 12),
    paddingHorizontal: spacing.md,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  Login_ButtonText: {
    color: '#0A66C2',
    fontSize: conditionalFontScale(14, 15, 16, 19),
    fontWeight: '600',
  },

  Login_Icon: {
    width: iconSize.sm,
    height: iconSize.sm,
    resizeMode: 'contain',
    marginRight: 8,
  },

  Login_LoadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },

  Login_LoadingText: {
    marginTop: conditionalVerticalScale(12, 16, 18, 24),
    fontSize: conditionalFontScale(14, 15, 16, 19),
    color: '#333',
    textAlign: 'center',
    lineHeight: conditionalFontScale(18, 20, 22, 26),
    paddingHorizontal: spacing.md,
  },

  Login_DialogContainer: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  Login_DialogTitle: {
    fontSize: conditionalFontScale(17, 18, 19, 22),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: conditionalVerticalScale(10, 12, 14, 16),
  },

  Login_DialogMessage: {
    fontSize: conditionalFontScale(13, 14, 15, 18),
    color: '#666',
    textAlign: 'center',
    marginBottom: conditionalVerticalScale(16, 20, 24, 28),
    paddingHorizontal: spacing.sm,
    lineHeight: conditionalFontScale(18, 20, 22, 26),
  },

  Login_DialogButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: spacing.sm,
  },

  Login_DialogButton: {
    flex: 1,
    borderRadius: borderRadius.md,
    paddingVertical: conditionalVerticalScale(10, 12, 14, 16),
    alignItems: 'center',
    minHeight: conditionalVerticalScale(40, 44, 48, 52),
  },

  Login_DialogButtonText: {
    color: '#fff',
    fontSize: conditionalFontScale(13, 14, 15, 17),
    fontWeight: '600',
  },

  Login_Divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: conditionalVerticalScale(16, 20, 24, 32),
    width: '100%',
    maxWidth: conditionalScale(280, 300, 320, 400),
  },

  Login_DividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },

  Login_DividerText: {
    marginHorizontal: spacing.md,
    fontSize: conditionalFontScale(12, 13, 14, 16),
    color: '#6B7280',
    fontWeight: '600',
  },

  Login_AttendanceButton: {
    position: 'absolute',
    top: 50, // match Login_QRButton top value
    left: 20, // left side instead of right
    padding: 8,
    zIndex: 10,
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
    paddingHorizontal: spacing.md,
    paddingVertical: conditionalVerticalScale(14, 16, 18, 20),
    paddingTop: conditionalVerticalScale(18, 20, 22, 24),
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
    width: conditionalScale(40, 44, 48, 52),
    height: conditionalScale(40, 44, 48, 52),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: conditionalScale(20, 22, 24, 26),
    backgroundColor: '#f0f8ff',
  },

  ConfigSelection_HeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },

  ConfigSelection_HeaderTitle: {
    fontSize: conditionalFontScale(18, 20, 22, 26),
    fontWeight: '700',
    color: '#1a1a1a',
  },

  ConfigSelection_HeaderSubtitle: {
    fontSize: conditionalFontScale(11, 12, 13, 15),
    color: '#666',
    marginTop: conditionalVerticalScale(1, 2, 2, 3),
  },

  ConfigSelection_ListContainer: {
    padding: spacing.md,
    paddingBottom: conditionalVerticalScale(28, 32, 36, 42),
  },

  ConfigSelection_ConfigCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: '#e8eaed',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: conditionalVerticalScale(12, 16, 18, 20),
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
    paddingHorizontal: conditionalScale(8, 10, 11, 13),
    paddingVertical: conditionalVerticalScale(3, 4, 5, 6),
    borderRadius: moderateScale(12),
    gap: conditionalScale(3, 4, 5, 6),
  },

  ConfigSelection_ActiveBadgeText: {
    color: '#fff',
    fontSize: conditionalFontScale(9, 10, 11, 12),
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  ConfigSelection_CardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: conditionalVerticalScale(12, 16, 18, 20),
  },

  ConfigSelection_CardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  ConfigSelection_IconContainer: {
    width: conditionalScale(40, 44, 48, 54),
    height: conditionalScale(40, 44, 48, 54),
    borderRadius: moderateScale(12),
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },

  ConfigSelection_ActiveIconContainer: {
    backgroundColor: '#0A66C2',
  },

  ConfigSelection_ConfigTitle: {
    fontSize: conditionalFontScale(16, 18, 19, 22),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: conditionalVerticalScale(3, 4, 5, 6),
  },

  ConfigSelection_ConfigSubtitle: {
    fontSize: conditionalFontScale(11, 12, 13, 15),
    color: '#666',
  },

  ConfigSelection_CardActions: {
    marginTop: conditionalVerticalScale(28, 32, 36, 40),
    flexDirection: 'row',
    gap: spacing.sm,
  },

  ConfigSelection_ActionButton: {
    width: conditionalScale(32, 36, 40, 44),
    height: conditionalScale(32, 36, 40, 44),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(8),
    backgroundColor: '#f5f7fa',
  },

  ConfigSelection_CardDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    gap: conditionalVerticalScale(8, 10, 11, 13),
  },

  ConfigSelection_DetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ConfigSelection_DetailIcon: {
    marginRight: spacing.sm,
    width: conditionalScale(14, 16, 17, 19),
  },

  ConfigSelection_DetailLabel: {
    fontSize: conditionalFontScale(11, 12, 13, 14),
    color: '#666',
    fontWeight: '600',
    width: conditionalScale(80, 90, 95, 105),
  },

  ConfigSelection_DetailValue: {
    fontSize: conditionalFontScale(11, 12, 13, 14),
    color: '#1a1a1a',
    flex: 1,
    fontWeight: '500',
  },

  ConfigSelection_EmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: conditionalScale(35, 40, 45, 55),
  },

  ConfigSelection_EmptyIconContainer: {
    width: conditionalScale(100, 120, 130, 150),
    height: conditionalScale(100, 120, 130, 150),
    borderRadius: conditionalScale(50, 60, 65, 75),
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: conditionalVerticalScale(20, 24, 28, 32),
  },

  ConfigSelection_EmptyStateTitle: {
    fontSize: conditionalFontScale(22, 24, 26, 30),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: conditionalVerticalScale(10, 12, 14, 16),
  },

  ConfigSelection_EmptyStateSubtitle: {
    fontSize: conditionalFontScale(14, 15, 16, 18),
    color: '#666',
    textAlign: 'center',
    lineHeight: conditionalFontScale(20, 22, 24, 27),
    marginBottom: conditionalVerticalScale(28, 32, 36, 40),
    paddingHorizontal: spacing.md,
  },

  ConfigSelection_PrimaryButton: {
    backgroundColor: '#0A66C2',
    paddingHorizontal: conditionalScale(24, 28, 32, 36),
    paddingVertical: conditionalVerticalScale(12, 14, 16, 18),
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
    marginRight: spacing.sm,
  },

  ConfigSelection_PrimaryButtonText: {
    color: '#fff',
    fontSize: conditionalFontScale(15, 16, 17, 19),
    fontWeight: '700',
  },

  // Modal Styles
  ConfigSelection_ModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },

  ConfigSelection_ModalContent: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: conditionalScale(360, 400, 420, 500),
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
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },

  ConfigSelection_ModalTitle: {
    fontSize: conditionalFontScale(18, 20, 21, 24),
    fontWeight: '700',
    color: '#1a1a1a',
  },

  ConfigSelection_ModalCloseButton: {
    width: conditionalScale(28, 32, 34, 38),
    height: conditionalScale(28, 32, 34, 38),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: conditionalScale(14, 16, 17, 19),
    backgroundColor: '#f5f7fa',
  },

  ConfigSelection_ModalBody: {
    padding: spacing.md,
  },

  ConfigSelection_InputLabel: {
    fontSize: conditionalFontScale(13, 14, 15, 17),
    fontWeight: '600',
    color: '#333',
    marginBottom: conditionalVerticalScale(6, 8, 9, 10),
  },

  ConfigSelection_Input: {
    borderWidth: 2,
    borderColor: '#e8eaed',
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    fontSize: conditionalFontScale(15, 16, 17, 19),
    color: '#1a1a1a',
    backgroundColor: '#f8f9fa',
  },

  ConfigSelection_ModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#e8eaed',
  },

  ConfigSelection_SecondaryButton: {
    paddingHorizontal: conditionalScale(18, 20, 22, 26),
    paddingVertical: conditionalVerticalScale(10, 12, 13, 15),
    borderRadius: moderateScale(10),
    backgroundColor: '#f5f7fa',
  },

  ConfigSelection_SecondaryButtonText: {
    color: '#666',
    fontSize: conditionalFontScale(14, 15, 16, 18),
    fontWeight: '600',
  },

  ConfigSelection_PrimaryButtonModal: {
    backgroundColor: '#0A66C2',
    paddingHorizontal: conditionalScale(18, 20, 22, 26),
    paddingVertical: conditionalVerticalScale(10, 12, 13, 15),
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
    paddingTop:
      Platform.OS === 'ios'
        ? conditionalVerticalScale(55, 60, 65, 70)
        : conditionalVerticalScale(35, 40, 45, 50),
    paddingBottom: conditionalVerticalScale(20, 24, 26, 30),
    paddingHorizontal: spacing.md,
    backgroundColor: '#fff',
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  QRSetup_BackButton: {
    position: 'absolute',
    left: spacing.md,
    top:
      Platform.OS === 'ios'
        ? conditionalVerticalScale(55, 60, 65, 70)
        : conditionalVerticalScale(35, 40, 45, 50),
    width: conditionalScale(40, 44, 48, 52),
    height: conditionalScale(40, 44, 48, 52),
    borderRadius: conditionalScale(20, 22, 24, 26),
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  QRSetup_HeaderContent: {
    alignItems: 'center',
  },

  QRSetup_IconBackground: {
    width: conditionalScale(70, 80, 85, 100),
    height: conditionalScale(70, 80, 85, 100),
    borderRadius: borderRadius.xl,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0A66C2',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: conditionalVerticalScale(12, 16, 18, 20),
  },

  QRSetup_Title: {
    fontSize: conditionalFontScale(22, 24, 26, 30),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: conditionalVerticalScale(6, 8, 9, 11),
    textAlign: 'center',
  },

  QRSetup_Subtitle: {
    fontSize: conditionalFontScale(13, 14, 15, 17),
    color: '#666',
    textAlign: 'center',
    lineHeight: conditionalFontScale(18, 20, 22, 25),
    maxWidth: isTablet ? '70%' : '85%',
  },

  QRSetup_ScannerWrapper: {
    flex: 1,
    padding: spacing.md,
  },

  QRSetup_ScannerContainer: {
    flex: 1,
    borderRadius: borderRadius.xl,
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
    height: conditionalVerticalScale(220, 250, 270, 320),
  },

  QRSetup_ScannerFrame: {
    width: conditionalScale(220, 250, 270, 320),
    height: conditionalVerticalScale(220, 250, 270, 320),
    position: 'relative',
    alignSelf: 'center',
    overflow: 'hidden',
  },

  QRSetup_Corner: {
    position: 'absolute',
    width: conditionalScale(22, 25, 27, 32),
    height: conditionalScale(22, 25, 27, 32),
    borderColor: '#0A66C2',
  },

  QRSetup_TopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: moderateScale(3),
    borderLeftWidth: moderateScale(3),
    borderTopLeftRadius: moderateScale(6),
  },

  QRSetup_TopRight: {
    top: 0,
    right: 0,
    borderTopWidth: moderateScale(3),
    borderRightWidth: moderateScale(3),
    borderTopRightRadius: moderateScale(6),
  },

  QRSetup_BottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: moderateScale(3),
    borderLeftWidth: moderateScale(3),
    borderBottomLeftRadius: moderateScale(6),
  },

  QRSetup_BottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: moderateScale(3),
    borderRightWidth: moderateScale(3),
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
    bottom: conditionalVerticalScale(8, 10, 12, 15),
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
  },

  QRSetup_InstructionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: conditionalVerticalScale(10, 12, 13, 15),
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
    fontSize: conditionalFontScale(13, 14, 15, 17),
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: spacing.sm,
  },

  QRSetup_ProcessingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },

  QRSetup_ProcessingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: conditionalScale(20, 24, 26, 30),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: conditionalScale(220, 250, 270, 320),
    margin: spacing.md,
  },

  QRSetup_ProcessingText: {
    fontSize: conditionalFontScale(15, 16, 17, 20),
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: conditionalVerticalScale(12, 16, 18, 20),
    marginBottom: conditionalVerticalScale(6, 8, 9, 10),
    textAlign: 'center',
  },

  QRSetup_ProcessingSubtext: {
    fontSize: conditionalFontScale(12, 13, 14, 16),
    color: '#666',
    textAlign: 'center',
    lineHeight: conditionalFontScale(16, 18, 20, 22),
  },

  QRSetup_PermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },

  QRSetup_PermissionCard: {
    backgroundColor: '#fff',
    padding: conditionalScale(20, 24, 26, 30),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    maxWidth: conditionalScale(270, 300, 320, 380),
    margin: spacing.md,
  },

  QRSetup_PermissionIcon: {
    width: conditionalScale(70, 80, 85, 100),
    height: conditionalScale(70, 80, 85, 100),
    borderRadius: conditionalScale(35, 40, 42, 50),
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: conditionalVerticalScale(12, 16, 18, 20),
  },

  QRSetup_PermissionTitle: {
    fontSize: conditionalFontScale(17, 18, 19, 22),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: conditionalVerticalScale(6, 8, 9, 10),
    textAlign: 'center',
  },

  QRSetup_PermissionText: {
    fontSize: conditionalFontScale(13, 14, 15, 17),
    color: '#666',
    textAlign: 'center',
    lineHeight: conditionalFontScale(18, 20, 22, 25),
  },

  QRSetup_Footer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  QRSetup_FooterContent: {
    padding: spacing.md,
    paddingBottom:
      Platform.OS === 'ios'
        ? conditionalVerticalScale(26, 30, 33, 38)
        : conditionalVerticalScale(16, 20, 22, 26),
  },

  QRSetup_GalleryButton: {
    backgroundColor: '#0A66C2',
    paddingVertical: conditionalVerticalScale(12, 14, 15, 17),
    paddingHorizontal: spacing.md,
    borderRadius: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: conditionalVerticalScale(10, 12, 13, 15),
    shadowColor: '#0A66C2',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  QRSetup_GalleryButtonText: {
    color: '#fff',
    fontSize: conditionalFontScale(14, 15, 16, 18),
    fontWeight: '700',
  },

  QRSetup_SkipButton: {
    backgroundColor: '#f0f8ff',
    paddingVertical: conditionalVerticalScale(12, 14, 15, 17),
    paddingHorizontal: spacing.md,
    borderRadius: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0A66C2',
    marginBottom: conditionalVerticalScale(12, 16, 18, 20),
  },

  QRSetup_ButtonIcon: {
    marginRight: spacing.sm,
  },

  QRSetup_SkipButtonText: {
    color: '#0A66C2',
    fontSize: conditionalFontScale(14, 15, 16, 18),
    fontWeight: '700',
  },

  QRSetup_HelpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },

  QRSetup_HelpText: {
    fontSize: conditionalFontScale(11, 12, 13, 15),
    color: '#999',
    textAlign: 'center',
    lineHeight: conditionalFontScale(15, 16, 18, 20),
  },

  // Modal Styles
  QRSetup_ModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },

  QRSetup_ModalContainer: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    padding: conditionalScale(20, 24, 26, 30),
    width: '100%',
    maxWidth: conditionalScale(310, 340, 360, 420),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  QRSetup_ModalIconContainer: {
    width: conditionalScale(62, 70, 75, 85),
    height: conditionalScale(62, 70, 75, 85),
    borderRadius: conditionalScale(31, 35, 37, 42),
    backgroundColor: '#fff3e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: conditionalVerticalScale(12, 16, 18, 20),
  },

  QRSetup_ModalTitle: {
    fontSize: conditionalFontScale(18, 20, 21, 24),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: conditionalVerticalScale(10, 12, 13, 15),
    textAlign: 'center',
  },

  QRSetup_ModalMessage: {
    fontSize: conditionalFontScale(13, 14, 15, 17),
    color: '#666',
    textAlign: 'center',
    lineHeight: conditionalFontScale(18, 20, 22, 25),
    marginBottom: conditionalVerticalScale(20, 24, 26, 30),
  },

  QRSetup_ModalButtons: {
    flexDirection: 'column',
    width: '100%',
    gap: conditionalVerticalScale(10, 12, 13, 15),
  },

  QRSetup_ModalButtonPrimary: {
    backgroundColor: '#0A66C2',
    paddingVertical: conditionalVerticalScale(12, 14, 15, 17),
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
    fontSize: conditionalFontScale(14, 15, 16, 18),
    fontWeight: '700',
  },

  QRSetup_ModalButtonSecondary: {
    backgroundColor: '#f5f7fa',
    paddingVertical: conditionalVerticalScale(12, 14, 15, 17),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8eaed',
  },

  QRSetup_ModalButtonSecondaryText: {
    color: '#666',
    fontSize: conditionalFontScale(14, 15, 16, 18),
    fontWeight: '600',
  },

  // ============================================
  // MAIN DASHBOARD - RESPONSIVE STYLES
  // ============================================
  MainDash_Container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  MainDash_ScrollView: {
    flex: 1,
  },

  MainDash_HeaderContainer: {
    paddingHorizontal: conditionalScale(16, 20, 24, 28),
    paddingTop: conditionalVerticalScale(13, 15, 17, 19),
    paddingBottom: conditionalVerticalScale(21, 25, 29, 33),
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    backgroundColor: brand.primary,
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
    width: conditionalScale(80, 90, 100, 110),
    height: conditionalScale(80, 90, 100, 110),
    borderRadius: conditionalScale(40, 45, 50, 55),
    borderWidth: moderateScale(3),
    borderColor: '#fff',
    backgroundColor: '#EAF2FB',
  },

  MainDash_AvatarContainer: {
    width: conditionalScale(80, 90, 100, 100), // was 110
    height: conditionalScale(80, 90, 100, 100), // was 110
    borderRadius: conditionalScale(40, 45, 50, 55),
    borderWidth: moderateScale(3),
    borderColor: '#fff',
    backgroundColor: '#bed8f6ff',
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  MainDash_AvatarContainerSmall: {
    width: conditionalScale(80, 90, 100, 110),
    height: conditionalScale(80, 90, 100, 110),
    borderRadius: conditionalScale(40, 45, 50, 55),
    borderWidth: moderateScale(3),
    borderColor: '#fff',
    backgroundColor: '#bed8f6ff',
    marginRight: 0,
    marginBottom: conditionalVerticalScale(10, 12, 14, 16),
    justifyContent: 'center',
    alignItems: 'center',
  },

  MainDash_AvatarText: {
    fontSize: conditionalFontScale(24, 28, 30, 34),
    fontWeight: '700',
    color: brand.primary,
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
    fontSize: conditionalFontScale(14, 16, 18, 18),
    fontWeight: '700',
    color: '#fff',
    marginBottom: conditionalVerticalScale(0, 1, 1, 2),
    textAlign: 'left',
  },

  MainDash_NameTextSmall: {
    fontSize: conditionalFontScale(14, 16, 18, 20),
    fontWeight: '700',
    color: '#fff',
    marginBottom: conditionalVerticalScale(0, 1, 1, 2),
    textAlign: 'center',
  },

  MainDash_EmailText: {
    fontSize: conditionalFontScale(10, 11, 12, 13),
    color: '#DCE6F5',
    textAlign: 'left',
    lineHeight: conditionalFontScale(13, 14, 15, 16),
  },

  MainDash_EmailTextSmall: {
    fontSize: conditionalFontScale(10, 11, 12, 13),
    color: '#DCE6F5',
    textAlign: 'center',
    lineHeight: conditionalFontScale(13, 14, 15, 16),
  },

  MainDash_BoldText: {
    fontSize: conditionalFontScale(10, 11, 12, 13),
    color: '#DCE6F5',
    fontWeight: 'bold',
  },

  MainDash_MainContent: {
    flex: 1,
    paddingTop: conditionalVerticalScale(18, 22, 26, 30),
  },

  MainDash_SectionTitle: {
    fontSize: conditionalFontScale(16, 18, 20, 20),
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: conditionalVerticalScale(14, 18, 20, 24),
    paddingHorizontal: spacing.md,
  },

  MainDash_Card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
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
    fontSize: conditionalFontScale(11, 12, 13, 13),
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: conditionalFontScale(13, 14, 16, 18),
    marginTop: conditionalVerticalScale(6, 8, 9, 10),
  },

  MainDash_IndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: conditionalVerticalScale(10, 12, 14, 16),
    paddingHorizontal: spacing.md,
    marginBottom: conditionalVerticalScale(1, 2, 2, 3),
  },

  MainDash_IndicatorDot: {
    width: conditionalScale(7, 8, 9, 10),
    height: conditionalScale(7, 8, 9, 10),
    borderRadius: conditionalScale(3.5, 4, 4.5, 5),
    backgroundColor: brand.primary,
    marginHorizontal: conditionalScale(3, 4, 5, 6),
  },

  MainDash_IndicatorDotInactive: {
    opacity: 0.3,
  },

  MainDash_NoMenuContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: conditionalVerticalScale(35, 40, 45, 50),
    paddingHorizontal: spacing.md,
  },

  MainDash_NoMenuText: {
    fontSize: conditionalFontScale(15, 16, 17, 19),
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },

  MainDash_CardIcon: {
    resizeMode: 'contain',
  },

  MainDash_PageContainer: {
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },

  // ==================================================
  // WORKER ASSIGNED TO ME SCREEN - RESPONSIVE STYLES
  // ==================================================

  WorkerATM_Container: {
    flex: 1,
  },

  WorkerATM_ScrollContainer: {
    flex: 1,
    paddingTop: conditionalVerticalScale(10, 12, 14, 16),
  },

  WorkerATM_ContentWrapper: {
    paddingBottom: conditionalVerticalScale(25, 30, 35, 40),
  },

  WorkerATM_ChainContainer: {
    position: 'relative',
  },

  WorkerATM_NoDataText: {
    textAlign: 'center',
    marginTop: conditionalVerticalScale(25, 30, 35, 40),
    fontSize: conditionalFontScale(13, 14, 15, 17),
    fontWeight: '500',
    paddingHorizontal: spacing.md,
    lineHeight: conditionalFontScale(18, 20, 22, 24),
  },

  // Root User Card Styles
  WorkerATM_RootContainer: {
    alignItems: 'center',
    paddingHorizontal: conditionalScale(10, 12, 14, 16),
    position: 'relative',
  },

  WorkerATM_RootCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: conditionalScale(10, 12, 14, 16),
    borderWidth: 2,
    borderColor: brand.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    maxWidth: conditionalScale(340, 370, 390, 450),
    marginTop: conditionalVerticalScale(5, 6, 7, 8),
  },

  WorkerATM_RootCardShrunk: {
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
    transform: [{scale: 0.88}],
    maxWidth: conditionalScale(310, 340, 360, 420),
  },

  WorkerATM_RootAvatar: {
    width: conditionalScale(60, 70, 75, 85),
    height: conditionalScale(60, 70, 75, 85),
    borderRadius: conditionalScale(30, 35, 37, 42),
    borderWidth: moderateScale(3),
    borderColor: brand.primary,
    marginRight: spacing.sm,
  },

  WorkerATM_RootAvatarShrunk: {
    width: conditionalScale(45, 50, 55, 60),
    height: conditionalScale(45, 50, 55, 60),
    borderRadius: conditionalScale(22, 25, 27, 30),
    borderWidth: moderateScale(2),
  },

  WorkerATM_RootAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  WorkerATM_RootInitials: {
    fontSize: conditionalFontScale(16, 18, 20, 22),
    fontWeight: '700',
  },

  WorkerATM_RootInitialsShrunk: {
    fontSize: conditionalFontScale(13, 14, 16, 18),
  },

  WorkerATM_RootInfo: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },

  WorkerATM_RootInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: conditionalVerticalScale(1, 2, 2, 3),
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },

  WorkerATM_RootName: {
    fontSize: conditionalFontScale(14, 16, 17, 19),
    fontWeight: '700',
    marginRight: spacing.sm,
    flexShrink: 1,
    textAlign: 'left',
  },

  WorkerATM_RootNameShrunk: {
    fontSize: conditionalFontScale(12, 13, 14, 16),
  },

  WorkerATM_RootRole: {
    fontSize: conditionalFontScale(12, 13, 14, 16),
    color: brand.primary,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'left',
  },

  WorkerATM_RootRoleShrunk: {
    fontSize: conditionalFontScale(10, 11, 12, 14),
  },

  WorkerATM_RootMeta: {
    fontSize: conditionalFontScale(10, 11, 12, 13),
    marginRight: spacing.sm,
    flexShrink: 1,
    textAlign: 'left',
    lineHeight: conditionalFontScale(12, 13, 15, 16),
  },

  WorkerATM_RootMetaShrunk: {
    fontSize: conditionalFontScale(9, 10, 11, 12),
  },

  WorkerATM_ActionButtonRow: {
    flexDirection: 'row',
    marginTop: conditionalVerticalScale(5, 6, 7, 8),
    justifyContent: 'flex-start',
  },

  WorkerATM_ActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.primary,
    paddingVertical: conditionalVerticalScale(5, 6, 7, 8),
    paddingHorizontal: conditionalScale(8, 10, 11, 13),
    borderRadius: borderRadius.md,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    marginRight: conditionalScale(5, 6, 7, 8),
  },

  WorkerATM_ActionButtonText: {
    color: '#fff',
    fontSize: conditionalFontScale(10, 11, 12, 13),
    fontWeight: '600',
    marginLeft: conditionalScale(3, 4, 5, 6),
  },

  WorkerATM_BottomConnector: {
    position: 'absolute',
    bottom: conditionalVerticalScale(-18, -22, -24, -28),
    alignSelf: 'center',
    width: 2,
    height: conditionalVerticalScale(24, 28, 30, 34),
    backgroundColor: brand.primary,
    zIndex: 1,
  },

  // Employee Node Styles
  WorkerATM_EmployeeContainer: {
    marginRight: conditionalScale(12, 16, 18, 20),
    marginVertical: conditionalVerticalScale(5, 6, 7, 8),
    position: 'relative',
    paddingLeft: conditionalScale(12, 16, 18, 20),
  },

  WorkerATM_HorizontalConnector: {
    position: 'absolute',
    left: conditionalScale(20, 25, 27, 30),
    top: '50%',
    width: conditionalScale(12, 16, 18, 20),
    height: 2,
    backgroundColor: brand.primary,
  },

  WorkerATM_EmployeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: conditionalVerticalScale(8, 10, 11, 13),
    paddingHorizontal: conditionalScale(10, 12, 14, 16),
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginLeft: conditionalScale(12, 16, 18, 20),
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: conditionalVerticalScale(55, 60, 65, 70),
  },

  WorkerATM_EmployeeAvatar: {
    width: conditionalScale(36, 40, 44, 48),
    height: conditionalScale(36, 40, 44, 48),
    borderRadius: conditionalScale(18, 20, 22, 24),
    marginRight: conditionalScale(8, 10, 11, 13),
    borderWidth: 2,
  },

  WorkerATM_EmployeeAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  WorkerATM_EmployeeInitials: {
    fontSize: conditionalFontScale(13, 14, 15, 17),
    fontWeight: '600',
  },

  WorkerATM_EmployeeInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },

  WorkerATM_EmployeeName: {
    fontSize: conditionalFontScale(13, 14, 15, 16),
    fontWeight: '600',
    textAlign: 'left',
  },

  WorkerATM_EmployeeRole: {
    fontSize: conditionalFontScale(11, 12, 13, 14),
    marginTop: conditionalVerticalScale(1, 2, 2, 3),
    textAlign: 'left',
  },

  WorkerATM_ChevronIcon: {
    marginLeft: conditionalScale(6, 8, 9, 10),
  },

  // Connector Lines
  WorkerATM_ConnectorFromRoot: {
    width: 2,
    height: conditionalVerticalScale(15, 18, 20, 22),
    backgroundColor: brand.primary,
    alignSelf: 'flex-start',
    marginLeft: conditionalScale(20, 25, 27, 30),
    marginBottom: 0,
    marginTop: -1,
  },

  WorkerATM_VerticalLine: {
    position: 'absolute',
    left: conditionalScale(20, 25, 27, 30),
    top: -1,
    bottom: conditionalVerticalScale(32, 37, 40, 44),
    width: 2,
    backgroundColor: brand.primary,
  },

  // ============================================
  // DISPLAY LIST PAGE - RESPONSIVE STYLES
  // ============================================

  DisplayList_Container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  DisplayList_ListContainer: {
    paddingHorizontal: conditionalScale(1, 2, 3, 4),
    paddingTop: conditionalVerticalScale(12, 14, 18, 22),
    paddingBottom: conditionalVerticalScale(12, 14, 18, 22),
  },

  DisplayList_Card: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(6),
    elevation: 4,
    paddingHorizontal: conditionalScale(8, 10, 12, 14),
    paddingVertical: conditionalVerticalScale(14, 16, 18, 20),
  },

  DisplayList_IconWrapper: {
    width: conditionalScale(64, 70, 76, 84),
    height: conditionalScale(64, 70, 76, 84),
    borderRadius: conditionalScale(32, 35, 38, 42),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: conditionalVerticalScale(10, 12, 14, 16),
  },

  DisplayList_Icon: {
    width: conditionalScale(44, 50, 54, 60),
    height: conditionalScale(44, 50, 54, 60),
    resizeMode: 'contain',
  },

  DisplayList_Title: {
    fontSize: conditionalFontScale(11, 12, 13, 14),
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    lineHeight: conditionalFontScale(14, 15, 16, 18),
  },

  DisplayList_ColumnWrapper: {
    justifyContent: 'flex-start',
    paddingHorizontal: conditionalScale(4, 6, 8, 10),
  },

  DisplayList_ItemSeparator: {
    height: conditionalVerticalScale(12, 14, 16, 18),
  },

  // DLP_PressableCard: {
  //   marginBottom: verticalScale(12),
  // },

  DLP_PressableCardPressed: {
    opacity: 0.85,
  },

  // ============================================
  // PROFILE SCREEN - RESPONSIVE STYLES
  // ============================================

  Profile_container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  Profile_scrollContainer: {
    paddingBottom: conditionalVerticalScale(24, 28, 32, 36),
  },

  Profile_profileHeader: {
    alignItems: 'center',
    paddingTop: conditionalVerticalScale(24, 28, 32, 36),
    paddingBottom: conditionalVerticalScale(16, 18, 20, 22),
  },

  Profile_avatarContainer: {
    marginBottom: conditionalVerticalScale(16, 18, 20, 22),
    shadowColor: '#6366F1',
    shadowOpacity: 0.15,
    shadowRadius: moderateScale(10),
    shadowOffset: {
      width: 0,
      height: moderateScale(4),
    },
    elevation: moderateScale(6),
  },

  Profile_avatarFallback: {
    width: conditionalScale(100, 110, 120, 130),
    height: conditionalScale(100, 110, 120, 130),
    borderRadius: conditionalScale(50, 55, 60, 65),
    backgroundColor: '#E8E3F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: moderateScale(3),
    borderColor: '#FFFFFF',
  },

  Profile_avatarText: {
    fontSize: conditionalFontScale(36, 38, 40, 42),
    fontWeight: '600',
    color: '#6366F1',
  },

  Profile_card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: conditionalScale(18, 20, 22, 24),
    borderRadius: borderRadius.lg,
    paddingVertical: conditionalVerticalScale(4, 5, 6, 7),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: moderateScale(3),
    shadowOffset: {
      width: 0,
      height: moderateScale(1.5),
    },
    elevation: moderateScale(2),
  },

  Profile_settingItem: {
    paddingHorizontal: conditionalScale(14, 15, 16, 17),
    paddingVertical: conditionalVerticalScale(12, 13, 14, 15),
    borderBottomWidth: moderateScale(1),
    borderBottomColor: '#F5F5F5',
  },

  Profile_settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  Profile_settingIconWrapper: {
    width: conditionalScale(32, 34, 36, 38),
    height: conditionalScale(32, 34, 36, 38),
    borderRadius: conditionalScale(16, 17, 18, 19),
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: conditionalScale(12, 13, 14, 15),
  },

  Profile_settingTextContainer: {
    flex: 1,
  },

  Profile_settingTitle: {
    fontSize: conditionalFontScale(15, 15.5, 16, 16),
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: conditionalVerticalScale(2, 2.5, 3, 3.5),
  },

  Profile_settingSubtitle: {
    fontSize: conditionalFontScale(12, 12.5, 13, 13),
    color: '#757575',
    lineHeight: conditionalFontScale(16, 17, 18, 19),
  },

  Profile_versionContainer: {
    alignItems: 'center',
    marginTop: conditionalVerticalScale(12, 14, 16, 18),
    paddingHorizontal: conditionalScale(18, 20, 22, 24),
  },

  Profile_versionText: {
    fontSize: conditionalFontScale(12, 12.5, 13, 13.5),
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: conditionalFontScale(18, 19, 20, 21),
  },

  Profile_signOutButton: {
    marginHorizontal: conditionalScale(18, 20, 22, 24),
    marginTop: conditionalVerticalScale(24, 28, 32, 36),
    marginBottom: conditionalVerticalScale(8, 10, 12, 14),
    paddingVertical: conditionalVerticalScale(12, 13, 14, 15),
    backgroundColor: '#FF6464',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    shadowColor: '#FF6464',
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(6),
    shadowOffset: {
      width: 0,
      height: moderateScale(3),
    },
    elevation: moderateScale(3),
  },

  Profile_signOutText: {
    fontSize: conditionalFontScale(15, 15.5, 16, 16.5),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ============================================
  // DISPLAY PERSONAL INFO - RESPONSIVE STYLES
  // ============================================

  DPI_container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  DPI_headerContainer: {
    paddingBottom: conditionalVerticalScale(20, 22, 24, 26),
    paddingHorizontal: conditionalScale(18, 20, 22, 24),
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    elevation: moderateScale(3),
    shadowColor: '#6366F1',
    shadowOpacity: 0.15,
    shadowRadius: moderateScale(8),
    shadowOffset: {
      width: 0,
      height: moderateScale(2),
    },
  },

  DPI_headerTitle: {
    fontSize: conditionalFontScale(26, 28, 30, 32),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: conditionalVerticalScale(4, 5, 6, 7),
  },

  DPI_headerSubtitle: {
    fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: conditionalFontScale(20, 21, 22, 23),
    letterSpacing: 0.3,
  },

  DPI_listContent: {
    padding: conditionalScale(16, 18, 20, 22),
  },

  DPI_card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: conditionalScale(14, 15, 16, 17),
    marginBottom: conditionalVerticalScale(10, 11, 12, 13),
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: moderateScale(4),
    shadowOffset: {
      width: 0,
      height: moderateScale(1),
    },
    elevation: moderateScale(2),
    borderWidth: moderateScale(0.5),
    borderColor: '#F0F0F0',
  },

  DPI_iconContainer: {
    width: conditionalScale(42, 44, 46, 48),
    height: conditionalScale(42, 44, 46, 48),
    borderRadius: conditionalScale(14, 15, 16, 17),
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: conditionalScale(12, 13, 14, 15),
  },

  DPI_textContainer: {
    flex: 1,
  },

  DPI_title: {
    fontSize: conditionalFontScale(15, 15.5, 16, 16.5),
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: conditionalVerticalScale(2, 2.5, 3, 3.5),
    letterSpacing: 0.2,
  },

  DPI_subtitle: {
    fontSize: conditionalFontScale(13, 13.5, 14, 14.5),
    color: '#757575',
    lineHeight: conditionalFontScale(18, 19, 20, 21),
    letterSpacing: 0.2,
  },

  // ============================================
  // CHANGE PROFILE IMAGE - RESPONSIVE STYLES
  // ============================================

  CPI_container: {
    flex: 1,
    padding: conditionalScale(16, 18, 20, 22),
    backgroundColor: '#F9FAFB',
  },

  CPI_scrollContainer: {
    alignItems: 'center',
    paddingTop: conditionalVerticalScale(24, 28, 32, 36),
    paddingBottom: conditionalVerticalScale(40, 45, 50, 55),
  },

  CPI_title: {
    fontSize: conditionalFontScale(26, 28, 30, 32),
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: conditionalVerticalScale(6, 7, 8, 9),
    letterSpacing: 0.5,
  },

  CPI_subtitle: {
    fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
    color: '#757575',
    textAlign: 'center',
    marginBottom: conditionalVerticalScale(20, 22, 24, 26),
    lineHeight: conditionalFontScale(20, 21, 22, 23),
    paddingHorizontal: conditionalScale(20, 24, 28, 32),
    letterSpacing: 0.2,
  },

  CPI_imageWrapper: {
    overflow: 'hidden',
    marginBottom: conditionalVerticalScale(32, 36, 40, 44),
    shadowColor: brand.primary,
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(12),
    shadowOffset: {
      width: 0,
      height: moderateScale(6),
    },
    elevation: moderateScale(8),
  },

  CPI_actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: conditionalVerticalScale(16, 18, 20, 22),
    gap: conditionalScale(12, 14, 16, 18),
  },

  CPI_button: {
    flex: 1,
    paddingVertical: conditionalVerticalScale(12, 13, 14, 15),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: moderateScale(4),
    shadowOffset: {
      width: 0,
      height: moderateScale(2),
    },
    elevation: moderateScale(2),
  },

  CPI_primaryButton: {
    backgroundColor: brand.primary,
  },

  CPI_secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: moderateScale(1),
    borderColor: '#D1D5DB',
  },

  CPI_buttonText: {
    fontSize: conditionalFontScale(15, 15.5, 16, 16.5),
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  CPI_buttonTextPrimary: {
    color: '#FFFFFF',
  },

  CPI_buttonTextSecondary: {
    color: '#374151',
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
    paddingBottom: conditionalVerticalScale(24, 28, 32, 36),
  },

  Biometric_headerContainer: {
    paddingTop: conditionalVerticalScale(24, 28, 32, 36),
    paddingBottom: conditionalVerticalScale(20, 22, 24, 26),
    paddingHorizontal: conditionalScale(18, 20, 22, 24),
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    elevation: moderateScale(4),
    shadowColor: '#6366F1',
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(10),
    shadowOffset: {width: 0, height: moderateScale(4)},
    marginBottom: conditionalVerticalScale(4, 6, 8, 10),
  },

  Biometric_headerContent: {
    gap: conditionalVerticalScale(12, 14, 16, 18),
  },

  Biometric_headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(10, 12, 14, 16),
  },

  Biometric_headerIconContainer: {
    width: conditionalScale(44, 48, 52, 56),
    height: conditionalScale(44, 48, 52, 56),
    borderRadius: conditionalScale(22, 24, 26, 28),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: moderateScale(1.5),
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  Biometric_headerIconSize: conditionalFontScale(22, 24, 26, 28),

  Biometric_headerTitle: {
    fontSize: conditionalFontScale(20, 22, 24, 26),
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    letterSpacing: 0.5,
  },

  Biometric_headerSubtitle: {
    fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: conditionalFontScale(20, 21, 22, 23),
    marginTop: conditionalVerticalScale(2, 3, 4, 5),
    letterSpacing: 0.2,
  },

  Biometric_statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: conditionalScale(12, 13, 14, 15),
    paddingVertical: conditionalVerticalScale(6, 7, 8, 9),
    borderRadius: borderRadius.full,
    gap: conditionalScale(4, 5, 6, 7),
    borderWidth: moderateScale(1),
  },

  Biometric_statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },

  Biometric_statusInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  Biometric_statusIconSize: conditionalFontScale(12, 13, 14, 15),

  Biometric_statusText: {
    fontSize: conditionalFontScale(12, 12.5, 13, 13.5),
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  Biometric_statusTextActive: {
    color: '#10B981',
  },

  Biometric_statusTextInactive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },

  Biometric_unavailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: conditionalScale(32, 36, 40, 44),
    backgroundColor: '#FFFFFF',
  },

  Biometric_unavailableIconSize: conditionalScale(48, 52, 56, 60),

  Biometric_unavailableTitle: {
    fontSize: conditionalFontScale(20, 21, 22, 23),
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: conditionalVerticalScale(20, 22, 24, 26),
    marginBottom: conditionalVerticalScale(6, 7, 8, 9),
    letterSpacing: 0.3,
  },

  Biometric_unavailableText: {
    fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
    color: '#757575',
    textAlign: 'center',
    lineHeight: conditionalFontScale(20, 21, 22, 23),
    paddingHorizontal: conditionalScale(16, 20, 24, 28),
    letterSpacing: 0.2,
  },

  Biometric_sectionAccount: {
    paddingHorizontal: conditionalScale(18, 20, 22, 24),
    paddingVertical: conditionalVerticalScale(20, 22, 24, 26),
  },

  Biometric_sectionHeader: {
    marginBottom: conditionalVerticalScale(14, 15, 16, 17),
  },

  Biometric_sectionTitle: {
    fontSize: conditionalFontScale(17, 18, 19, 20),
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },

  Biometric_accountsContainer: {
    gap: conditionalVerticalScale(12, 14, 16, 18),
  },

  Biometric_providerSection: {
    gap: conditionalVerticalScale(6, 7, 8, 9),
  },

  Biometric_accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: conditionalScale(14, 15, 16, 17),
    backgroundColor: '#F8F9FA',
    borderRadius: borderRadius.lg,
    borderWidth: moderateScale(1),
    borderColor: 'transparent',
  },

  Biometric_selectedAccountItem: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },

  Biometric_accountIcon: {
    width: conditionalScale(30, 32, 34, 36),
    height: conditionalScale(30, 32, 34, 36),
    borderRadius: conditionalScale(15, 16, 17, 18),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: conditionalScale(7, 8, 9, 10),
    borderWidth: moderateScale(1),
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: moderateScale(2),
    shadowOffset: {width: 0, height: moderateScale(1)},
    elevation: moderateScale(1),
  },

  Biometric_accountIconSize: conditionalFontScale(14, 15, 16, 17),

  Biometric_accountInfo: {
    flex: 1,
  },

  Biometric_accountEmail: {
    fontSize: conditionalFontScale(13, 13.5, 14, 14.5),
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: conditionalVerticalScale(1.5, 2, 2.5, 3),
    letterSpacing: 0.2,
  },

  Biometric_selectedAccountEmail: {
    color: '#6366F1',
    fontWeight: '600',
  },

  Biometric_accountName: {
    fontSize: conditionalFontScale(13, 13.5, 14, 14.5),
    color: '#757575',
    letterSpacing: 0.2,
  },

  Biometric_enabledBadge: {
    fontSize: conditionalFontScale(12, 12.5, 13, 13.5),
    color: '#10B981',
    fontWeight: '600',
    marginTop: conditionalVerticalScale(3, 4, 5, 6),
    letterSpacing: 0.2,
  },

  Biometric_checkIconSize: conditionalFontScale(18, 19, 20, 21),

  Biometric_emptyState: {
    alignItems: 'center',
    padding: conditionalScale(32, 36, 40, 44),
  },

  Biometric_emptyStateIconSize: conditionalScale(40, 44, 48, 52),

  Biometric_emptyStateText: {
    fontSize: conditionalFontScale(16, 16.5, 17, 17.5),
    fontWeight: '500',
    color: '#757575',
    marginTop: conditionalVerticalScale(14, 15, 16, 17),
    marginBottom: conditionalVerticalScale(6, 7, 8, 9),
    letterSpacing: 0.2,
  },

  Biometric_emptyStateSubtext: {
    fontSize: conditionalFontScale(13, 13.5, 14, 14.5),
    color: '#A0A0A0',
    textAlign: 'center',
    lineHeight: conditionalFontScale(18, 19, 20, 21),
    paddingHorizontal: conditionalScale(16, 20, 24, 28),
    letterSpacing: 0.2,
  },

  // ============================================
  // ENTITLEMENT SCREENS – RESPONSIVE STYLES
  // ============================================

  EntBal_NoDataText: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: fontScale(16),
    fontWeight: '600',
    color: '#CCCCCC',
  },

  // ============================================
  // SALARY SLIP SCREEN – RESPONSIVE STYLES
  // ============================================

  SSlip_Container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  SSlip_ScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: conditionalScale(20, 24, 28, 32),
    paddingTop: conditionalVerticalScale(40, 45, 50, 55),
    paddingBottom: conditionalVerticalScale(40, 45, 50, 55),
  },

  SSlip_Icon: {
    marginBottom: conditionalVerticalScale(24, 26, 28, 30),
    alignSelf: 'center',
  },

  SSlip_ScreenTitle: {
    fontSize: conditionalFontScale(24, 26, 28, 30),
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: conditionalVerticalScale(6, 7, 8, 9),
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  SSlip_ScreenSubtitle: {
    fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
    color: '#757575',
    textAlign: 'center',
    marginBottom: conditionalVerticalScale(24, 26, 28, 30),
    paddingHorizontal: conditionalScale(16, 20, 24, 28),
    lineHeight: conditionalFontScale(20, 21, 22, 23),
    letterSpacing: 0.2,
  },

  SSlip_FieldsHeading: {
    fontSize: conditionalFontScale(15, 15.5, 16, 16.5),
    fontWeight: '600',
    color: '#1A1A1A',
    alignSelf: 'flex-start',
    width: '100%',
    marginBottom: conditionalVerticalScale(8, 9, 10, 11),
    marginTop: conditionalVerticalScale(4, 5, 6, 7),
    letterSpacing: 0.2,
  },

  SSlip_Dropdown: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: moderateScale(1),
    borderColor: '#E0E0E0',
    borderRadius: borderRadius.lg,
    paddingVertical: conditionalVerticalScale(12, 13, 14, 15),
    paddingHorizontal: conditionalScale(16, 17, 18, 19),
    marginBottom: conditionalVerticalScale(16, 18, 20, 22),
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: moderateScale(3),
    shadowOffset: {width: 0, height: moderateScale(1)},
    elevation: moderateScale(1),
  },

  SSlip_ItemText: {
    fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },

  SSlip_DropdownPlaceholder: {
    fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
    color: '#A0A0A0',
    letterSpacing: 0.2,
  },

  SSlip_DropdownSelected: {
    fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },

  SSlip_Button: {
    width: '100%',
    borderRadius: borderRadius.lg,
    marginTop: conditionalVerticalScale(24, 26, 28, 30),
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: moderateScale(3)},
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(8),
    elevation: moderateScale(4),
  },

  SSlip_ButtonContent: {
    width: '100%',
    paddingVertical: conditionalVerticalScale(14, 15, 16, 17),
    paddingHorizontal: conditionalScale(24, 28, 32, 36),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
  },

  SSlip_ButtonText: {
    fontSize: conditionalFontScale(15, 15.5, 16, 16.5),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // ============================================
  // TAX CERTIFICATE SCREEN – RESPONSIVE STYLES
  // ============================================

  TCert_Container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  TCert_ScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: conditionalScale(20, 24, 28, 32),
    paddingTop: conditionalVerticalScale(40, 45, 50, 55),
    paddingBottom: conditionalVerticalScale(40, 45, 50, 55),
  },

  TCert_Icon: {
    marginBottom: conditionalVerticalScale(24, 26, 28, 30),
    alignSelf: 'center',
  },

  TCert_ScreenTitle: {
    fontSize: conditionalFontScale(24, 26, 28, 30),
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: conditionalVerticalScale(6, 7, 8, 9),
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  TCert_ScreenSubtitle: {
    fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
    color: '#757575',
    textAlign: 'center',
    marginBottom: conditionalVerticalScale(24, 26, 28, 30),
    paddingHorizontal: conditionalScale(16, 20, 24, 28),
    lineHeight: conditionalFontScale(20, 21, 22, 23),
    letterSpacing: 0.2,
  },

  TCert_Label: {
    fontSize: conditionalFontScale(15, 15.5, 16, 16.5),
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: conditionalVerticalScale(8, 9, 10, 11),
    alignSelf: 'flex-start',
    width: '100%',
    letterSpacing: 0.2,
  },

  TCert_Dropdown: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: moderateScale(1),
    borderColor: '#E0E0E0',
    borderRadius: borderRadius.lg,
    paddingVertical: conditionalVerticalScale(12, 13, 14, 15),
    paddingHorizontal: conditionalScale(16, 17, 18, 19),
    marginBottom: conditionalVerticalScale(16, 18, 20, 22),
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: moderateScale(3),
    shadowOffset: {width: 0, height: moderateScale(1)},
    elevation: moderateScale(1),
  },

  TCert_ItemText: {
    fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },

  TCert_DropdownPlaceholder: {
    fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
    color: '#A0A0A0',
    letterSpacing: 0.2,
  },

  TCert_DropdownSelected: {
    fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },

  TCert_Button: {
    width: '100%',
    borderRadius: borderRadius.lg,
    marginTop: conditionalVerticalScale(24, 26, 28, 30),
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: moderateScale(3)},
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(8),
    elevation: moderateScale(4),
  },

  TCert_ButtonContent: {
    width: '100%',
    paddingVertical: conditionalVerticalScale(14, 15, 16, 17),
    paddingHorizontal: conditionalScale(24, 28, 32, 36),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
  },

  TCert_ButtonText: {
    fontSize: conditionalFontScale(15, 15.5, 16, 16.5),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // ============================================
  // DYNAMIC LIST PAGE - RESPONSIVE STYLES
  // ============================================

  DLP_Container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  DLP_AnimatedContainer: {
    flex: 1,
  },

  DLP_LoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  DLP_ListContainer: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },

  DLP_CardWrapper: {
    marginBottom: conditionalVerticalScale(8, 10, 12, 16),
  },

  DLP_SummaryContainer: {
    backgroundColor: '#E6F2FF',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: conditionalScale(4, 4, 5, 6),
    borderLeftColor: brand.primary,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: moderateScale(3)},
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(6),
    elevation: 4,
  },

  DLP_SummaryText: {
    fontSize: conditionalFontScale(14, 15, 16, 16),
    fontWeight: '600',
    color: brand.primary,
    textAlign: 'center',
  },

  DLP_NoDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },

  DLP_NoDataText: {
    fontSize: conditionalFontScale(16, 17, 18, 18),
    fontWeight: '600',
    color: brand.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  DLP_NoDataSubText: {
    fontSize: conditionalFontScale(13, 14, 15, 16),
    color: '#6B7280',
    textAlign: 'center',
  },

  DLP_ProcessingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },

  DLP_ProcessingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: conditionalScale(24, 28, 32, 36),
    alignItems: 'center',
    minWidth: conditionalScale(200, 220, 240, 260),
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: moderateScale(4)},
    shadowOpacity: 0.15,
    shadowRadius: moderateScale(12),
    elevation: 8,
    borderWidth: moderateScale(1),
    borderColor: '#F0F0F0',
  },

  DLP_ProcessingText: {
    marginTop: conditionalVerticalScale(12, 14, 16, 18),
    fontSize: conditionalFontScale(16, 17, 18, 18),
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },

  // ============================================
  // DYNAMIC SAVE RECORD - RESPONSIVE STYLES
  // ============================================

  DSR_SafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  DSR_DropdownInputSearch: {
    height: 40,
    fontSize: 14,
    borderColor: '#ccc',
    borderRadius: 8,
  },

  DSR_ContentWrapper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'space-between',
    paddingHorizontal: conditionalScale(16, 18, 20, 22),
    paddingTop: conditionalVerticalScale(8, 10, 12, 14),
  },

  DSR_FormContainer: {
    paddingHorizontal: conditionalScale(12, 14, 16, 18),
    paddingTop: conditionalVerticalScale(8, 10, 12, 14),
    paddingBottom: conditionalVerticalScale(80, 85, 90, 100),
  },

  DSR_Label: {
    fontSize: conditionalFontScale(13, 13.5, 14, 14),
    marginTop: conditionalVerticalScale(14, 16, 18, 20),
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },

  DSR_Input: {
    borderWidth: moderateScale(1),
    borderColor: '#E0E0E0',
    borderRadius: borderRadius.lg,
    padding: conditionalScale(11, 12, 13, 14),
    marginTop: conditionalVerticalScale(5, 6, 7, 8),
    fontSize: conditionalFontScale(14, 14.5, 15, 15),
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: moderateScale(3),
    shadowOffset: {width: 0, height: moderateScale(1)},
    elevation: moderateScale(1),
  },

  DSR_Disabled: {
    backgroundColor: '#F8F9FA',
    color: '#A0A0A0',
    borderColor: '#F0F0F0',
  },

  DSR_TextArea: {
    height: conditionalVerticalScale(95, 105, 115, 125),
    textAlignVertical: 'top',
    paddingTop: conditionalVerticalScale(11, 12, 13, 14),
  },

  DSR_DateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: moderateScale(1),
    borderColor: '#E0E0E0',
    borderRadius: borderRadius.lg,
    padding: conditionalScale(11, 12, 13, 14),
    marginTop: conditionalVerticalScale(5, 6, 7, 8),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: moderateScale(3),
    shadowOffset: {width: 0, height: moderateScale(1)},
    elevation: moderateScale(1),
  },

  DSR_DateText: {
    fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
    color: '#1A1A1A',
    letterSpacing: 0.2,
    flex: 1,
  },

  DSR_DropdownPlaceholder: {
    color: '#A0A0A0',
    fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
    letterSpacing: 0.2,
  },

  DSR_DropdownSelectedText: {
    color: '#1A1A1A',
    fontWeight: '400',
    fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
    letterSpacing: 0.2,
  },

  DSR_DropdownItemText: {
    color: '#1A1A1A',
    fontSize: conditionalFontScale(13, 13.5, 14, 14.5),
    letterSpacing: 0.2,
  },

  DSR_DropdownContainer: {
    borderWidth: moderateScale(0.5),
    borderColor: '#E0E0E0',
    borderRadius: borderRadius.md,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: moderateScale(1)},
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(3),
    elevation: 2,
    // marginTop: conditionalVerticalScale(2, 3, 4, 5),
  },

  DSR_DropdownItemContainer: {
    paddingHorizontal: conditionalScale(6, 7, 8, 9),
    paddingVertical: conditionalVerticalScale(4, 5, 6, 7),
  },

  DSR_DropdownSearchInput: {
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
    fontSize: conditionalFontScale(10, 10.5, 11, 11.5),
    borderBottomWidth: moderateScale(1),
    borderBottomColor: '#F0F0F0',
    paddingVertical: conditionalVerticalScale(0.5, 1, 1.5, 2),
    paddingHorizontal: conditionalScale(1, 2, 3, 4),
  },

  DSR_DropdownIcon: {
    width: conditionalScale(19, 20, 21, 22),
    height: conditionalScale(19, 20, 21, 22),
    tintColor: '#6366F1',
  },

  DSR_ProcessingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },

  DSR_ProcessingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: conditionalScale(22, 24, 26, 28),
    alignItems: 'center',
    minWidth: conditionalScale(180, 190, 200, 210),
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: moderateScale(3)},
    shadowOpacity: 0.15,
    shadowRadius: moderateScale(10),
    elevation: 7,
    borderWidth: moderateScale(1),
    borderColor: '#F0F0F0',
  },

  DSR_ProcessingText: {
    marginTop: conditionalVerticalScale(11, 13, 15, 17),
    fontSize: conditionalFontScale(15, 16, 17, 18),
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },

  DSR_CharCount: {
    fontSize: conditionalFontScale(11, 11.5, 12, 12.5),
    color: '#757575',
    marginTop: conditionalVerticalScale(3, 4, 5, 6),
    textAlign: 'right',
    letterSpacing: 0.2,
  },

  DSR_FormHeader: {
    backgroundColor: '#F8F9FA',
    padding: conditionalScale(15, 16, 17, 18),
    marginBottom: conditionalVerticalScale(18, 20, 22, 24),
    borderLeftWidth: moderateScale(4),
    borderLeftColor: '#6366F1',
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: moderateScale(4),
    shadowOffset: {width: 0, height: moderateScale(1)},
    elevation: moderateScale(1),
  },

  DSR_FormHeaderText: {
    fontSize: conditionalFontScale(16, 17, 18, 18),
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: conditionalVerticalScale(3, 4, 5, 6),
    letterSpacing: 0.3,
  },

  DSR_FormHeaderSubtext: {
    fontSize: conditionalFontScale(12, 12.5, 13, 13.5),
    color: '#757575',
    letterSpacing: 0.2,
    lineHeight: conditionalFontScale(17, 18, 19, 20),
  },

  DSR_SwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    paddingVertical: conditionalVerticalScale(11, 12, 13, 14),
    paddingHorizontal: conditionalScale(15, 16, 17, 18),
    borderRadius: borderRadius.lg,
    marginBottom: conditionalVerticalScale(11, 13, 15, 17),
    borderWidth: moderateScale(1),
    borderColor: '#F0F0F0',
  },

  DSR_SwitchLabel: {
    fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
    color: '#1A1A1A',
    fontWeight: '500',
    letterSpacing: 0.2,
    flex: 1,
  },

  DSR_ExpandableContent: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: conditionalScale(15, 16, 17, 18),
    paddingTop: conditionalVerticalScale(7, 9, 11, 13),
    paddingBottom: conditionalVerticalScale(14, 16, 18, 20),
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    marginBottom: conditionalVerticalScale(11, 13, 15, 17),
    marginTop: conditionalVerticalScale(-3, -4, -5, -6),
    borderWidth: moderateScale(1),
    borderTopWidth: 0,
    borderColor: '#F0F0F0',
  },

  DSR_GuarantorHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    paddingVertical: conditionalVerticalScale(9, 10, 11, 12),
    paddingHorizontal: conditionalScale(13, 14, 15, 16),
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    borderWidth: moderateScale(1),
    borderBottomWidth: 0,
    borderColor: '#F0F0F0',
    marginTop: conditionalVerticalScale(11, 13, 15, 17),
  },

  DSR_GuarantorHeaderId: {
    flex: 0.3,
    fontWeight: '600',
    fontSize: conditionalFontScale(12, 12.5, 13, 13.5),
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },

  DSR_GuarantorHeaderName: {
    flex: 0.7,
    fontWeight: '600',
    fontSize: conditionalFontScale(12, 12.5, 13, 13.5),
    color: '#1A1A1A',
    paddingLeft: conditionalScale(7, 9, 11, 13),
    letterSpacing: 0.2,
  },

  DSR_GuarantorItem: {
    flexDirection: 'row',
    paddingVertical: conditionalVerticalScale(11, 12, 13, 14),
    paddingHorizontal: conditionalScale(13, 14, 15, 16),
    alignItems: 'center',
    borderBottomWidth: moderateScale(1),
    borderBottomColor: '#F5F5F5',
  },

  DSR_GuarantorId: {
    flex: 0.3,
    fontSize: conditionalFontScale(13, 13.5, 14, 14.5),
    color: '#1A1A1A',
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  DSR_GuarantorName: {
    flex: 0.7,
    fontSize: conditionalFontScale(13, 13.5, 14, 14.5),
    color: '#757575',
    paddingLeft: conditionalScale(7, 9, 11, 13),
    letterSpacing: 0.2,
  },

  DSR_LastItem: {
    borderBottomWidth: 0,
  },

  // ==========================================================
  // DYNAMIC REQUEST CARD - COMPLETE RESPONSIVE STYLES
  // ==========================================================

  // Card Container
  DRC_cardContainer: {
    marginHorizontal: conditionalScale(8, 10, 12, 14),
    marginVertical: conditionalVerticalScale(4, 5, 6, 8),
  },

  DRC_card: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#111827',
        shadowOffset: {width: 0, height: moderateScale(2)},
        shadowOpacity: 0.05,
        shadowRadius: moderateScale(8),
      },
      android: {
        elevation: moderateScale(3),
      },
    }),
    borderWidth: moderateScale(1),
    borderColor: '#f3f4f6',
    overflow: 'hidden',
  },

  DRC_cardInner: {
    padding: conditionalScale(12, 14, 16, 18),
  },

  DRC_cardHighlighted: {
    borderColor: '#6366f1',
    borderWidth: moderateScale(1.5),
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOpacity: 0.1,
        shadowRadius: moderateScale(12),
      },
      android: {
        elevation: moderateScale(5),
      },
    }),
  },

  // Navigation Arrow
  DRC_navigationArrow: {
    position: 'absolute',
    right: conditionalScale(10, 12, 14, 16),
    top: '50%',
    marginTop: conditionalVerticalScale(-6, -7, -8, -9),
    zIndex: 1,
  },

  DRC_navigationArrowInner: {
    width: conditionalScale(24, 26, 28, 30),
    height: conditionalScale(24, 26, 28, 30),
    borderRadius: conditionalScale(12, 13, 14, 15),
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  DRC_header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: conditionalVerticalScale(12, 13, 14, 16),
  },

  DRC_headerRTL: {
    flexDirection: 'row-reverse',
  },

  DRC_headerContent: {
    flex: 1,
    paddingRight: conditionalScale(10, 12, 14, 16),
  },

  DRC_headerContentWithArrow: {
    paddingRight: conditionalScale(36, 38, 40, 44),
  },

  DRC_headerTitle: {
    fontSize: conditionalFontScale(16, 17, 18, 20),
    fontWeight: '700',
    color: '#111827',
    marginBottom: conditionalVerticalScale(2, 3, 4, 5),
    letterSpacing: -0.3,
  },

  DRC_headerSubtitle: {
    fontSize: conditionalFontScale(12, 12.5, 13, 14),
    color: '#6b7280',
    fontWeight: '500',
    letterSpacing: -0.2,
  },

  // Header Right Section
  DRC_headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(6, 7, 8, 10),
  },

  // Status Badge
  DRC_statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(8, 9, 10, 12),
    paddingVertical: conditionalVerticalScale(4, 4.5, 5, 6),
    borderRadius: conditionalScale(16, 18, 20, 24),
    gap: conditionalScale(4, 4.5, 5, 6),
  },

  DRC_statusDot: {
    width: conditionalScale(5, 5.5, 6, 7),
    height: conditionalScale(5, 5.5, 6, 7),
    borderRadius: conditionalScale(2.5, 2.75, 3, 3.5),
  },

  DRC_statusText: {
    fontSize: conditionalFontScale(10, 10.5, 11, 12),
    fontWeight: '600',
    letterSpacing: 0.3,
    // textTransform: 'uppercase',
  },

  // Menu
  DRC_menuContainer: {
    position: 'relative',
  },

  DRC_menuButton: {
    width: conditionalScale(28, 30, 32, 34),
    height: conditionalScale(28, 30, 32, 34),
    borderRadius: conditionalScale(14, 15, 16, 17),
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Dropdown Menu
  DRC_dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },

  DRC_dropdownMenu: {
    position: 'absolute',
    top: conditionalVerticalScale(36, 38, 40, 44),
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.lg,
    minWidth: conditionalScale(160, 170, 180, 200),
    ...Platform.select({
      ios: {
        shadowColor: '#111827',
        shadowOffset: {width: 0, height: moderateScale(4)},
        shadowOpacity: 0.1,
        shadowRadius: moderateScale(12),
      },
      android: {
        elevation: moderateScale(8),
      },
    }),
    borderWidth: moderateScale(1),
    borderColor: '#f3f4f6',
    zIndex: 1000,
  },

  DRC_dropdownArrow: {
    position: 'absolute',
    top: conditionalVerticalScale(-5, -6, -6, -7),
    right: conditionalScale(10, 11, 12, 13),
    width: conditionalScale(10, 11, 12, 13),
    height: conditionalScale(10, 11, 12, 13),
    backgroundColor: '#ffffff',
    borderTopWidth: moderateScale(1),
    borderLeftWidth: moderateScale(1),
    borderColor: '#f3f4f6',
    transform: [{rotate: '45deg'}],
  },

  DRC_menuItem: {
    paddingHorizontal: conditionalScale(12, 13, 14, 16),
    paddingVertical: conditionalVerticalScale(10, 11, 12, 14),
  },

  DRC_menuItemDisabled: {
    opacity: 0.5,
  },

  DRC_menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  DRC_menuIcon: {
    marginRight: conditionalScale(10, 11, 12, 14),
    width: conditionalScale(16, 17, 18, 20),
    textAlign: 'center',
  },

  DRC_menuItemText: {
    fontSize: conditionalFontScale(13, 13.5, 14, 15),
    color: '#374151',
    fontWeight: '500',
  },

  DRC_menuItemTextDisabled: {
    color: '#d1d5db',
  },

  // Fields
  DRC_fieldsContainer: {
    gap: conditionalVerticalScale(10, 11, 12, 14),
  },

  DRC_fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  DRC_fieldRowNoLabel: {
    marginVertical: conditionalVerticalScale(2, 3, 4, 5),
  },

  DRC_fieldLabel: {
    fontSize: conditionalFontScale(12, 12.5, 13, 14),
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
    letterSpacing: -0.2,
  },

  DRC_fieldValueWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: conditionalScale(3, 3.5, 4, 5),
  },

  DRC_fieldValue: {
    fontSize: conditionalFontScale(12, 12.5, 13, 14),
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'right',
    letterSpacing: -0.2,
  },

  DRC_fieldValueWithArrow: {
    marginRight: conditionalScale(26, 28, 30, 32),
  },

  DRC_fieldValueFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: conditionalScale(4, 5, 6, 7),
  },

  DRC_fieldValueNoLabel: {
    fontSize: conditionalFontScale(12, 12.5, 13, 14),
    color: '#1f2937',
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  DRC_fieldValueNoLabelWithArrow: {
    marginRight: conditionalScale(26, 28, 30, 32),
  },

  DRC_fieldValueWithTrend: {
    marginRight: conditionalScale(4, 5, 6, 7),
  },

  DRC_trendIndicator: {
    width: conditionalScale(16, 17, 18, 20),
    height: conditionalScale(16, 17, 18, 20),
    borderRadius: conditionalScale(8, 8.5, 9, 10),
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Boolean Badge
  DRC_booleanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(6, 7, 8, 10),
    paddingVertical: conditionalVerticalScale(3, 3.5, 4, 5),
    borderRadius: conditionalScale(10, 11, 12, 14),
    gap: conditionalScale(3, 3.5, 4, 5),
  },

  DRC_booleanTrue: {
    backgroundColor: '#d1fae5',
  },

  DRC_booleanFalse: {
    backgroundColor: '#f3f4f6',
  },

  DRC_booleanText: {
    fontSize: conditionalFontScale(10, 10.5, 11, 12),
    fontWeight: '600',
  },

  DRC_booleanTextTrue: {
    color: '#065f46',
  },

  DRC_booleanTextFalse: {
    color: '#6b7280',
  },

  // Expanded Fields
  DRC_expandedFieldsContainer: {
    marginTop: conditionalVerticalScale(12, 13, 14, 16),
    paddingTop: conditionalVerticalScale(12, 13, 14, 16),
    borderTopWidth: moderateScale(1),
    borderTopColor: '#f3f4f6',
    gap: conditionalVerticalScale(10, 11, 12, 14),
  },

  // Footer
  DRC_footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: conditionalVerticalScale(12, 13, 14, 16),
    paddingTop: conditionalVerticalScale(12, 13, 14, 16),
    borderTopWidth: moderateScale(1),
    borderTopColor: '#f3f4f6',
  },

  DRC_expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(4, 5, 6, 7),
    paddingVertical: conditionalVerticalScale(5, 5.5, 6, 7),
    paddingHorizontal: conditionalScale(8, 9, 10, 12),
    borderRadius: conditionalScale(6, 7, 8, 10),
    backgroundColor: '#f9fafb',
  },

  DRC_expandButtonText: {
    fontSize: conditionalFontScale(11, 11.5, 12, 13),
    color: '#4b5563',
    fontWeight: '600',
  },

  DRC_bottomButtons: {
    flexDirection: 'row',
    gap: conditionalScale(6, 7, 8, 10),
  },

  // Buttons
  DRC_iconButton: {
    width: conditionalScale(30, 32, 34, 36),
    height: conditionalScale(30, 32, 34, 36),
    borderRadius: conditionalScale(8, 9, 10, 12),
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#111827',
        shadowOffset: {width: 0, height: moderateScale(2)},
        shadowOpacity: 0.1,
        shadowRadius: moderateScale(4),
      },
      android: {
        elevation: moderateScale(2),
      },
    }),
  },

  DRC_textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(12, 13, 14, 16),
    paddingVertical: conditionalVerticalScale(6, 7, 8, 9),
    borderRadius: conditionalScale(8, 9, 10, 12),
    backgroundColor: '#f9fafb',
    gap: conditionalScale(6, 7, 8, 10),
    borderWidth: moderateScale(1),
    borderColor: '#e5e7eb',
  },

  DRC_textButtonText: {
    fontSize: conditionalFontScale(12, 12.5, 13, 14),
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  DRC_disabledButton: {
    opacity: 0.5,
  },

  DRC_disabledText: {
    color: '#9ca3af',
  },

  // Animations
  DRC_spinning: {
    transform: [{rotate: '45deg'}],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  //  ADD THESE STYLES to your existing styles.js DynamicRequestCard (DRC_) section
  // ─────────────────────────────────────────────────────────────────────────────

  // Modal overlay — covers full screen, transparent, lets touches pass to close
  DRC_modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // ── Footer layout ──
  DRC_footer2: {
    paddingTop: conditionalVerticalScale(3, 3.5, 4, 5),
  },

  DRC_footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(2, 2, 2, 2),
    paddingBottom: conditionalVerticalScale(2, 2, 2, 2),
  },

  DRC_footerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(6, 7, 8, 10),
  },

  DRC_footerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  DRC_footerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },

  // ── Expand arrow button ──
  DRC_expandArrowButton: {
    paddingVertical: conditionalVerticalScale(5, 5.5, 6, 7),
    paddingHorizontal: conditionalScale(14, 15, 16, 18),
  },

  // ── Approval button (pill trigger) ──
  DRC_approvalButton2: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: conditionalScale(18, 19, 20, 22),
    borderWidth: moderateScale(1.5),
    borderColor: brand.primary,
    paddingVertical: conditionalVerticalScale(4, 4.5, 5, 6),
    paddingHorizontal: conditionalScale(10, 11, 12, 14),
    backgroundColor: brand.primary,
  },

  DRC_approvalButtonDisabled: {
    borderColor: '#d1d5db',
    opacity: 0.5,
  },

  DRC_approvalButtonText2: {
    fontSize: conditionalFontScale(12, 12.5, 13, 14),
    fontWeight: '600',
    color: '#ffffff',
  },

  DRC_approvalButtonTextDisabled: {
    color: '#d1d5db',
  },

  // ── Approval dropdown panel ──
  DRC_approvalDropdownMenu: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: conditionalScale(10, 11, 12, 12), // was (10,11,12,14) — cap xlarge
    paddingVertical: conditionalVerticalScale(3, 3.5, 4, 4), // was (3,3.5,4,5)
    minWidth: 180,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOpacity: 0.14,
        shadowOffset: {width: 0, height: moderateScale(6)},
        shadowRadius: moderateScale(16),
      },
      android: {
        elevation: moderateScale(10),
      },
    }),
    borderWidth: moderateScale(1),
    borderColor: '#f3f4f6',
    overflow: 'hidden',
    // minWidth: conditionalScale(140, 150, 160, 180),
  },

  DRC_approvalDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: conditionalVerticalScale(10, 11, 12, 14),
    paddingHorizontal: conditionalScale(14, 15, 16, 18),
  },

  DRC_approvalDropdownItemBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#f3f4f6',
  },

  DRC_approvalDropdownIconWrap: {
    width: conditionalScale(24, 26, 28, 30),
    height: conditionalScale(24, 26, 28, 30),
    borderRadius: conditionalScale(6, 7, 8, 10),
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: conditionalScale(8, 9, 10, 12),
  },

  DRC_approvalDropdownItemText: {
    fontSize: conditionalFontScale(13, 13.5, 14, 15),
    fontWeight: '500',
    color: '#374151',
  },

  // ==================================================================================================================
  // END OF SCREEN - RESPONSIVE SCREEN STYLES
  // ==================================================================================================================

  // ==================================================================================================================
  // START OF COMPONENT - RESPONSIVE COMPONENT STYLES
  // ==================================================================================================================

  // ============================================
  // ACTION PANE CONTAINER - RESPONSIVE STYLES
  // ============================================
  APCont_container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  APCont_content: {
    flex: 1,
  },

  APCont_floatingPlusButtonContainer: {
    position: 'absolute',
    bottom: conditionalVerticalScale(65, 70, 75, 85),
    right: conditionalScale(16, 20, 24, 28),
    zIndex: 1000,
  },

  APCont_floatingPlusButton: {
    width: conditionalScale(52, 56, 60, 68),
    height: conditionalScale(52, 56, 60, 68),
    borderRadius: conditionalScale(26, 28, 30, 34),
    backgroundColor: brand.primary,
    borderWidth: moderateScale(4),
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 6,
    bottom: 40,
  },

  APCont_plusIcon: {
    fontSize: iconSize.sm,
    color: '#ffffff',
  },

  APCont_customTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: conditionalVerticalScale(6, 8, 9, 10),
    minHeight: conditionalVerticalScale(44, 48, 52, 56),
  },

  //

  APCont_pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(14, 16, 18, 20),
    paddingVertical: conditionalVerticalScale(8, 9, 10, 11),
    backgroundColor: brand.primary,
    gap: conditionalScale(8, 10, 12, 14),
  },

  APCont_pageTitleText: {
    flex: 1,
    fontSize: conditionalFontScale(13, 14, 15, 16),
    fontWeight: '700',
    color: '#ffffff',
  },

  APCont_pageTitleCenteredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },

  APCont_pageTitleCenteredText: {
    color: '#ffffff',
    fontSize: conditionalFontScale(12, 14, 16, 18),
    fontWeight: 'bold',
    textAlign: 'center',
  },

  SearchBar_row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(8, 10, 12, 14),
  },

  SearchBar_inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: moderateScale(1),
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: conditionalScale(10, 11, 12, 14),
    height: conditionalVerticalScale(34, 36, 38, 42),
  },
  SearchBar_input: {
    flex: 1,
    fontSize: conditionalFontScale(13, 14, 15, 16),
    color: '#ffffff',
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },

  SearchBar_searchIcon: {
    marginRight: conditionalScale(7, 8, 9, 10),
  },

  SearchBar_clearButton: {
    paddingLeft: conditionalScale(6, 7, 8, 9),
    justifyContent: 'center',
    alignItems: 'center',
  },

  SearchBar_rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(12, 14, 16, 18),
  },

  SearchBar_flaskButton: {
    width: conditionalScale(28, 30, 32, 36),
    height: conditionalScale(28, 30, 32, 36),
    borderRadius: borderRadius.md,
    borderWidth: moderateScale(1),
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  SearchBar_flaskButtonActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },

  SearchBar_activeDot: {
    position: 'absolute',
    top: conditionalVerticalScale(5, 6, 6, 7),
    right: conditionalScale(5, 6, 6, 7),
    width: conditionalScale(6, 7, 7, 8),
    height: conditionalScale(6, 7, 7, 8),
    borderRadius: conditionalScale(3, 3.5, 3.5, 4),
    backgroundColor: '#fff',
    borderWidth: moderateScale(1),
    borderColor: brand.primary,
  },

  SearchBar_modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  SearchBar_dropdown: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    minWidth: conditionalScale(180, 190, 200, 220),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: moderateScale(4)},
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(8),
    elevation: 8,
    borderWidth: moderateScale(1),
    borderColor: '#E5E7EB',
  },

  SearchBar_dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(14, 15, 16, 18),
    paddingVertical: conditionalVerticalScale(11, 12, 13, 15),
  },

  SearchBar_dropdownItemBorder: {
    borderBottomWidth: moderateScale(1),
    borderBottomColor: '#F3F4F6',
  },

  SearchBar_dropdownItemActive: {
    backgroundColor: '#EBF5FF',
  },

  SearchBar_dropdownIcon: {
    marginRight: conditionalScale(10, 11, 12, 13),
    width: conditionalScale(16, 17, 18, 19),
  },

  SearchBar_dropdownText: {
    flex: 1,
    fontSize: conditionalFontScale(13, 13.5, 14, 15),
    color: '#374151',
    fontWeight: '500',
  },

  SearchBar_dropdownTextActive: {
    color: brand.primary,
    fontWeight: '600',
  },

  // ============================================
  // TAB NAVIGATOR - RESPONSIVE STYLES
  // ============================================
  TNav_TabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: brand.primary,
    height: conditionalVerticalScale(56, 60, 64, 70),
    borderTopColor: '#ccc',
    borderColor: brand.primary,
    borderTopWidth: moderateScale(3),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingBottom: conditionalVerticalScale(3, 4, 5, 6),
  },

  TNav_TabLabel: {
    fontSize: conditionalFontScale(10, 11, 12, 13),
    fontWeight: '600',
    marginTop: conditionalVerticalScale(1, 2, 2, 3),
    color: 'white',
    textAlign: 'center',
  },

  TNav_TabBarO: {
    backgroundColor: brand.primary,
    height: conditionalVerticalScale(56, 60, 64, 70),
    borderColor: brand.primary,
    borderTopWidth: moderateScale(3),
    paddingBottom: conditionalVerticalScale(3, 4, 5, 6),
  },

  TNav_TabLabelO: {
    fontSize: conditionalFontScale(10, 11, 12, 13),
    fontWeight: '600',
    marginTop: conditionalVerticalScale(1, 2, 2, 3),
    color: 'white',
  },

  // ============================================
  // CUSTOM TAB BAR - RESPONSIVE STYLES
  // ============================================

  TabBar_container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: conditionalVerticalScale(6, 8, 10, 12),
    backgroundColor: brand.primary,
    borderTopWidth: moderateScale(0.5),
    borderTopColor: 'rgba(0,0,0,0.1)',
  },

  TabBar_tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  TabBar_label: {
    fontSize: conditionalFontScale(10, 11, 12, 14),
    marginTop: conditionalVerticalScale(2, 3, 4, 5),
    color: '#ffffff',
  },

  TabBar_labelActive: {
    fontWeight: '600',
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
    width: conditionalScale(280, 320, 350, 350),
    height: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: conditionalScale(-3, -4, -5, -6), height: 0},
    shadowOpacity: 0.1,
    shadowRadius: conditionalScale(10, 12, 14, 16),
    elevation: 20,
  },

  notif_Header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(16, 20, 22, 26),
    paddingVertical: conditionalVerticalScale(12, 16, 18, 20),
    backgroundColor: brand.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#0c5298',
  },

  notif_HeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  notif_BellIcon: {
    fontSize: iconSize.md,
    color: '#ffffff',
  },

  notif_HeaderTitle: {
    fontSize: conditionalFontScale(16, 18, 19, 19),
    fontWeight: '700',
    color: '#ffffff',
  },

  notif_HeaderCount: {
    fontSize: conditionalFontScale(11, 12, 13, 14),
    color: '#e2e8f0',
    marginTop: conditionalVerticalScale(1, 2, 2, 3),
  },

  notif_HeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  notif_MarkAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: conditionalScale(10, 12, 14, 16),
    paddingVertical: conditionalVerticalScale(5, 6, 7, 8),
    borderRadius: borderRadius.lg,
    gap: conditionalScale(5, 6, 7, 8),
    marginRight: conditionalScale(40, 45, 48, 52),
  },

  notif_MarkAllButtonDisabled: {
    opacity: 0.5,
  },

  notif_MarkAllIcon: {
    fontSize: iconSize.xs,
    color: '#ffffff',
  },

  notif_MarkAllText: {
    fontSize: conditionalFontScale(11, 12, 13, 14),
    fontWeight: '600',
    color: '#ffffff',
  },

  notif_RefreshButton: {
    width: conditionalScale(32, 36, 38, 42),
    height: conditionalScale(32, 36, 38, 42),
    borderRadius: conditionalScale(16, 18, 19, 21),
    justifyContent: 'center',
    alignItems: 'center',
  },

  notif_RefreshIcon: {
    fontSize: iconSize.sm,
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
    paddingHorizontal: conditionalScale(16, 20, 22, 26),
    paddingVertical: conditionalVerticalScale(10, 12, 13, 15),
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  notif_SectionTitle: {
    fontSize: conditionalFontScale(13, 14, 15, 16),
    fontWeight: '600',
    color: '#475569',
  },

  notif_CountBadge: {
    backgroundColor: '#e2e8f0',
    borderRadius: borderRadius.sm,
    paddingHorizontal: conditionalScale(7, 8, 9, 10),
    paddingVertical: conditionalVerticalScale(1, 2, 2, 3),
    minWidth: conditionalScale(22, 24, 26, 28),
  },

  notif_CountText: {
    fontSize: conditionalFontScale(11, 12, 13, 14),
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },

  notif_NotificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: conditionalScale(16, 20, 22, 26),
    paddingVertical: conditionalVerticalScale(12, 16, 18, 20),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },

  notif_NotificationItemToday: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 2,
    borderLeftColor: brand.primary,
  },

  notif_NotificationItemRead: {
    backgroundColor: '#fafafa',
    opacity: 0.8,
  },

  notif_LogoContainer: {
    position: 'relative',
    marginRight: spacing.sm,
  },

  notif_IconContainer: {
    width: conditionalScale(40, 44, 48, 52),
    height: conditionalScale(40, 44, 48, 52),
    borderRadius: conditionalScale(20, 22, 24, 26),
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },

  notif_NotificationIcon: {
    fontSize: iconSize.sm,
    color: brand.primary,
  },

  notif_NotificationIconToday: {
    color: '#0369a1',
  },

  notif_MarkReadButtonContainer: {
    position: 'absolute',
    bottom: conditionalVerticalScale(-3, -4, -4, -5),
    right: conditionalScale(-3, -4, -4, -5),
    zIndex: 1,
  },

  notif_MarkReadButton: {
    width: conditionalScale(10, 12, 13, 14),
    height: conditionalScale(10, 12, 13, 14),
    borderRadius: conditionalScale(5, 6, 6.5, 7),
    backgroundColor: brand.primary,
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
    backgroundColor: brand.primary,
  },

  notif_MarkReadButtonRead: {
    backgroundColor: '#94a3b8',
  },

  notif_MarkReadButtonDisabled: {
    opacity: 0.5,
  },

  notif_MarkReadIcon: {
    fontSize: conditionalFontScale(3, 4, 4, 5),
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
    fontSize: conditionalFontScale(14, 15, 16, 16),
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: conditionalVerticalScale(3, 4, 5, 6),
  },

  notif_NotificationTitleToday: {
    color: brand.primary,
  },

  notif_NotificationMessage: {
    fontSize: conditionalFontScale(13, 14, 15, 16),
    color: '#64748b',
    lineHeight: conditionalFontScale(18, 20, 22, 24),
    marginBottom: conditionalVerticalScale(3, 4, 5, 6),
  },

  notif_NotificationMessageToday: {
    color: '#475569',
  },

  notif_NotificationTime: {
    fontSize: conditionalFontScale(11, 12, 13, 14),
    color: '#94a3b8',
  },

  notif_NotificationTimeToday: {
    color: brand.primary,
  },

  notif_EmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: conditionalVerticalScale(70, 80, 90, 100),
  },

  notif_EmptyIcon: {
    fontSize: conditionalFontScale(48, 56, 60, 68),
    color: '#cbd5e1',
    marginBottom: conditionalVerticalScale(12, 16, 18, 20),
  },

  notif_EmptyText: {
    fontSize: conditionalFontScale(15, 16, 17, 19),
    color: '#64748b',
  },

  notif_CloseButton: {
    position: 'absolute',
    top: conditionalVerticalScale(12, 16, 18, 20),
    right: conditionalScale(16, 20, 22, 26),
    width: conditionalScale(32, 36, 38, 42),
    height: conditionalScale(32, 36, 38, 42),
    borderRadius: conditionalScale(16, 18, 19, 21),
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
    fontSize: iconSize.xs,
    color: '#64748b',
  },

  // ============================================
  // MAIN PAGE HEADER (MPH_) - RESPONSIVE STYLES
  // ============================================
  MPH_leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: conditionalScale(8, 10, 12, 14),
  },
  MPH_leftSide: {
    padding: conditionalScale(6, 7, 8, 10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  MPH_title: {
    fontSize: conditionalFontScale(16, 17, 18, 20),
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: conditionalScale(6, 8, 10, 12),
    letterSpacing: 0.3,
  },
  MPH_rightSideView: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: conditionalScale(6, 8, 10, 12),
    gap: conditionalScale(2, 3, 4, 6),
  },
  MPH_dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: conditionalScale(8, 9, 10, 12),
    paddingVertical: conditionalVerticalScale(4, 5, 6, 7),
    borderRadius: borderRadius.md,
    maxWidth: conditionalScale(80, 90, 100, 120),
  },
  MPH_dropdownText: {
    color: '#FFFFFF',
    fontSize: conditionalFontScale(10, 11, 11, 12),
    fontWeight: '600',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  MPH_dropdownIcon: {
    marginLeft: conditionalScale(3, 4, 4, 5),
  },

  // ============================================
  // NOTIFICATION BUTTON (NB_) - RESPONSIVE STYLES
  // ============================================
  NB_button: {
    padding: conditionalScale(6, 7, 8, 10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  NB_iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  NB_badgeContainer: {
    position: 'absolute',
    top: conditionalVerticalScale(-6, -7, -8, -9),
    right: conditionalScale(-6, -7, -8, -9),
    backgroundColor: '#FF3B30',
    borderRadius: borderRadius.round,
    minWidth: conditionalScale(16, 17, 18, 20),
    height: conditionalVerticalScale(16, 17, 18, 20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(3, 3, 4, 4),
    borderWidth: 1.5,
    borderColor: brand.primary,
  },
  NB_badgeText: {
    color: '#FFFFFF',
    fontSize: conditionalFontScale(9, 9, 10, 11),
    fontWeight: '800',
  },

  // ====================================================
  // LOGOUT BUTTON COMPONENT - RESPONSIVE STYLES
  // ====================================================
  LgOut_ButtonContainer: {
    marginRight: conditionalScale(8, 10, 12, 14),
  },

  // ============================================
  // COMPANY DROPDOWN (CD_) - RESPONSIVE STYLES
  // ============================================
  CD_Overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  CD_DropdownContainer: {
    position: 'absolute',
    top: conditionalVerticalScale(56, 60, 64, 70),
    right: conditionalScale(10, 12, 14, 16),
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  CD_DropdownContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    width: conditionalScale(200, 220, 240, 270),
    maxHeight: conditionalVerticalScale(260, 280, 300, 340),
    overflow: 'hidden',
  },
  CD_DropdownTitle: {
    fontSize: conditionalFontScale(13, 14, 14, 15),
    fontWeight: '700',
    color: '#1A1A2E',
    paddingHorizontal: conditionalScale(14, 16, 16, 18),
    paddingVertical: conditionalVerticalScale(10, 12, 12, 14),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  CD_ScrollView: {
    maxHeight: conditionalVerticalScale(180, 200, 220, 260),
  },
  CD_CompanyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: conditionalScale(14, 16, 16, 18),
    paddingVertical: conditionalVerticalScale(10, 12, 12, 14),
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  CD_SelectedCompanyItem: {
    backgroundColor: '#EBF4FF',
  },
  CD_FirstSelectedItem: {
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },
  CD_LastSelectedItem: {
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },
  CD_CompanyInfo: {
    flex: 1,
  },
  CD_CompanyName: {
    fontSize: conditionalFontScale(12, 13, 13, 14),
    fontWeight: '600',
    color: '#333333',
  },
  CD_SelectedCompanyName: {
    color: brand.primary,
  },
  CD_CheckIcon: {
    marginLeft: conditionalScale(6, 8, 8, 10),
  },
  CD_NoDataText: {
    fontSize: conditionalFontScale(12, 13, 13, 14),
    color: '#888888',
    textAlign: 'center',
    paddingVertical: conditionalVerticalScale(14, 16, 18, 20),
  },

  // ============================================
  // ALERT MODAL COMPONENT - RESPONSIVE STYLES
  // ============================================

  Alert_overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },

  Alert_iconContainer: {
    alignItems: 'center',
    marginBottom: conditionalVerticalScale(16, 20, 22, 26),
  },

  Alert_iconBackground: {
    width: conditionalScale(56, 60, 64, 72),
    height: conditionalScale(56, 60, 64, 72),
    borderRadius: conditionalScale(28, 30, 32, 36),
    justifyContent: 'center',
    alignItems: 'center',
  },

  Alert_iconSize: conditionalFontScale(26, 28, 30, 34),

  Alert_modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    paddingVertical: conditionalVerticalScale(24, 28, 30, 34),
    paddingHorizontal: spacing.md,
    width: '100%',
    maxWidth: conditionalScale(300, 320, 340, 420),
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {width: 0, height: moderateScale(16)},
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(20),
    elevation: 20,
  },

  Alert_contentContainer: {
    alignItems: 'center',
    marginBottom: conditionalVerticalScale(16, 20, 22, 26),
    width: '100%',
  },

  Alert_heading: {
    fontSize: conditionalFontScale(16, 18, 20, 22),
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: conditionalVerticalScale(8, 10, 12, 14),
    lineHeight: conditionalFontScale(24, 26, 28, 32),
  },

  Alert_description: {
    fontSize: conditionalFontScale(13, 14, 15, 16),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: conditionalFontScale(18, 20, 22, 24),
  },

  Alert_button: {
    width: '100%',
    paddingVertical: conditionalVerticalScale(12, 14, 16, 18),
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: conditionalVerticalScale(44, 48, 52, 56),

    shadowColor: '#000',
    shadowOffset: {width: 0, height: moderateScale(4)},
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(8),
    elevation: 8,
  },

  Alert_buttonText: {
    fontSize: conditionalFontScale(14, 15, 16, 18),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ===================================================
  // LOGOUT ALERT MODAL COMPONENT - RESPONSIVE STYLES
  // ===================================================

  LogoutAlert_overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },

  LogoutAlert_modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    paddingVertical: conditionalVerticalScale(24, 28, 30, 34),
    paddingHorizontal: spacing.md,
    width: '100%',
    maxWidth: conditionalScale(300, 320, 340, 420),

    shadowColor: '#000',
    shadowOffset: {width: 0, height: moderateScale(16)},
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(20),
    elevation: 20,
  },

  LogoutAlert_iconContainer: {
    alignItems: 'center',
    marginBottom: conditionalVerticalScale(16, 20, 22, 26),
  },

  LogoutAlert_warningIcon: {
    width: conditionalScale(56, 60, 64, 72),
    height: conditionalScale(56, 60, 64, 72),
    borderRadius: conditionalScale(28, 30, 32, 36),
    backgroundColor: '#FEF3E7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: moderateScale(2),
    borderColor: '#F59E0B',
  },

  LogoutAlert_warningIconText: {
    fontSize: conditionalFontScale(24, 26, 28, 32),
    fontWeight: '700',
    color: '#F59E0B',
  },

  LogoutAlert_contentContainer: {
    alignItems: 'center',
    marginBottom: conditionalVerticalScale(16, 18, 20, 24),
  },

  LogoutAlert_heading: {
    fontSize: conditionalFontScale(16, 18, 20, 22),
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: conditionalFontScale(22, 24, 26, 28),
  },

  LogoutAlert_buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  LogoutAlert_button: {
    flex: 1,
    paddingVertical: conditionalVerticalScale(12, 14, 16, 18),
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: conditionalVerticalScale(44, 48, 52, 56),
  },

  LogoutAlert_cancelButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: moderateScale(1.5),
    borderColor: '#E5E7EB',
  },

  LogoutAlert_confirmButton: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: {width: 0, height: moderateScale(4)},
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(8),
    elevation: 8,
  },

  LogoutAlert_cancelButtonText: {
    fontSize: conditionalFontScale(14, 15, 16, 18),
    fontWeight: '600',
    color: '#6B7280',
  },

  LogoutAlert_confirmButtonText: {
    fontSize: conditionalFontScale(14, 15, 16, 18),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ===================================================
  // ALERT DELETE MODAL COMPONENT - RESPONSIVE STYLES
  // ===================================================

  DeleteAlert_overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },

  DeleteAlert_iconContainer: {
    alignItems: 'center',
    marginBottom: conditionalVerticalScale(16, 20, 22, 26),
  },

  DeleteAlert_iconBackground: {
    width: conditionalScale(56, 60, 64, 72),
    height: conditionalScale(56, 60, 64, 72),
    borderRadius: conditionalScale(28, 30, 32, 36),
    justifyContent: 'center',
    alignItems: 'center',
  },

  DeleteAlert_iconSize: conditionalFontScale(26, 28, 30, 34),

  DeleteAlert_modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    paddingVertical: conditionalVerticalScale(24, 28, 30, 34),
    paddingHorizontal: spacing.md,
    width: '100%',
    maxWidth: conditionalScale(300, 320, 340, 420),

    shadowColor: '#000',
    shadowOffset: {width: 0, height: moderateScale(16)},
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(20),
    elevation: 20,
  },

  DeleteAlert_contentContainer: {
    alignItems: 'center',
    marginBottom: conditionalVerticalScale(16, 20, 22, 26),
  },

  DeleteAlert_heading: {
    fontSize: conditionalFontScale(18, 20, 22, 24),
    fontWeight: '700',
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: conditionalVerticalScale(8, 10, 12, 14),
    lineHeight: conditionalFontScale(24, 26, 28, 32),
  },

  DeleteAlert_description: {
    fontSize: conditionalFontScale(14, 15, 16, 18),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: conditionalFontScale(20, 22, 24, 26),
    marginBottom: conditionalVerticalScale(8, 10, 12, 14),
  },

  DeleteAlert_buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  DeleteAlert_button: {
    flex: 1,
    paddingVertical: conditionalVerticalScale(12, 14, 16, 18),
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: conditionalVerticalScale(44, 48, 52, 56),
  },

  DeleteAlert_secondaryButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: moderateScale(1.5),
    borderColor: '#E5E7EB',
  },

  DeleteAlert_primaryButton: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: moderateScale(4)},
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(8),
    elevation: 8,
  },

  DeleteAlert_disabledButton: {
    opacity: 0.6,
  },

  DeleteAlert_processingButton: {
    opacity: 0.8,
  },

  DeleteAlert_secondaryButtonText: {
    fontSize: conditionalFontScale(14, 15, 16, 18),
    fontWeight: '600',
    color: '#6B7280',
  },

  DeleteAlert_primaryButtonText: {
    fontSize: conditionalFontScale(14, 15, 16, 18),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  DeleteAlert_processingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },

  // ====================================================
  // CONFIRMATION ALERT COMPONENT - RESPONSIVE STYLES
  // ====================================================

  ConfAlert_overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },

  ConfAlert_modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.xl,
    paddingVertical: conditionalVerticalScale(24, 28, 30, 34),
    paddingHorizontal: spacing.md,
    width: '100%',
    maxWidth: conditionalScale(300, 320, 340, 420),
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {width: 0, height: moderateScale(16)},
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(20),
    elevation: 20,
  },

  ConfAlert_iconContainer: {
    alignItems: 'center',
    marginBottom: conditionalVerticalScale(16, 20, 22, 26),
  },

  ConfAlert_iconBackground: {
    width: conditionalScale(56, 60, 64, 72),
    height: conditionalScale(56, 60, 64, 72),
    borderRadius: conditionalScale(28, 30, 32, 36),
    justifyContent: 'center',
    alignItems: 'center',
  },

  ConfAlert_iconSize: conditionalFontScale(26, 28, 30, 34),

  ConfAlert_contentContainer: {
    alignItems: 'center',
    marginBottom: conditionalVerticalScale(16, 20, 22, 26),
    width: '100%',
  },

  ConfAlert_heading: {
    fontSize: conditionalFontScale(18, 20, 22, 24),
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: conditionalVerticalScale(8, 10, 12, 14),
    lineHeight: conditionalFontScale(24, 26, 28, 32),
  },

  ConfAlert_description: {
    fontSize: conditionalFontScale(14, 15, 16, 18),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: conditionalFontScale(20, 22, 24, 26),
  },

  ConfAlert_buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },

  ConfAlert_button: {
    flex: 1,
    paddingVertical: conditionalVerticalScale(12, 14, 16, 18),
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: conditionalVerticalScale(44, 48, 52, 56),
  },

  ConfAlert_secondaryButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: moderateScale(1.5),
    borderColor: '#E5E7EB',
  },

  ConfAlert_primaryButton: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: moderateScale(4)},
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(8),
    elevation: 8,
  },

  ConfAlert_secondaryButtonText: {
    fontSize: conditionalFontScale(14, 15, 16, 18),
    fontWeight: '600',
    color: '#6B7280',
  },

  ConfAlert_primaryButtonText: {
    fontSize: conditionalFontScale(14, 15, 16, 18),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // =================================================
  // LANGUAGE MODAL COMPONENT - RESPONSIVE STYLES
  // =================================================

  LanguageModal_overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  LanguageModal_modal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: conditionalVerticalScale(16, 20, 22, 26),
    paddingBottom: conditionalVerticalScale(20, 24, 28, 32),
    minHeight: conditionalVerticalScale(260, 300, 340, 420),
  },

  LanguageModal_header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: conditionalVerticalScale(16, 20, 22, 26),
  },

  LanguageModal_heading: {
    fontSize: conditionalFontScale(18, 20, 22, 24),
    fontWeight: '700',
    color: '#000000',
  },

  LanguageModal_closeButton: {
    padding: spacing.xs,
  },

  LanguageModal_languageList: {
    marginBottom: conditionalVerticalScale(16, 20, 24, 28),
  },

  LanguageModal_languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: conditionalVerticalScale(12, 14, 16, 18),
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: '#F8F9FA',
  },

  LanguageModal_selectedItem: {
    backgroundColor: '#EEF2FF',
    borderWidth: moderateScale(2),
    borderColor: brand.primary,
  },

  LanguageModal_languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  LanguageModal_languageName: {
    fontSize: conditionalFontScale(16, 18, 20, 22),
    fontWeight: '600',
    color: '#000000',
    marginEnd: spacing.xs,
  },

  LanguageModal_languageSubname: {
    fontSize: conditionalFontScale(13, 14, 15, 16),
    color: '#666666',
  },

  LanguageModal_buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  LanguageModal_button: {
    flex: 1,
    paddingVertical: conditionalVerticalScale(12, 14, 16, 18),
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  LanguageModal_cancelButton: {
    backgroundColor: '#F1F1F1',
  },

  LanguageModal_cancelButtonText: {
    fontSize: conditionalFontScale(14, 15, 16, 18),
    fontWeight: '600',
    color: '#666666',
  },

  // ============================================
  // CUSTOM INDICATOR COMPONENT - RESPONSIVE STYLES
  // ============================================

  CustomIndicator_container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  CustomIndicator_innerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ============================================
  // LEAVE ENTITLEMENT PROGRESS - RESPONSIVE STYLES
  // ============================================

  LeaveEnt_container: {
    marginVertical: conditionalVerticalScale(12, 16, 20, 24),
  },

  LeaveEnt_header: {
    marginBottom: conditionalVerticalScale(12, 16, 20, 24),
    borderLeftWidth: moderateScale(4),
    borderLeftColor: '#4CAF50',
    paddingLeft: spacing.sm,
  },

  LeaveEnt_title: {
    fontSize: conditionalFontScale(18, 20, 22, 24),
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: conditionalVerticalScale(2, 4, 6, 8),
  },

  LeaveEnt_subtitle: {
    fontSize: conditionalFontScale(12, 13, 14, 16),
    color: '#757575',
    fontWeight: '500',
  },

  LeaveEnt_scrollContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },

  LeaveEnt_scrollContent: {
    paddingVertical: conditionalVerticalScale(6, 8, 10, 12),
  },

  LeaveEnt_leaveItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    minWidth: conditionalScale(140, 160, 180, 220),
  },

  LeaveEnt_progressSection: {
    alignItems: 'center',
    marginBottom: conditionalVerticalScale(12, 16, 20, 24),
  },

  LeaveEnt_semiCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: conditionalVerticalScale(60, 75, 90, 110),
    marginBottom: conditionalVerticalScale(6, 8, 10, 12),
    position: 'relative',
  },

  LeaveEnt_svg: {
    position: 'absolute',
    top: 0,
  },

  LeaveEnt_centerText: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'baseline',
    bottom: conditionalVerticalScale(6, 8, 10, 12),
  },

  LeaveEnt_takenText: {
    fontSize: conditionalFontScale(16, 18, 20, 22),
    fontWeight: '700',
    color: '#1A1A1A',
  },

  LeaveEnt_divider: {
    fontSize: conditionalFontScale(12, 14, 16, 18),
    fontWeight: '400',
    color: '#BDBDBD',
    marginHorizontal: spacing.xs,
  },

  LeaveEnt_totalText: {
    fontSize: conditionalFontScale(12, 14, 16, 18),
    fontWeight: '600',
    color: '#757575',
  },

  LeaveEnt_baseLine: {
    position: 'absolute',
    bottom: 0,
    height: moderateScale(2),
    backgroundColor: '#D1D1D1',
  },

  LeaveEnt_leaveLabel: {
    fontSize: conditionalFontScale(12, 13, 14, 16),
    fontWeight: '700',
    textAlign: 'center',
    marginTop: conditionalVerticalScale(2, 4, 6, 8),
  },

  LeaveEnt_statsBox: {
    width: '100%',
    backgroundColor: '#F3F3F3',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: conditionalVerticalScale(6, 8, 10, 12),
  },

  LeaveEnt_statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  LeaveEnt_stat: {
    alignItems: 'center',
    flex: 1,
  },

  LeaveEnt_statLabel: {
    fontSize: conditionalFontScale(6, 7, 8, 9),
    color: '#9E9E9E',
    fontWeight: '600',
    marginBottom: conditionalVerticalScale(2, 3, 4, 5),
    letterSpacing: 0.5,
  },

  LeaveEnt_statValue: {
    fontSize: conditionalFontScale(14, 15, 16, 18),
    fontWeight: '700',
  },

  LeaveEnt_unitBadge: {
    backgroundColor: '#EBEBEB',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },

  LeaveEnt_unitText: {
    fontSize: conditionalFontScale(8, 9, 10, 12),
    color: '#757575',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  LeaveEnt_itemDivider: {
    width: moderateScale(1),
    height: '80%',
    backgroundColor: '#E0E0E0',
    marginHorizontal: spacing.sm,
    alignSelf: 'center',
  },

  LeaveEnt_arrowButton: {
    position: 'absolute',
    top: '55%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  LeaveEnt_leftArrow: {
    left: spacing.sm,
  },

  LeaveEnt_rightArrow: {
    right: spacing.sm,
  },

  LeaveEnt_loadingText: {
    textAlign: 'center',
    color: '#757575',
    fontSize: conditionalFontScale(13, 14, 15, 16),
    marginTop: conditionalVerticalScale(16, 20, 24, 28),
  },

  LeaveEnt_noDataText: {
    textAlign: 'center',
    color: '#9E9E9E',
    fontSize: conditionalFontScale(13, 14, 15, 16),
    marginTop: conditionalVerticalScale(8, 12, 16, 20),
    fontStyle: 'italic',
  },

  // ============================================
  // AI FLOATING BUTTON - RESPONSIVE STYLES
  // ============================================

  AIFloat_container: {
    backgroundColor: brand.primary,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: moderateScale(4)},
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(8),
    elevation: 8,
    overflow: 'hidden',
  },

  AIFloat_button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },

  AIFloat_text: {
    color: '#FFFFFF',
    fontSize: conditionalFontScale(14, 16, 18, 20),
    fontWeight: '700',
    textAlign: 'center',
  },

  // ============================================
  // AI CHATBOT - COMPLETE RESPONSIVE STYLES
  // ============================================

  AIChat_overlay: {
    flex: 1,
  },

  AIChat_container: {
    flex: 1,
  },

  AIChat_backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  AIChat_sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: conditionalVerticalScale(80, 90, 110),
    backgroundColor: '#F3F6F8',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -moderateScale(4)},
    shadowOpacity: 0.15,
    shadowRadius: moderateScale(12),
    elevation: 20,
  },

  /* ---------- Header ---------- */

  AIChat_header: {
    paddingTop:
      Platform.OS === 'ios'
        ? conditionalVerticalScale(44, 50, 56)
        : conditionalVerticalScale(14, 16, 20),
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: moderateScale(1),
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },

  AIChat_headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  AIChat_headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  AIChat_iconContainer: {
    width: conditionalScale(40, 44, 48),
    height: conditionalScale(40, 44, 48),
    borderRadius: conditionalScale(20, 22, 24),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    position: 'relative',
  },

  AIChat_statusDot: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: '#00D084',
    position: 'absolute',
    bottom: scale(2),
    right: scale(2),
    borderWidth: moderateScale(2),
    borderColor: brand.primary,
  },

  AIChat_headerText: {
    flex: 1,
  },

  AIChat_title: {
    fontSize: conditionalFontScale(16, 18, 20),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  AIChat_status: {
    fontSize: conditionalFontScale(11, 12, 13),
    marginTop: verticalScale(1),
    color: '#FFFFFF',
  },

  AIChat_closeButton: {
    width: conditionalScale(32, 36, 40),
    height: conditionalScale(32, 36, 40),
    borderRadius: conditionalScale(16, 18, 20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ---------- Chat Area ---------- */

  AIChat_chatArea: {
    flex: 1,
    backgroundColor: '#F3F6F8',
  },

  AIChat_chatContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },

  AIChat_messageWrapper: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
    alignItems: 'flex-end',
  },

  AIChat_botWrapper: {
    justifyContent: 'flex-start',
  },

  AIChat_userWrapper: {
    justifyContent: 'flex-end',
  },

  AIChat_avatarContainer: {
    marginHorizontal: spacing.xs,
  },

  AIChat_avatar: {
    width: conditionalScale(32, 36, 40),
    height: conditionalScale(32, 36, 40),
    borderRadius: conditionalScale(16, 18, 20),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: moderateScale(2)},
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(3),
    elevation: 4,
  },

  AIChat_bubbleContainer: {
    maxWidth: '75%',
  },

  AIChat_userBubbleContainer: {
    alignItems: 'flex-end',
  },

  AIChat_bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: moderateScale(1)},
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(2),
    elevation: 1,
  },

  AIChat_messageText: {
    fontSize: conditionalFontScale(13, 14, 15),
    color: '#1F2937',
    lineHeight: conditionalVerticalScale(18, 20, 22),
  },

  AIChat_timestamp: {
    fontSize: conditionalFontScale(9, 10, 11),
    marginTop: spacing.xs,
  },

  AIChat_botBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(4),
    marginLeft: spacing.xs,
  },

  AIChat_userBubble: {
    backgroundColor: brand.primary,
    borderTopRightRadius: moderateScale(4),
    marginRight: spacing.xs,
  },

  AIChat_typingBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(4),
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginLeft: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },

  AIChat_userMessageText: {
    color: '#FFFFFF',
  },

  AIChat_userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },

  AIChat_typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  AIChat_typingText: {
    fontSize: conditionalFontScale(13, 14, 15),
    color: '#6B7280',
    marginLeft: spacing.sm,
    fontWeight: '500',
  },

  /* ---------- Recording Overlay ---------- */

  AIChat_recordingOverlay: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    height: conditionalVerticalScale(110, 120, 140),
    backgroundColor: 'rgba(10,102,194,0.95)',
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: brand.primary,
    shadowOffset: {width: 0, height: moderateScale(8)},
    shadowOpacity: 0.4,
    shadowRadius: moderateScale(12),
    elevation: 10,
    overflow: 'hidden',
  },

  AIChat_waveContainer: {
    position: 'absolute',
    width: conditionalScale(160, 200, 240),
    height: conditionalScale(160, 200, 240),
    borderRadius: conditionalScale(80, 100, 120),
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  AIChat_recordingContent: {
    alignItems: 'center',
    zIndex: 1,
  },

  AIChat_recordingIcon: {
    width: conditionalScale(52, 56, 64),
    height: conditionalScale(52, 56, 64),
    borderRadius: conditionalScale(26, 28, 32),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  AIChat_recordingText: {
    fontSize: conditionalFontScale(20, 24, 26),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  AIChat_recordingSubtext: {
    fontSize: conditionalFontScale(12, 13, 14),
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },

  AIChat_cancelRecordingButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: conditionalScale(28, 32, 36),
    height: conditionalScale(28, 32, 36),
    borderRadius: conditionalScale(14, 16, 18),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ---------- Input Area ---------- */

  AIChat_inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: moderateScale(1),
    borderTopColor: '#E5E9F0',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom:
      Platform.OS === 'ios' ? conditionalVerticalScale(20, 22, 24) : spacing.md,
  },

  AIChat_inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  AIChat_micButton: {
    width: conditionalScale(40, 44, 48),
    height: conditionalScale(40, 44, 48),
    borderRadius: conditionalScale(20, 22, 24),
    marginRight: spacing.xs,
  },

  AIChat_micButtonActive: {
    shadowColor: '#FF4444',
    shadowOffset: {width: 0, height: moderateScale(4)},
    shadowOpacity: 0.4,
    shadowRadius: moderateScale(8),
    elevation: 8,
  },

  AIChat_micButtonDisabled: {
    opacity: 0.6,
  },

  AIChat_gradientButton: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },

  AIChat_textInputContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.xs,
    maxHeight: conditionalVerticalScale(70, 80, 90),
  },

  AIChat_input: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: conditionalFontScale(13, 14, 15),
    lineHeight: conditionalVerticalScale(18, 20, 22),
  },

  AIChat_sendButton: {
    width: conditionalScale(40, 44, 48),
    height: conditionalScale(40, 44, 48),
    borderRadius: conditionalScale(20, 22, 24),
    marginLeft: spacing.xs,
  },

  AIChat_sendButtonDisabled: {
    opacity: 0.6,
  },

  AIChat_voiceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },

  AIChat_voiceWarningText: {
    fontSize: conditionalFontScale(11, 12, 13),
    color: '#FF6B6B',
    marginLeft: spacing.xs,
    fontWeight: '500',
  },

  // ============================================
  // DYNAMIC REQUEST CARD - RESPONSIVE STYLES
  // ============================================
  DRC_CardContainer: {
    marginVertical: verticalScale(6),
    marginHorizontal: scale(4),
  },

  DRC_HighlightedContainer: {
    borderWidth: moderateScale(2),
    borderColor: '#4CAF50',
    borderRadius: borderRadius.lg,
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  DRC_Card: {
    borderRadius: borderRadius.lg,
    padding: scale(16),
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
    marginBottom: verticalScale(14),
  },

  DRC_HeaderContentWithArrow: {
    flex: 1,
    marginRight: scale(40),
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
    marginTop: verticalScale(3),
  },

  DRC_ButtonsContainer: {
    flexDirection: 'row',
    gap: scale(8),
    flexShrink: 1,
  },

  DRC_ButtonsContainerWithArrow: {
    marginRight: scale(30),
  },

  DRC_IconButton: {
    borderRadius: borderRadius.lg,
    padding: scale(9),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scale(36),
    minHeight: scale(36),
  },

  DRC_TextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: brand.primary,
    borderWidth: moderateScale(2),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(7),
    borderRadius: borderRadius.lg,
    gap: scale(6),
  },

  DRC_TextButtonText: {
    color: brand.primary,
    fontWeight: '600',
    fontSize: fontScale(14),
  },

  DRC_Disabled: {
    backgroundColor: '#BDBDBD',
    borderColor: '#BDBDBD',
    opacity: 0.6,
  },

  DRC_DisabledText: {
    color: '#999999',
  },

  DRC_InfoBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(9),
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

  DRC_ValueWithArrow: {
    marginRight: scale(30),
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
    marginVertical: verticalScale(10),
  },

  DRC_BottomContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    marginTop: verticalScale(10),
  },

  DRC_BottomButtonsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    flexDirection: 'row',
    gap: scale(8),
  },

  DRC_BottomButtonsContainerWithArrow: {
    right: scale(30),
  },

  DRC_ExpandToggle: {
    alignItems: 'center',
    padding: scale(5),
    backgroundColor: brand.primary,
    borderRadius: borderRadius.lg,
    alignSelf: 'center',
    minWidth: scale(30),
    minHeight: scale(30),
    justifyContent: 'center',
  },

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

  DRC_BottomContainerCollapsed: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingTop: verticalScale(4),
    paddingBottom: verticalScale(4),
  },

  DRC_BottomButtonsContainerCollapsed: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },

  // ============================================
  // SAVE RECORD BUTTONS - RESPONSIVE STYLES
  // ============================================
  SRBtn_Footer: {
    position: 'absolute', // ✅ Change from relative to absolute
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: conditionalVerticalScale(8, 10, 12, 14),
    paddingHorizontal: conditionalScale(6, 8, 10, 12),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFF',
    minHeight: conditionalVerticalScale(60, 65, 70, 70),
    gap: conditionalScale(6, 8, 10, 12),
    zIndex: 10, // ✅ Ensure it's above ScrollView
  },

  SRBtn_SingleButtonFooter: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  SRBtn_Button: {
    borderWidth: moderateScale(2),
    borderColor: brand.primary,
    borderRadius: borderRadius.xxl,
    paddingVertical: conditionalVerticalScale(10, 12, 14, 16),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    minWidth: conditionalScale(70, 75, 80, 85),
    minHeight: conditionalVerticalScale(40, 42, 44, 46),
  },

  SRBtn_SingleButton: {
    flex: 0.5,
    alignSelf: 'center',
    maxWidth: conditionalScale(220, 235, 250, 265),
  },

  SRBtn_SubmitButton: {
    borderColor: brand.primary,
    backgroundColor: brand.primary,
  },

  SRBtn_CancelButton: {
    borderColor: '#CCCCCC',
    backgroundColor: 'transparent',
  },

  SRBtn_DisabledButton: {
    opacity: 0.6,
  },

  SRBtn_ButtonText: {
    fontWeight: '600',
    fontSize: conditionalFontScale(12, 13, 14, 14),
    color: brand.primary,
    textAlign: 'center',
    includeFontPadding: false,
  },

  SRBtn_SubmitButtonText: {
    fontWeight: '600',
    fontSize: conditionalFontScale(10, 11, 12, 13),
    color: '#FFF',
    textAlign: 'center',
    includeFontPadding: false,
  },

  SRBtn_CancelButtonText: {
    fontWeight: '600',
    fontSize: conditionalFontScale(12, 13, 14, 15),
    color: '#666666',
    textAlign: 'center',
    includeFontPadding: false,
  },

  SRBtn_SingleButtonText: {
    fontSize: conditionalFontScale(14, 15, 16, 17),
    fontWeight: '700',
  },

  SRBtn_PressedButton: {
    backgroundColor: brand.primary,
    transform: [{scale: 0.98}],
  },

  SRBtn_pressedSubmitButton: {
    backgroundColor: '#3D95ED',
    borderColor: '#3D95ED',
    transform: [{scale: 0.98}],
  },

  SRBtn_pressedCancelButton: {
    backgroundColor: '#E6E6E6',
    transform: [{scale: 0.98}],
  },

  SRBtn_pressedText: {
    color: '#FFF',
  },

  SRBtn_pressedCancelText: {
    color: '#959595',
  },

  // ============================================
  // CALENDAR MODAL – RESPONSIVE STYLES
  // ============================================

  CalModal_modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },

  CalModal_modalContent: {
    width: '100%',
    maxWidth: conditionalScale(300, 340, 380, 460),
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',

    shadowColor: '#000',
    shadowOffset: {width: 0, height: moderateScale(10)},
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(16),
    elevation: 16,
  },

  CalModal_header: {
    paddingVertical: conditionalVerticalScale(12, 14, 16, 18),
    paddingHorizontal: spacing.lg,
    backgroundColor: brand.primary,
  },

  CalModal_headerTitle: {
    fontSize: conditionalFontScale(15, 16, 17, 19),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  CalModal_datePicker: {
    width: '100%',
    backgroundColor: '#FFFFFF',
  },

  CalModal_footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: conditionalVerticalScale(10, 12, 14, 16),
    paddingHorizontal: spacing.lg,
    borderTopWidth: moderateScale(1),
    borderTopColor: '#E5E7EB',
  },

  CalModal_cancelButton: {
    paddingVertical: conditionalVerticalScale(8, 9, 10, 12),
    paddingHorizontal: conditionalScale(14, 16, 18, 22),
    borderRadius: borderRadius.md,
    backgroundColor: '#F3F4F6',
    marginRight: spacing.sm,
  },

  CalModal_cancelButtonText: {
    fontSize: conditionalFontScale(13, 14, 15, 16),
    fontWeight: '600',
    color: '#374151',
  },

  CalModal_okButton: {
    paddingVertical: conditionalVerticalScale(8, 9, 10, 12),
    paddingHorizontal: conditionalScale(14, 16, 18, 22),
    borderRadius: borderRadius.md,
    backgroundColor: brand.primary,

    shadowColor: brand.primary,
    shadowOffset: {width: 0, height: moderateScale(3)},
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(6),
    elevation: 5,
  },

  CalModal_okButtonText: {
    fontSize: conditionalFontScale(13, 14, 15, 16),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ============================================
  // RECEIPT DETAILS MODAL – FULL & COMPLETE STYLES
  // ============================================

  RDM_ModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  RDM_ModalContainer: {
    backgroundColor: '#FFFFFF',
    height: '85%',
    padding: spacing.lg,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -moderateScale(4)},
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(10),
    elevation: 12,
  },

  /* ---------- Header ---------- */

  RDM_ModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  RDM_ModalTitle: {
    fontSize: fontScale(20),
    fontWeight: '700',
    color: '#1E293B',
  },

  RDM_CloseButton: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  RDM_CloseButtonText: {
    fontSize: fontScale(18),
    fontWeight: '600',
    color: '#475569',
  },

  /* ---------- Details ---------- */

  RDM_DetailsSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },

  RDM_SectionTitle: {
    fontSize: fontScale(15),
    fontWeight: '600',
    color: '#334155',
    marginBottom: spacing.sm,
  },

  RDM_DetailRow: {
    flexDirection: 'row',
    marginBottom: verticalScale(6),
  },

  RDM_DetailLabel: {
    width: scale(95),
    fontSize: fontScale(13),
    fontWeight: '500',
    color: '#64748B',
  },

  RDM_DetailValue: {
    flex: 1,
    fontSize: fontScale(13),
    fontWeight: '600',
    color: '#1E293B',
  },

  /* ---------- Add Receipt ---------- */

  RDM_ButtonSection: {
    marginBottom: spacing.lg,
  },

  RDM_AddButtonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  RDM_AddButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: borderRadius.md,
    paddingVertical: verticalScale(12),
    alignItems: 'center',
  },

  RDM_AddButtonText: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  RDM_DisabledButton: {
    backgroundColor: '#E2E8F0',
  },

  /* ---------- Receipts ---------- */

  RDM_ReceiptsSection: {
    flex: 1,
    marginBottom: spacing.lg,
  },

  RDM_ReceiptsScrollView: {
    flex: 1,
  },

  RDM_LoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(20),
  },

  RDM_LoadingText: {
    marginTop: verticalScale(8),
    fontSize: fontScale(13),
    color: '#64748B',
  },

  RDM_NoReceiptsText: {
    textAlign: 'center',
    fontSize: fontScale(13),
    color: '#64748B',
    paddingVertical: verticalScale(20),
    fontStyle: 'italic',
  },

  /* ---------- Receipt Item ---------- */

  RDM_ReceiptItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: verticalScale(8),
  },

  RDM_ReceiptInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },

  RDM_ReceiptName: {
    fontSize: fontScale(13),
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: verticalScale(4),
  },

  RDM_NewBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: borderRadius.xs,
    color: '#FFFFFF',
    fontSize: fontScale(10),
    fontWeight: '600',
  },

  RDM_ExistingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3B82F6',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: borderRadius.xs,
    color: '#FFFFFF',
    fontSize: fontScale(10),
    fontWeight: '600',
  },

  /* ---------- Actions ---------- */

  RDM_ReceiptActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },

  RDM_DownloadButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(8),
    borderRadius: borderRadius.xs,
    minWidth: scale(30),
    alignItems: 'center',
  },

  RDM_RemoveButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(8),
    borderRadius: borderRadius.xs,
    minWidth: scale(30),
    alignItems: 'center',
  },

  RDM_DisabledActionButton: {
    backgroundColor: '#CBD5E1',
    opacity: 0.6,
  },

  /* ---------- Footer ---------- */

  RDM_ButtonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: verticalScale(10),
  },

  RDM_CancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.md,
    paddingVertical: verticalScale(12),
    alignItems: 'center',
  },

  RDM_SaveButton: {
    flex: 1,
    backgroundColor: brand.primary,
    borderRadius: borderRadius.md,
    paddingVertical: verticalScale(12),
    alignItems: 'center',
  },

  RDM_SaveButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },

  RDM_CancelButtonText: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#475569',
  },

  RDM_SaveButtonText: {
    fontSize: fontScale(14),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ============================================
  // PROFILE PICTURE EDITOR - RESPONSIVE STYLES
  // ============================================

  PPEdit_headerContainer: {
    alignItems: 'center',
    marginBottom: conditionalVerticalScale(16, 20, 24, 28),
  },

  PPEdit_profileImageWrapper: {
    marginBottom: conditionalVerticalScale(12, 14, 16, 18),
  },

  PPEdit_profilePictureContainer: {
    position: 'relative',
  },

  PPEdit_profilePicture: {
    width: conditionalScale(120, 135, 150, 165),
    height: conditionalScale(120, 135, 150, 165),
    borderRadius: conditionalScale(60, 67.5, 75, 82.5),
    borderWidth: moderateScale(4),
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(8),
    shadowOffset: {
      width: 0,
      height: moderateScale(4),
    },
    elevation: moderateScale(5),
  },

  PPEdit_loadingContainer: {
    width: conditionalScale(120, 135, 150, 165),
    height: conditionalScale(120, 135, 150, 165),
    borderRadius: conditionalScale(60, 67.5, 75, 82.5),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  PPEdit_initialsContainer: {
    backgroundColor: '#E8E3F3',
    justifyContent: 'center',
    alignItems: 'center',
  },

  PPEdit_initialsText: {
    fontSize: conditionalFontScale(32, 36, 40, 44),
    fontWeight: '700',
    color: '#6366F1',
  },

  PPEdit_headerTitle: {
    fontSize: conditionalFontScale(20, 22, 24, 26),
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },

  PPEdit_modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  PPEdit_modalContent: {
    width: '90%',
    aspectRatio: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },

  PPEdit_modalImage: {
    width: '100%',
    height: '100%',
  },

  // ============================================
  // SAVE BUTTON - RESPONSIVE STYLES
  // ============================================

  SB_saveButton: {
    backgroundColor: brand.primary,
    paddingVertical: conditionalVerticalScale(14, 16, 18, 20),
    paddingHorizontal: conditionalScale(24, 28, 32, 36),
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: conditionalVerticalScale(20, 24, 28, 32),
    shadowColor: brand.primary,
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(8),
    shadowOffset: {
      width: 0,
      height: moderateScale(4),
    },
    elevation: moderateScale(4),
  },

  SB_saveButtonText: {
    color: '#FFFFFF',
    fontSize: conditionalFontScale(16, 17, 18, 19),
    fontWeight: '700',
  },

  // ============================================
  // DRAWER NAVIGATOR – RESPONSIVE STYLES
  // ============================================

  DNav_DrawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(20),
    minHeight: 48,
  },

  DNav_DrawerIcon: {
    width: iconSize.sm,
    height: iconSize.sm,
    marginRight: spacing.md,
    resizeMode: 'contain',
  },

  DNav_DrawerItemText: {
    fontSize: fontScale(14),
    color: '#374151',
    fontWeight: '500',
  },

  DNav_ActiveDrawerItem: {
    backgroundColor: '#E0E7FF',
    marginHorizontal: scale(12),
    borderRadius: borderRadius.md,
  },

  DNav_ActiveDrawerItemText: {
    color: '#2563EB',
    fontWeight: '600',
  },

  DNav_HeaderBackground: {
    width: '100%',
    height: verticalScale(180),
    justifyContent: 'flex-end',
    paddingBottom: spacing.md,
  },

  DNav_MaisonLogo: {
    position: 'absolute',
    top: verticalScale(14),
    left: scale(16),
    width: scale(96),
    height: verticalScale(36),
    resizeMode: 'contain',
  },

  DNav_EmpInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },

  DNav_AvatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },

  DNav_Avatar: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },

  DNav_ProfilePicture: {
    width: '100%',
    height: '100%',
    borderRadius: scale(32),
  },

  DNav_AvatarText: {
    color: '#FFFFFF',
    fontSize: fontScale(16),
    fontWeight: '600',
  },

  DNav_OnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  DNav_UserInfo: {
    flex: 1,
  },

  DNav_UserName: {
    color: '#FFFFFF',
    fontSize: fontScale(15),
    fontWeight: '600',
  },

  DNav_UserEmail: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: fontScale(11),
    marginTop: verticalScale(2),
  },

  DNav_LogoutButton: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    minHeight: 48,

    // Shadow (iOS)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 5,
  },

  DNav_LogoutIconSection: {
    backgroundColor: brand.primary,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  DNav_LogoutTextSection: {
    flex: 1,
    backgroundColor: '#084C94',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: spacing.lg,
  },

  DNav_LogoutText: {
    color: '#FFFFFF',
    fontSize: fontScale(13),
    fontWeight: '700',
    letterSpacing: 0.6,
  },

  // ============================================
  // ENTITLEMENT CARD COMPONENT – RESPONSIVE STYLES
  // ============================================

  EntCards_CardContainer: {
    marginVertical: verticalScale(10),
    marginHorizontal: scale(16),
    borderRadius: borderRadius.lg,

    // Shadow (iOS)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 6,

    // Elevation (Android)
    elevation: 4,
  },

  EntCards_Card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },

  EntCards_CardHeader: {
    borderBottomWidth: scale(1.5),
    borderBottomColor: '#FFFFFF',
    paddingBottom: verticalScale(8),
    marginBottom: verticalScale(12),
  },

  EntCards_CardHeaderText: {
    fontSize: fontScale(18),
    fontWeight: '700',
    color: '#004AAD',
    textAlign: 'center',
  },

  EntCards_CardContent: {
    flexDirection: 'column',
    rowGap: verticalScale(8),
  },

  EntCards_TextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },

  EntCards_CardTextHeading: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: '#333333',
  },

  EntCards_CardText: {
    fontSize: fontScale(14),
    fontWeight: '500',
    color: '#111111',
  },

  // ====================================================
  // DYNAMIC ATTACHMENT MODAL - RESPONSIVE STYLES
  // ====================================================

  DAM_modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  DAM_modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    height: '85%',
    padding: conditionalScale(16, 18, 20, 24),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -moderateScale(4)},
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(8),
    elevation: 10,
  },

  DAM_modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: conditionalVerticalScale(12, 14, 16, 18),
  },

  DAM_modalTitle: {
    fontSize: conditionalFontScale(16, 18, 20, 22),
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 0.3,
  },

  DAM_closeButton: {
    width: conditionalScale(26, 28, 30, 34),
    height: conditionalScale(26, 28, 30, 34),
    borderRadius: conditionalScale(13, 14, 15, 17),
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  DAM_closeButtonText: {
    fontSize: conditionalFontScale(13, 14, 16, 18),
    color: '#475569',
    fontWeight: '600',
  },

  // ── Details Section ──────────────────────────────────────────
  DAM_detailsSection: {
    backgroundColor: '#f8fafc',
    borderRadius: moderateScale(16),
    padding: conditionalScale(12, 14, 16, 20),
    marginBottom: conditionalVerticalScale(12, 14, 16, 18),
  },

  DAM_sectionTitle: {
    fontSize: conditionalFontScale(13, 14, 16, 18),
    fontWeight: '600',
    color: '#334155',
    marginBottom: conditionalVerticalScale(8, 10, 12, 14),
  },

  DAM_detailRow: {
    flexDirection: 'row',
    marginBottom: conditionalVerticalScale(5, 6, 7, 8),
    alignItems: 'center',
  },

  DAM_detailLabel: {
    fontSize: conditionalFontScale(12, 13, 14, 15),
    color: '#64748b',
    width: scale(105),
    fontWeight: '500',
    marginRight: conditionalScale(12, 14, 16, 20),
  },

  DAM_detailValue: {
    fontSize: conditionalFontScale(12, 13, 14, 15),
    color: '#1e293b',
    flex: 1,
    fontWeight: '600',
    paddingLeft: conditionalScale(6, 8, 10, 12),
  },

  // ── Add Attachment Buttons ───────────────────────────────────
  DAM_buttonSection: {
    marginBottom: conditionalVerticalScale(10, 12, 14, 16),
  },

  DAM_addButtonContainer: {
    flexDirection: 'row',
    gap: conditionalScale(6, 8, 10, 12),
  },

  DAM_addButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: moderateScale(10),
    paddingVertical: conditionalVerticalScale(8, 9, 10, 12),
    alignItems: 'center',
  },

  DAM_addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: conditionalFontScale(10, 11, 12, 13),
  },

  // ── Attachments List Section ─────────────────────────────────
  DAM_attachmentsSection: {
    flex: 1,
    marginBottom: conditionalVerticalScale(12, 14, 16, 18),
  },

  DAM_attachmentsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: conditionalVerticalScale(8, 10, 12, 14),
  },

  DAM_refreshButton: {
    backgroundColor: '#2563eb',
    borderRadius: moderateScale(6),
    paddingHorizontal: conditionalScale(8, 9, 10, 12),
    paddingVertical: conditionalVerticalScale(4, 5, 6, 7),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: conditionalScale(30, 32, 34, 40),
    minHeight: conditionalVerticalScale(26, 28, 30, 34),
  },

  DAM_refreshButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.7,
  },

  DAM_attachmentsScrollView: {
    flex: 1,
  },

  DAM_loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: conditionalScale(12, 14, 16, 18),
  },

  DAM_loadingText: {
    marginTop: conditionalVerticalScale(6, 7, 8, 9),
    color: '#64748b',
    fontSize: conditionalFontScale(10, 11, 12, 13),
  },

  DAM_noAttachmentsText: {
    textAlign: 'center',
    color: '#64748b',
    fontStyle: 'italic',
    padding: conditionalScale(12, 14, 16, 18),
    fontSize: conditionalFontScale(10, 11, 12, 13),
  },

  DAM_attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: conditionalScale(9, 10, 11, 13),
    borderRadius: moderateScale(8),
    marginBottom: conditionalVerticalScale(5, 6, 7, 8),
  },

  DAM_attachmentInfo: {
    flex: 1,
    flexDirection: 'column',
    marginRight: conditionalScale(7, 9, 11, 13),
  },

  DAM_attachmentName: {
    fontSize: conditionalFontScale(11, 12, 13, 14),
    color: '#1e293b',
    fontWeight: '500',
    marginBottom: conditionalVerticalScale(2, 3, 4, 5),
  },

  DAM_newBadge: {
    backgroundColor: '#10b981',
    color: '#fff',
    fontSize: conditionalFontScale(8, 9, 10, 11),
    fontWeight: '600',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(1),
    borderRadius: moderateScale(3),
    alignSelf: 'flex-start',
  },

  DAM_existingBadge: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    fontSize: conditionalFontScale(8, 9, 10, 11),
    fontWeight: '600',
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(1),
    borderRadius: moderateScale(3),
    alignSelf: 'flex-start',
  },

  DAM_attachmentActions: {
    flexDirection: 'row',
    gap: conditionalScale(4, 5, 6, 7),
  },

  DAM_downloadButton: {
    backgroundColor: '#0eaa11',
    paddingHorizontal: conditionalScale(5, 5, 6, 7),
    paddingVertical: conditionalVerticalScale(5, 5, 6, 7),
    borderRadius: moderateScale(4),
    minWidth: conditionalScale(24, 26, 28, 32),
    alignItems: 'center',
    justifyContent: 'center',
  },

  DAM_removeButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: conditionalScale(5, 5, 6, 7),
    paddingVertical: conditionalVerticalScale(5, 5, 6, 7),
    borderRadius: moderateScale(4),
    minWidth: conditionalScale(24, 26, 28, 32),
    alignItems: 'center',
    justifyContent: 'center',
  },

  DAM_disabledActionButton: {
    backgroundColor: '#cbd5e1',
    opacity: 0.6,
  },

  // ── Bottom Action Buttons ────────────────────────────────────
  DAM_buttonContainer: {
    flexDirection: 'row',
    gap: conditionalScale(8, 10, 12, 16),
    paddingBottom: conditionalVerticalScale(8, 8, 10, 12),
  },

  DAM_cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: moderateScale(12),
    paddingVertical: conditionalVerticalScale(12, 13, 14, 17),
    alignItems: 'center',
  },

  DAM_saveButton: {
    flex: 1,
    borderRadius: moderateScale(12),
    paddingVertical: conditionalVerticalScale(12, 13, 14, 17),
    alignItems: 'center',
    backgroundColor: brand.primary,
  },

  DAM_saveButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },

  DAM_disabledButton: {
    backgroundColor: '#e2e8f0',
  },

  DAM_cancelButtonText: {
    fontSize: conditionalFontScale(13, 14, 15, 18),
    fontWeight: '600',
    color: '#475569',
  },

  DAM_saveButtonText: {
    fontSize: conditionalFontScale(13, 14, 15, 18),
    fontWeight: '700',
    color: '#fff',
  },

  // ==================================================================================================================
  // END OF COMPONENT - RESPONSIVE COMPONENT STYLES
  // ==================================================================================================================

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
    borderBottomColor: brand.primary,
  },
  DisplayFilterButtonText: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  DisplayActiveFilterButtonText: {
    color: brand.primary,
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
  LReqSR_GuarantorHeader: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#DDD',
    marginTop: 4,
  },
  LReqSR_GuarantorHeaderId: {
    flex: 0.3,
    fontWeight: '600',
    fontSize: 13,
    color: '#333',
  },
  LReqSR_GuarantorHeaderName: {
    flex: 0.7,
    fontWeight: '600',
    fontSize: 13,
    color: '#333',
    paddingLeft: 8,
  },
  LReqSR_GuarantorItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  LReqSR_GuarantorId: {
    flex: 0.3,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  LReqSR_GuarantorName: {
    flex: 0.7,
    fontSize: 14,
    color: '#555',
    paddingLeft: 8,
  },
  LReqSR_GuarantorSelectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  LReqSR_GuarantorSelectedText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  LReqSR_ProcessingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  LReqSR_ProcessingContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  LReqSR_ProcessingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  LReqSR_CharCount: {
    fontSize: width * 0.034,
    color: '#333',
  },
  formHeader: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: brand.primary,
    borderRadius: 8,
  },
  formHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: brand.primary,
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
    borderBottomColor: brand.primary,
  },
  DisLp_FilterButtonText: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  DisLp_ActiveFilterButtonText: {
    color: brand.primary,
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
    backgroundColor: brand.primary,
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
    backgroundColor: brand.primary,
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  CalMod_CloseButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // end of calendar modal

  // // End of notification button
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
    color: brand.primary,
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
    backgroundColor: brand.primary,
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
    backgroundColor: brand.primary,
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
    backgroundColor: brand.primary,
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
    backgroundColor: brand.primary,
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

  PPEdit_editIconContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: brand.primary,
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },

  PPEdit_initialsTextModal: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },

  // Start of worker assigned to me component
  orgStyles_rootCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: brand.primary,
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
    borderColor: brand.primary,
    alignSelf: 'center',
    marginBottom: 8,
  },
  orgStyles_connectorFromRoot: {
    width: 2,
    height: 40,
    backgroundColor: brand.primary,
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
    borderLeftColor: brand.primary,
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
    borderColor: brand.primary,
  },
  orgStyles_verticalLine: {
    position: 'absolute',
    left: 20,
    top: 0,
    bottom: 38,
    width: 1.5,
    backgroundColor: brand.primary,
  },
  orgStyles_horizontalConnector: {
    position: 'absolute',
    left: 2,
    top: '50%',
    width: 20,
    height: 1.5,
    backgroundColor: brand.primary,
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
    color: brand.primary,
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
    borderColor: brand.primary,
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
    borderColor: brand.primary,
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
    color: brand.primary,
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

  // // Start of EntitlementCards
  // EntCards_CardContainer: {
  //   marginVertical: 10,
  //   marginHorizontal: 16,
  //   borderRadius: 16,
  //   shadowColor: '#000',
  //   shadowOffset: {width: 0, height: 4},
  //   shadowOpacity: 0.15,
  //   shadowRadius: 6,
  //   elevation: 4,
  // },
  // EntCards_Card: {
  //   borderRadius: 16,
  //   padding: 16,
  // },
  // EntCards_CardHeader: {
  //   borderBottomWidth: 2,
  //   borderBottomColor: '#ffffffff',
  //   paddingBottom: 8,
  //   marginBottom: 12,
  // },
  // EntCards_CardHeaderText: {
  //   fontSize: 18,
  //   fontWeight: '700',
  //   color: '#004aad',
  //   textAlign: 'center',
  // },
  // EntCards_CardContent: {
  //   flexDirection: 'column',
  //   gap: 8,
  // },
  // EntCards_TextContainer: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   marginBottom: 6,
  // },
  // EntCards_CardTextHeading: {
  //   fontSize: 14,
  //   fontWeight: '600',
  //   color: '#333',
  // },
  // EntCards_CardText: {
  //   fontSize: 14,
  //   fontWeight: '500',
  //   color: '#111',
  // },
  // // End of EntitlementCards

  // // Start of EntitlementBalance
  // EntBal_NoDataText: {
  //   flex: 1,
  //   textAlign: 'center',
  //   textAlignVertical: 'center',
  //   fontSize: 16,
  //   fontWeight: 'bold',
  //   color: '#cccccc',
  // },
  // // End of EntitlementBalance

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
    borderColor: brand.primary,
  },
  ID_ButtonDisabled: {
    opacity: 0.6,
  },
  ID_ButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ============================================
  // PAGE STYLES - RESPONSIVE STYLES
  // ============================================
  Page_ListContainer: {
    padding: conditionalScale(14, 15, 16, 17),
    paddingBottom: conditionalVerticalScale(20, 22, 24, 26),
  },

  Page_CardWrapper: {
    marginBottom: conditionalVerticalScale(10, 11, 12, 13),
    position: 'relative',
  },

  Page_CardWrapperSelected: {
    borderRadius: conditionalScale(12, 13, 14, 15),
  },

  Page_CheckboxContainer: {
    position: 'absolute',
    right: conditionalScale(10, 11, 12, 13),
    top: conditionalVerticalScale(10, 11, 12, 13),
    zIndex: 10,
  },

  Page_Checkbox: {
    width: conditionalScale(20, 21, 22, 23),
    height: conditionalScale(20, 21, 22, 23),
    borderRadius: conditionalScale(10, 10.5, 11, 11.5),
    borderWidth: moderateScale(2),
    borderColor: '#CCCCCC',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  Page_CheckboxSelected: {
    borderColor: '#0066CC',
    backgroundColor: '#0066CC',
  },

  Page_Checkmark: {
    color: '#FFFFFF',
    fontSize: conditionalFontScale(11, 11.5, 12, 12.5),
    fontWeight: '600',
  },

  // ============================================
  // BULK TOOLBAR - RESPONSIVE STYLES
  // ============================================
  BulkToolbar_Container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: conditionalVerticalScale(14, 15, 16, 17),
    paddingHorizontal: conditionalScale(14, 15, 16, 17),
    borderBottomWidth: moderateScale(1),
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: moderateScale(2)},
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(4),
    elevation: moderateScale(2),
  },

  BulkToolbar_ActionRow: {
    flexDirection: 'row',
    gap: conditionalScale(10, 11, 12, 13),
    marginBottom: conditionalVerticalScale(10, 11, 12, 13),
  },

  BulkToolbar_ApproveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: conditionalVerticalScale(9, 9.5, 10, 10.5),
    borderRadius: conditionalScale(7, 7.5, 8, 8.5),
    backgroundColor: '#FFFFFF',
    borderWidth: moderateScale(1),
    borderColor: '#2E7D32',
  },

  BulkToolbar_ApproveText: {
    color: '#2E7D32',
    fontWeight: '500',
    fontSize: conditionalFontScale(13, 13.5, 14, 14.5),
  },

  BulkToolbar_RejectButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: conditionalVerticalScale(9, 9.5, 10, 10.5),
    borderRadius: conditionalScale(7, 7.5, 8, 8.5),
    backgroundColor: '#FFFFFF',
    borderWidth: moderateScale(1),
    borderColor: '#C62828',
  },

  BulkToolbar_RejectText: {
    color: '#C62828',
    fontWeight: '500',
    fontSize: conditionalFontScale(13, 13.5, 14, 14.5),
  },

  BulkToolbar_ControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  BulkToolbar_TextButton: {
    paddingVertical: conditionalVerticalScale(3, 3.5, 4, 4.5),
  },

  BulkToolbar_PrimaryButtonText: {
    color: '#0066CC',
    fontWeight: '500',
    fontSize: conditionalFontScale(13, 13.5, 14, 14.5),
  },

  BulkToolbar_SecondaryButtonText: {
    color: '#666666',
    fontWeight: '500',
    fontSize: conditionalFontScale(13, 13.5, 14, 14.5),
  },
  // ==================================================================================================================
  // New Desigs Related to App Components Style by Hamza
  // Place this block inside StyleSheet.create({...}), right after the BORDER_WIDTH constant block
  // ==================================================================================================================
  // ============================================
  // MULTI SELECT ACTION BAR (MSAB_) - RESPONSIVE STYLES
  // ============================================
  MSAB_wrapper: {
    position: 'absolute',
    left: conditionalScale(12, 14, 16, 16),
    right: conditionalScale(12, 14, 16, 16),
    zIndex: 9999,
    elevation: 24,
    shadowColor: AppTokens.shadowColor,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.13,
    shadowRadius: 16,
  },
  MSAB_card: {
    backgroundColor: AppTokens.cardBg,
    borderRadius: conditionalScale(12, 13, 14, 14),
    paddingHorizontal: conditionalScale(12, 13, 14, 14),
    paddingTop: conditionalVerticalScale(10, 11, 12, 12),
    paddingBottom: conditionalVerticalScale(12, 13, 14, 14),
    borderWidth: 1,
    borderColor: AppTokens.cardDivider,
  },
  MSAB_topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(10, 10, 12, 12),
    marginBottom: conditionalVerticalScale(10, 10, 12, 12),
  },
  MSAB_cancelBtn: {
    width: conditionalScale(32, 33, 34, 34),
    height: conditionalScale(32, 33, 34, 34),
    borderRadius: conditionalScale(9, 9, 10, 10),
    backgroundColor: AppTokens.slateBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  MSAB_countArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(6, 7, 8, 8),
    flex: 1,
  },
  MSAB_countBadge: {
    minWidth: conditionalScale(22, 23, 24, 24),
    height: conditionalScale(22, 23, 24, 24),
    borderRadius: conditionalScale(11, 12, 12, 12),
    backgroundColor: AppTokens.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: conditionalScale(5, 6, 6, 6),
    flexShrink: 0,
  },
  MSAB_countNumber: {
    fontSize: conditionalFontScale(11, 11, 12, 12),
    fontWeight: '700',
    color: '#fff',
  },
  MSAB_countLabel: {
    fontSize: conditionalFontScale(12, 13, 13, 14),
    fontWeight: '500',
    color: AppTokens.subtitleText,
    flexShrink: 1,
  },
  MSAB_divider: {
    height: 1,
    backgroundColor: AppTokens.cardDivider,
    marginBottom: conditionalVerticalScale(10, 10, 12, 12),
  },
  MSAB_bottomRow: {
    flexDirection: 'row',
    gap: conditionalScale(8, 9, 10, 10),
  },
  MSAB_actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: conditionalVerticalScale(9, 10, 10, 11),
    paddingHorizontal: conditionalScale(8, 9, 10, 10),
    borderRadius: conditionalScale(10, 10, 11, 11),
    gap: conditionalScale(6, 6, 7, 7),
  },
  MSAB_btnDisabled: {
    opacity: 0.45,
  },
  MSAB_btnText: {
    fontSize: conditionalFontScale(12, 13, 13, 14),
    fontWeight: '700',
    color: '#fff',
  },
  MSAB_submitBtn: {
    backgroundColor: AppTokens.green,
    shadowColor: AppTokens.green,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: Platform.OS === 'android' ? 4 : 0,
  },
  MSAB_deleteBtn: {
    backgroundColor: AppTokens.red,
    shadowColor: AppTokens.red,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: Platform.OS === 'android' ? 4 : 0,
  },

  // ============================================
  // DASHBOARD HEADER (DH_) - RESPONSIVE STYLES
  // ============================================
  DH_card: {
    backgroundColor: AppTokens.cardBg,
    marginHorizontal: conditionalScale(8, 10, 12, 12),
    marginTop: conditionalVerticalScale(10, 12, 14, 14),
    marginBottom: conditionalVerticalScale(6, 7, 8, 8),
    borderRadius: conditionalScale(14, 15, 16, 16),
    borderWidth: 1,
    borderColor: AppTokens.cardDivider,
    shadowColor: AppTokens.shadowColor,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  DH_accentBar: {
    height: conditionalVerticalScale(3, 3, 4, 4),
    backgroundColor: AppTokens.blue,
    width: '32%',
    borderBottomRightRadius: 4,
  },
  DH_body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: conditionalScale(14, 15, 16, 16),
    paddingTop: conditionalVerticalScale(14, 15, 16, 16),
    paddingBottom: conditionalVerticalScale(12, 13, 14, 14),
    gap: conditionalScale(14, 15, 16, 16),
  },
  DH_avatarTouch: {
    position: 'relative',
    flexShrink: 0,
  },
  DH_avatarRing: {
    padding: conditionalScale(2, 2, 3, 3),
    borderRadius: 99,
    borderWidth: 2,
    borderColor: brand.primary + '40',
    backgroundColor: AppTokens.blueBg,
  },
  DH_avatarImg: {
    width: conditionalScale(56, 58, 60, 62),
    height: conditionalScale(56, 58, 60, 62),
    borderRadius: 99,
  },
  DH_avatarInitials: {
    width: conditionalScale(56, 58, 60, 62),
    height: conditionalScale(56, 58, 60, 62),
    borderRadius: 99,
    backgroundColor: AppTokens.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  DH_avatarInitialsText: {
    fontSize: conditionalFontScale(18, 19, 20, 21),
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  DH_onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: conditionalScale(12, 13, 13, 14),
    height: conditionalScale(12, 13, 13, 14),
    borderRadius: 99,
    backgroundColor: AppTokens.green,
    borderWidth: 2,
    borderColor: AppTokens.cardBg,
  },
  DH_info: {
    flex: 1,
    gap: conditionalVerticalScale(4, 4, 5, 5),
    paddingTop: conditionalVerticalScale(2, 2, 3, 3),
  },
  DH_nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(8, 8, 9, 9),
  },
  DH_nameText: {
    fontSize: conditionalFontScale(15, 16, 17, 17),
    fontWeight: '700',
    color: AppTokens.titleText,
    letterSpacing: -0.3,
    flex: 1,
  },
  DH_editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(3, 3, 4, 4),
    backgroundColor: AppTokens.blueBg,
    paddingHorizontal: conditionalScale(7, 7, 8, 8),
    paddingVertical: conditionalVerticalScale(3, 3, 3, 4),
    borderRadius: 99,
  },
  DH_editChipText: {
    fontSize: conditionalFontScale(9, 10, 10, 11),
    fontWeight: '600',
    color: AppTokens.blue,
  },
  DH_positionText: {
    fontSize: conditionalFontScale(11, 12, 12, 13),
    color: brand.primary,
    fontWeight: '400',
  },
  DH_tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: conditionalScale(6, 6, 7, 7),
  },
  DH_tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(4, 4, 5, 5),
    backgroundColor: AppTokens.blueBg,
    paddingHorizontal: conditionalScale(8, 8, 9, 9),
    paddingVertical: conditionalVerticalScale(3, 3, 4, 4),
    borderRadius: 99,
  },
  DH_tagNeutral: {
    backgroundColor: AppTokens.slateBg,
  },
  DH_tagText: {
    fontSize: conditionalFontScale(10, 10, 11, 11),
    fontWeight: '600',
    color: AppTokens.blue,
  },
  DH_tagTextNeutral: {
    color: AppTokens.subtitleText,
  },
  DH_statsStrip: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: AppTokens.rowDivider,
    backgroundColor: AppTokens.pageBg,
  },
  DH_statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: conditionalVerticalScale(10, 11, 12, 12),
    gap: conditionalVerticalScale(2, 2, 3, 3),
  },
  DH_statsDivider: {
    width: 1,
    backgroundColor: AppTokens.rowDivider,
    marginVertical: conditionalVerticalScale(8, 9, 10, 10),
  },
  DH_statLabel: {
    fontSize: conditionalFontScale(9, 9, 10, 10),
    color: AppTokens.subtitleText,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  DH_statValue: {
    fontSize: conditionalFontScale(11, 11, 12, 12),
    color: AppTokens.titleText,
    fontWeight: '600',
  },
  DH_skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: conditionalScale(16, 17, 18, 18),
    gap: conditionalScale(14, 15, 16, 16),
  },
  DH_skeletonAvatar: {
    width: conditionalScale(62, 64, 66, 68),
    height: conditionalScale(62, 64, 66, 68),
    borderRadius: 99,
    backgroundColor: AppTokens.slateBg,
    flexShrink: 0,
  },
  DH_skeletonLines: {
    flex: 1,
  },
  DH_skeletonBar: {
    height: conditionalVerticalScale(10, 11, 12, 12),
    borderRadius: 6,
    backgroundColor: AppTokens.slateBg,
  },

  // ============================================
  // MENU GRID (MG_) - RESPONSIVE STYLES
  // ============================================
  MG_container: {
    marginTop: conditionalVerticalScale(6, 7, 8, 8),
    gap: conditionalVerticalScale(2, 2, 4, 4),
  },
  MG_section: {
    marginBottom: conditionalVerticalScale(20, 22, 24, 24),
  },
  MG_sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: conditionalScale(18, 18, 20, 20),
    marginBottom: conditionalVerticalScale(12, 13, 14, 14),
  },
  MG_sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(7, 7, 8, 8),
  },
  MG_sectionTitle: {
    fontSize: conditionalFontScale(13, 13, 14, 14),
    fontWeight: '600',
    color: '#0F1923',
    letterSpacing: -0.2,
  },
  MG_badge: {
    backgroundColor: '#1A56DB',
    borderRadius: 99,
    minWidth: conditionalScale(16, 17, 18, 18),
    height: conditionalScale(16, 17, 18, 18),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: conditionalScale(4, 4, 5, 5),
  },
  MG_badgeText: {
    fontSize: conditionalFontScale(9, 9, 9, 10),
    fontWeight: '700',
    color: '#fff',
  },
  MG_sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(2, 2, 3, 3),
  },
  MG_sectionActionText: {
    fontSize: conditionalFontScale(11, 11, 12, 12),
    fontWeight: '500',
    color: '#1A56DB',
  },
  MG_pageLabelText: {
    fontSize: conditionalFontScale(11, 11, 12, 12),
    color: '#9AA3AF',
    fontWeight: '500',
  },

  // ── Leave Balance ──
  MG_leaveGrid: {
    flexDirection: 'row',
    paddingHorizontal: conditionalScale(18, 18, 20, 20),
    gap: conditionalScale(8, 9, 10, 10),
  },
  MG_leaveCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: conditionalScale(12, 13, 14, 14),
    borderWidth: 1,
    borderColor: '#E8EBF0',
    padding: conditionalScale(11, 12, 13, 13),
    alignItems: 'flex-start',
    shadowColor: '#0F1923',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  MG_leaveNumber: {
    fontSize: conditionalFontScale(22, 23, 24, 25),
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: conditionalFontScale(26, 27, 28, 29),
  },
  MG_leaveLabel: {
    fontSize: conditionalFontScale(10, 10, 11, 11),
    fontWeight: '500',
    color: '#4A5568',
    marginTop: conditionalVerticalScale(1, 1, 2, 2),
  },
  MG_leaveTrack: {
    width: '100%',
    height: conditionalVerticalScale(3, 3, 3, 3),
    backgroundColor: '#F0F2F5',
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: conditionalVerticalScale(8, 8, 9, 9),
    marginBottom: conditionalVerticalScale(4, 4, 5, 5),
  },
  MG_leaveFill: {
    height: '100%',
    borderRadius: 99,
  },
  MG_leaveOf: {
    fontSize: conditionalFontScale(9, 9, 9, 10),
    color: '#9AA3AF',
    fontWeight: '400',
  },

  // ── Approval cards ──
  MG_aListContent: {
    paddingHorizontal: conditionalScale(18, 18, 20, 20),
    paddingBottom: conditionalVerticalScale(2, 2, 4, 4),
  },
  MG_aCard: {
    width: conditionalScale(210, 222, 234, 244),
    backgroundColor: '#FFFFFF',
    borderRadius: conditionalScale(12, 13, 14, 14),
    borderWidth: 1,
    borderColor: '#E8EBF0',
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#0F1923',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  MG_aCardStrip: {
    width: conditionalScale(3, 3, 3, 4),
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  MG_aCardInner: {
    flex: 1,
    padding: conditionalScale(12, 12, 13, 14),
    gap: conditionalVerticalScale(3, 3, 4, 4),
  },
  MG_aCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  MG_aTypePill: {
    paddingHorizontal: conditionalScale(7, 7, 8, 8),
    paddingVertical: conditionalVerticalScale(2, 2, 2, 3),
    borderRadius: 99,
    maxWidth: '68%',
  },
  MG_aTypePillText: {
    fontSize: conditionalFontScale(9, 9, 10, 10),
    fontWeight: '600',
  },
  MG_aTimeText: {
    fontSize: conditionalFontScale(9, 9, 9, 10),
    color: '#9AA3AF',
  },
  MG_aDocId: {
    fontSize: conditionalFontScale(12, 13, 13, 14),
    fontWeight: '700',
    color: '#0F1923',
    letterSpacing: -0.3,
  },
  MG_aFromText: {
    fontSize: conditionalFontScale(10, 10, 10, 11),
    color: '#4A5568',
  },
  MG_aActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(6, 6, 7, 7),
    marginTop: conditionalVerticalScale(6, 6, 7, 7),
    paddingTop: conditionalVerticalScale(7, 7, 8, 8),
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  MG_aApproveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(3, 3, 4, 4),
    paddingHorizontal: conditionalScale(8, 8, 9, 9),
    paddingVertical: conditionalVerticalScale(4, 4, 5, 5),
    borderRadius: conditionalScale(6, 6, 7, 7),
    backgroundColor: '#E8F7F1',
  },
  MG_aRejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(3, 3, 4, 4),
    paddingHorizontal: conditionalScale(8, 8, 9, 9),
    paddingVertical: conditionalVerticalScale(4, 4, 5, 5),
    borderRadius: conditionalScale(6, 6, 7, 7),
    backgroundColor: '#FEF0EE',
  },
  MG_aReturnedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(3, 3, 4, 4),
    paddingHorizontal: conditionalScale(8, 8, 9, 9),
    paddingVertical: conditionalVerticalScale(4, 4, 5, 5),
    borderRadius: conditionalScale(6, 6, 7, 7),
    backgroundColor: '#FEF3C7',
  },
  MG_aActionText: {
    fontSize: conditionalFontScale(10, 10, 10, 11),
    fontWeight: '600',
  },
  MG_aChevron: {
    marginLeft: 'auto',
  },
  MG_aProcessing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: conditionalScale(5, 5, 6, 6),
    flex: 1,
  },
  MG_aProcessingText: {
    fontSize: conditionalFontScale(10, 10, 11, 11),
    color: '#9AA3AF',
  },

  // ── Skeleton ──
  MG_aSkeletonRow: {
    flexDirection: 'row',
    paddingHorizontal: conditionalScale(18, 18, 20, 20),
    gap: conditionalScale(10, 10, 12, 12),
  },
  MG_aSkeletonCard: {
    width: conditionalScale(210, 222, 234, 244),
    height: conditionalVerticalScale(100, 106, 112, 116),
    borderRadius: conditionalScale(12, 13, 14, 14),
    backgroundColor: '#F0F2F5',
  },

  // ── Quick Actions ──
  MG_page: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: conditionalScale(10, 12, 14, 14),
    alignContent: 'flex-start',
  },
  MG_dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: conditionalScale(4, 4, 5, 5),
    paddingTop: conditionalVerticalScale(10, 11, 12, 12),
    paddingBottom: conditionalVerticalScale(6, 6, 8, 8),
  },
  MG_dot: {
    height: conditionalScale(4, 4, 5, 5),
    borderRadius: 99,
  },

  // ── Empty state ──
  MG_emptyState: {
    alignItems: 'center',
    paddingVertical: conditionalVerticalScale(40, 44, 48, 48),
    paddingHorizontal: conditionalScale(28, 30, 32, 32),
    gap: conditionalVerticalScale(6, 7, 8, 8),
  },
  MG_emptyIcon: {
    width: conditionalScale(48, 50, 52, 52),
    height: conditionalScale(48, 50, 52, 52),
    borderRadius: conditionalScale(14, 15, 16, 16),
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: conditionalVerticalScale(4, 4, 6, 6),
  },
  MG_emptyTitle: {
    fontSize: conditionalFontScale(13, 13, 14, 14),
    fontWeight: '600',
    color: '#0F1923',
  },
  MG_emptyBody: {
    fontSize: conditionalFontScale(11, 11, 12, 12),
    color: '#9AA3AF',
    textAlign: 'center',
    lineHeight: conditionalFontScale(16, 16, 17, 17),
  },
  // ============================================
  // PROFILE SCREEN (Prf_) - RESPONSIVE STYLES
  // ============================================
  Prf_loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  Prf_avatarCard: {
    marginBottom: conditionalVerticalScale(6, 8, 8, 10),
  },
  Prf_avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(16, 18, 20, 20),
    paddingVertical: conditionalVerticalScale(18, 20, 22, 22),
  },
  Prf_avatarCircle: {
    width: conditionalScale(68, 74, 80, 80),
    height: conditionalScale(68, 74, 80, 80),
    borderRadius: conditionalScale(34, 37, 40, 40),
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: AppTokens.blueBg,
    shadowColor: AppTokens.blue,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  Prf_avatarImage: {
    width: conditionalScale(68, 74, 80, 80),
    height: conditionalScale(68, 74, 80, 80),
    borderRadius: conditionalScale(34, 37, 40, 40),
  },
  Prf_avatarFallback: {
    width: conditionalScale(68, 74, 80, 80),
    height: conditionalScale(68, 74, 80, 80),
    borderRadius: conditionalScale(34, 37, 40, 40),
    backgroundColor: AppTokens.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  Prf_avatarInitials: {
    fontSize: conditionalFontScale(20, 22, 24, 24),
    fontWeight: '800',
    color: AppTokens.cardBg,
    letterSpacing: 1.5,
  },
  Prf_avatarTextBlock: {
    flex: 1,
    marginLeft: conditionalScale(14, 16, 18, 18),
  },
  Prf_avatarName: {
    fontSize: conditionalFontScale(16, 17, 18, 18),
    fontWeight: '700',
    color: AppTokens.titleText,
    marginBottom: conditionalVerticalScale(3, 4, 4, 4),
  },
  Prf_avatarRole: {
    fontSize: conditionalFontScale(12, 12, 13, 13),
    fontWeight: '400',
    color: AppTokens.subtitleText,
  },
  Prf_emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: conditionalScale(14, 15, 16, 16),
    paddingVertical: conditionalVerticalScale(13, 14, 15, 15),
  },
  Prf_emailIconBadge: {
    width: conditionalScale(36, 37, 38, 38),
    height: conditionalScale(36, 37, 38, 38),
    borderRadius: conditionalScale(10, 10, 11, 11),
    backgroundColor: AppTokens.blueBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: conditionalScale(12, 13, 14, 14),
  },
  Prf_emailLabel: {
    fontSize: conditionalFontScale(13, 13, 14, 14),
    fontWeight: '600',
    color: AppTokens.titleText,
    marginRight: conditionalScale(8, 9, 10, 10),
  },
  Prf_emailValue: {
    flex: 1,
    fontSize: conditionalFontScale(12, 12, 13, 13),
    fontWeight: '600',
    color: AppTokens.titleText,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f6',
    padding: 12,
  },

  headerText: {fontWeight: 'bold'},

  touchable: {margin: 8},

  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    elevation: 2,
  },

  typeContainer: {flex: 1},
  questionContainer: {flex: 2},

  typeText: {color: '#555'},
  questionText: {color: '#222'},

  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
  },

  title: {fontSize: 16, fontWeight: 'bold', marginBottom: 10},
  question: {marginBottom: 10},

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    minHeight: 100,
  },

  saveBtn: {
    marginTop: 15,
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  btnText: {color: '#fff', fontWeight: 'bold'},

  optionRow: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: 8,
  },

  selectedOption: {
    backgroundColor: '#d0ebff',
    borderColor: '#007bff',
  },

  checkboxContainer: {flexDirection: 'row', alignItems: 'center'},

  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#999',
    marginRight: 10,
  },

  checkedBox: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },

  optionText: {fontSize: 14},

  // 🔹 Status message
  statusMessage: {
    backgroundColor: '#fff3cd',
    padding: 12,
    margin: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeeba',
  },
  statusMessageText: {
    color: '#856404',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  scrollContainer: {paddingVertical: 16, paddingHorizontal: 0},
  instructionContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  instructionHeading: {fontSize: 16, fontWeight: 'bold', marginBottom: 6},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 10,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginTop: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },

  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    color: '#222',
  },

  noDataText: {
    fontSize: 14,
    color: '#666',
  },

  // ─────────────────────────────────────────────────────────────
  // Append these entries to your existing StyleSheet in styles.js
  // ─────────────────────────────────────────────────────────────

  // EI_Card
  EI_Card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#0A66C2',
  },

  EI_CardDisabled: {
    borderLeftColor: '#BDBDBD',
    opacity: 0.6,
  },

  EI_CardAnswered: {
    borderLeftColor: '#2e7d32',
  },

  // Header row inside card
  EI_CardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  EI_RowRTL: {
    flexDirection: 'row-reverse',
  },

  // Type badge (Simple / Multiple Choice)
  EI_TypeBadge: {
    backgroundColor: '#E3F0FB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  EI_TypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0A66C2',
    textTransform: 'capitalize',
  },

  // Answered / Pending badge
  EI_AnsweredBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  EI_AnsweredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Question text
  EI_QuestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    lineHeight: 20,
  },

  // Answered preview
  EI_AnswerPreview: {
    marginTop: 6,
    fontSize: 12,
    color: '#555',
    fontStyle: 'italic',
    lineHeight: 17,
  },

  // Button row in answer pane (Save + Cancel side by side)
  EI_BtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },

  EI_CancelBtn: {
    backgroundColor: '#f0f0f0',
  },

  // ============================================
  // SITE SURVEY BUTTON (SSB_) - RESPONSIVE STYLES
  // ============================================
  SSB_container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.primary,
    borderRadius: conditionalScale(14, 15, 16, 16),
    paddingVertical: conditionalVerticalScale(7, 8, 8, 9),
    paddingHorizontal: conditionalScale(10, 11, 12, 13),
    shadowColor: brand.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  SSB_label: {
    fontSize: conditionalFontScale(11.5, 12, 12.5, 13),
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: conditionalScale(6, 6, 7, 7),
    marginRight: conditionalScale(6, 6, 7, 7),
  },
  SSB_badge: {
    width: conditionalScale(16, 17, 18, 18),
    height: conditionalScale(16, 17, 18, 18),
    borderRadius: conditionalScale(8, 8.5, 9, 9),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});

// styles.js — add near the bottom, before `export default styles;`
export const getDSRStyles = tokens =>
  StyleSheet.create({
    DSR_SafeArea: {
      flex: 1,
      backgroundColor: tokens.formPageBg,
    },
    DSR_LoadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: tokens.formPageBg,
    },
    DSR_FormContainer: {
      paddingHorizontal: conditionalScale(12, 14, 16, 18),
      paddingTop: conditionalVerticalScale(8, 10, 12, 14),
      paddingBottom: conditionalVerticalScale(80, 85, 90, 100),
    },
    DSR_Label: {
      fontSize: conditionalFontScale(13, 13.5, 14, 14),
      marginTop: conditionalVerticalScale(14, 16, 18, 20),
      fontWeight: '600',
      color: tokens.titleText,
      letterSpacing: 0.2,
    },
    DSR_Input: {
      borderWidth: moderateScale(1),
      borderColor: tokens.inputBorder,
      borderRadius: borderRadius.lg,
      padding: conditionalScale(11, 12, 13, 14),
      marginTop: conditionalVerticalScale(5, 6, 7, 8),
      fontSize: conditionalFontScale(14, 14.5, 15, 15),
      color: tokens.inputText,
      backgroundColor: tokens.inputBg,
    },
    DSR_Disabled: {
      backgroundColor: tokens.disabledBg,
      color: tokens.disabledText,
      borderColor: tokens.disabledBorder,
    },
    DSR_DateSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: moderateScale(1),
      borderColor: tokens.inputBorder,
      borderRadius: borderRadius.lg,
      padding: conditionalScale(11, 12, 13, 14),
      marginTop: conditionalVerticalScale(5, 6, 7, 8),
      backgroundColor: tokens.inputBg,
    },
    DSR_DateText: {
      fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
      color: tokens.inputText,
      letterSpacing: 0.2,
      flex: 1,
    },
    DSR_DropdownPlaceholder: {
      color: tokens.placeholderText,
      fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
    },
    DSR_DropdownSelectedText: {
      color: tokens.inputText,
      fontWeight: '400',
      fontSize: conditionalFontScale(14, 14.5, 15, 15.5),
    },
    DSR_DropdownItemText: {
      color: tokens.inputText,
      fontSize: conditionalFontScale(13, 13.5, 14, 14.5),
    },
    DSR_DropdownContainer: {
      borderWidth: moderateScale(0.5),
      borderColor: tokens.dropdownBorder,
      borderRadius: borderRadius.md,
      backgroundColor: tokens.dropdownBg,
    },
    DSR_DropdownItemContainer: {
      paddingHorizontal: conditionalScale(6, 7, 8, 9),
      paddingVertical: conditionalVerticalScale(4, 5, 6, 7),
      borderBottomWidth: moderateScale(1),
      borderBottomColor: tokens.dropdownItemBorder,
    },
    DSR_DropdownSearchInput: {
      color: tokens.inputText,
      backgroundColor: tokens.dropdownBg,
      fontSize: conditionalFontScale(10, 10.5, 11, 11.5),
      borderBottomWidth: moderateScale(1),
      borderBottomColor: tokens.dropdownItemBorder,
    },
    DSR_ProcessingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: tokens.overlayBg,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    },
    DSR_ProcessingContainer: {
      backgroundColor: tokens.cardBg,
      borderRadius: borderRadius.xl,
      padding: conditionalScale(22, 24, 26, 28),
      alignItems: 'center',
      minWidth: conditionalScale(180, 190, 200, 210),
      borderWidth: moderateScale(1),
      borderColor: tokens.cardDivider,
    },
    DSR_ProcessingText: {
      marginTop: conditionalVerticalScale(11, 13, 15, 17),
      fontSize: conditionalFontScale(15, 16, 17, 18),
      fontWeight: '600',
      color: tokens.titleText,
      letterSpacing: 0.3,
    },
    SRBtn_Footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: conditionalVerticalScale(8, 10, 12, 14),
      paddingHorizontal: conditionalScale(6, 8, 10, 12),
      borderTopWidth: 1,
      borderTopColor: tokens.cardDivider,
      backgroundColor: tokens.cardBg,
      minHeight: conditionalVerticalScale(60, 65, 70, 70),
      gap: conditionalScale(6, 8, 10, 12),
      zIndex: 10,
    },
    SRBtn_CancelButton: {
      borderColor: tokens.blue,
      backgroundColor: 'transparent',
    },
    SRBtn_CancelButtonText: {
      fontWeight: '600',
      fontSize: conditionalFontScale(12, 13, 14, 15),
      color: tokens.blue,
      textAlign: 'center',
      includeFontPadding: false,
    },
  });

export const getNotDDStyles = tokens =>
  StyleSheet.create({
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
      backgroundColor: tokens.cardBg,
      borderRadius: 8,
      shadowColor: tokens.shadowColor,
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
      color: tokens.blue,
      marginBottom: 10,
      textAlign: 'center',
    },
    NotDD_dropdownText: {
      fontSize: 14,
      color: tokens.titleText,
      marginBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: tokens.rowDivider,
      paddingBottom: 5,
    },
    NotDD_scrollView: {
      maxHeight: 300,
    },
  });

export default styles;
