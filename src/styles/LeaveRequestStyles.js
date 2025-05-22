import {StyleSheet, Dimensions} from 'react-native';
import {hp, wp} from '../constants/Size';
const {height, width} = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7', // Use a subtle background color
    marginTop: hp(2),
  },
  card: {
    backgroundColor: '#fff',
    marginTop: hp(3),
    paddingVertical: hp(2), // Increased padding for more spacing inside the card
    paddingHorizontal: wp(5), // Padding for horizontal spacing
    alignSelf: 'center',
    width: wp(92), // Adjusted width for more screen utilization
    borderRadius: 20, // Increased border radius for rounded corners
    alignItems: 'flex-start', // Align content to start for a structured look
    justifyContent: 'space-between',
    // eslint-disable-next-line no-undef
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 5},
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardContent: {
    width: '100%', // Full width to adjust to card size
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Spaced out row elements for even distribution
    alignItems: 'center',
    marginVertical: hp(1), // Spacing between text rows
  },
  cardTextHeading: {
    fontSize: hp(3.0), // Responsive font size
    fontWeight: '700',
    color: '#333',
  },
  cardText: {
    fontSize: hp(3.0), // Responsive font size for body text
    color: '#555',
  },
  requestIdText: {
    fontWeight: 'bold',
    fontSize: hp(4.5),
    color: '#555555', // Dark gray for request ID text
    width: wp(40),
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Align buttons horizontally
  },
  buttons: {
    backgroundColor: '#FFA500', // Color for the buttons
    borderRadius: 50,
    padding: 8,
    // marginLeft: 1, // Space between buttons
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal Styles
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContentImage: {
    backgroundColor: 'white',
    // padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalImage: {
    width: width * 0.8,
    height: height * 0.6,
    borderRadius: 10,
    // marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  profilePicture: {
    width: hp(10),
    height: hp(10),
    borderRadius: hp(9),
    // marginRight: wp(3),
  },
  //   buttonContainer: {
  //  //   flexDirection: 'row',
  //     justifyContent: 'space-between',
  //     width: wp(70),
  //   },

  // button: {
  //   borderRadius: 10,
  //   padding: 10,
  //   elevation: 2,
  //   width: wp(30),
  //   marginTop:'10%',
  //   marginLeft:'30%',
  //   marginHorizontal: wp(2),
  // },
  cancelButton: {
    backgroundColor: '#F4E1E4', // Light pink for cancel button
    borderRadius: 20,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(6),
    marginBottom: hp(1.5),
  },
  cancelButtonText: {
    color: '#DB193C', // Dark pink for cancel button text
    fontSize: hp(1.8),
    textAlign: 'center',
  },
  approveButton: {
    backgroundColor: '#DFF2D8', // Light green for approve button
    borderRadius: 20,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(5),
  },
  approveButtonText: {
    color: '#52be2f', // Dark green for approve button text
    fontSize: hp(1.8),
    textAlign: 'center',
  },
  arrowIcon: {
    position: 'absolute',
    right: wp(7),
    top: hp(11.5),
  },
  filterIcon: {
    position: 'absolute',
    top: hp(2),
    right: wp(5),
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', // Darker overlay for better contrast
  },
  modalContent: {
    width: wp(80),
    backgroundColor: '#FFF3E0',
    //borderRadius: 0,
    borderBottomLeftRadius: 15, // Adjust as needed
    borderBottomRightRadius: 15, // Adjust as needed
    padding: hp(2.3),
    marginBottom: hp(10),
  },
  modalHeading: {
    fontSize: hp(5.0),
    color: '#555555', // Dark gray for modal heading
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: hp(2),
  },
  fieldsHeading: {
    fontSize: hp(4.5),
    color: '#555555', // Dark gray for fields heading
    fontWeight: '500',
    paddingVertical: hp(0.5),
  },
  RequestHeading: {
    fontSize: hp(4.5),
    color: '#555555', // Dark gray for request heading
    fontWeight: 'bold',
    paddingVertical: hp(0.5),
  },
  employeeID: {
    fontSize: hp(4.5),
    color: '#555555', // Dark gray for employee ID
    fontWeight: '700',
    marginBottom: hp(1),
  },
  input: {
    borderWidth: 1,
    borderColor: '#555555', // Light gray for input border
    borderRadius: 5,
    padding: hp(1),
    marginBottom: hp(1),
    fontSize: hp(4.5),

    color: '#555555', // Dark gray for input text
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#555555', // Light gray for dropdown border
    padding: hp(1),
    borderRadius: 5,
    marginBottom: hp(1.5),
  },
  dropdownContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#555555', // Light gray for dropdown container border
  },
  inputCon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555555', // Light gray for input container border
    borderRadius: 5,
    padding: hp(1),
    marginBottom: hp(1.5),
  },
  inputTxt: {
    fontSize: hp(4.5),
    color: '#555555', // Dark gray for input text
  },
  createButton: {
    backgroundColor: '#FFA500', // Bright orange for button
    borderRadius: 5,
    paddingVertical: hp(1.5),
    alignItems: 'center',
    marginTop: hp(2),
  },
  createButtonText: {
    fontSize: hp(4.5),
    fontWeight: '600',
    color: '#fff', // White text for button
  },
  // buttonText: {
  //   color: '#fff',
  //   fontWeight: '600',
  //   textAlign: 'center',
  //   fontSize: hp(4.5),
  // },
  calendarContainer: {
    marginBottom: hp(1.5),
  },
  textFromTo: {
    fontSize: hp(4.5),
    color: '#555555',
    marginBottom: hp(1),
  },
  calendarModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', // Darker overlay for better contrast
  },
  calendarModalContent: {
    width: wp(80),
    backgroundColor: '#FFF3E0',
    borderRadius: 15,
    padding: hp(2),
  },
  closeCalendarButton: {
    backgroundColor: '#FFA500', // Bright orange for button
    borderRadius: 5,
    paddingVertical: hp(1.5),
    alignItems: 'center',
    marginTop: hp(2),
  },
  closeCalendarButtonText: {
    color: '#fff', // White text for button
    fontSize: hp(4.5),
    fontWeight: '500',
  },
  reasonInput: {
    padding: hp(1),
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#555555', // Light gray for border
    fontSize: hp(4.5),
    color: '#333', // Dark gray for text
  },
  // confirmButton: {
  //   backgroundColor: 'orange', // Green for confirm button
  // },
  cardContainer: {
    marginVertical: 8,
    paddingHorizontal: 12,
  },
  // eslint-disable-next-line no-dupe-keys
  card: {
    borderRadius: 15,
    padding: 15,
    elevation: 4,
  },
  cardHeader: {
    // flexDirection: 'row',
    // justifyContent: 'space-between',
    // alignItems: 'center',
    // marginBottom: 12,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    //   paddingHorizontal: 10,
  },
  cardHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555555',
  },
  editButton: {
    backgroundColor: 'orange',
    padding: 8,
    borderRadius: 50,
  },
  submitButton: {
    backgroundColor: 'orange',
    padding: 8,
    borderRadius: 50,
  },
  // eslint-disable-next-line no-dupe-keys
  cardContent: {
    paddingVertical: 5,
  },
  // eslint-disable-next-line no-dupe-keys
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  // eslint-disable-next-line no-dupe-keys
  cardTextHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555555',
  },
  // eslint-disable-next-line no-dupe-keys
  cardText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#555555',
    textAlign: 'right',
  },
  statusText: {
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#555555',
    marginVertical: 8,
  },
  expandButton: {
    alignItems: 'center',
    padding: 5,
    marginTop: 10,
    backgroundColor: 'orange',
    borderRadius: 50,
    alignSelf: 'center',
  },
  disabledText: {
    color: 'gray', // Change text color to indicate disabled state
  },
  disabledButton: {
    backgroundColor: '#999', // Change color when button is disabled
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
    marginTop: 20,
    marginVertical: 8,
    paddingHorizontal: 12,
    marginLeft: '4%',
    width: '92%',
  },
  filterInput: {
    flex: 1,
    height: 40,
    color: '#333',
    paddingLeft: 8,
    width: 4, // Padding to create space between icon and text
  },
  iconStyle: {
    marginRight: 4,
  },
  headerRightButton: {
    width: wp(10),
    alignItems: 'center',
    height: hp(7),
    justifyContent: 'center',
    marginRight: width * 0.03,
  },

  buttonContainer: {
    flexDirection: 'row', // Places buttons in a row
    justifyContent: 'space-between', // Adds space between buttons
    marginTop: 20,
    paddingHorizontal: 10,
  },
  button: {
    flex: 1, // Takes available space for responsive sizing
    marginHorizontal: 5, // Adds spacing between buttons
    padding: 10,
    borderRadius: 5,
  },
  confirmButton: {
    backgroundColor: 'orange', // Custom color for buttons
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
