import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF', // White background for better contrast with text
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'orange', // Orange header background to match the theme
    borderRadius: 10,
    marginBottom: 15, // Margin to separate the header from the list items
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5, // Elevation for subtle header shadow
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 16, // Slightly larger text size for emphasis
    color: '#FFFFFF', // White text for high contrast against the header
    width: '30%', // Adjust the width for better text wrapping
    textAlign: 'center',
  },
  row: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#F7F7F7', // Light background for the row items
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2, // Maintain a balanced shadow effect
    shadowRadius: 6,
    elevation: 4,
  },
  rowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    fontSize: 15, // Increased font size for better readability
    color: '#444444', // Use a slightly darker gray for text
    width: '30%', // Adjust width to balance layout
    textAlign: 'left',
  },
  expandButton: {
    padding: 5,
    width: '10%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '45%', // Adjust width for side-by-side buttons
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonText: {
    color: '#FFFFFF', // White text for high contrast on button
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  expandedSection: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#F1F1F1', // Slightly darker gray for the expanded section
    borderRadius: 8,
    marginTop: 10,
  },
  expandedText: {
    fontSize: 14,
    color: '#333333', // Darker text for expanded content
    marginBottom: 10, // Margin to separate text from the buttons
  },
  loading: {
    marginTop: 20,
  },
});
