import {StyleSheet, Dimensions} from 'react-native';

const {height, width} = Dimensions.get('window');
const cardWidth = (width - 56) / 2;

export const styles = StyleSheet.create({
  // Start of Maindashboard
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  headerContainer: {
    width: width * 0.9, // wp(90)
    alignSelf: 'center',
    marginTop: height * 0.03, // hp(3)
    // marginBottom: height * 0.001, // hp(2)
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 6},
    shadowRadius: 8,
    elevation: 8,
    marginBottom: height * 0.035, // hp(3)
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  profilePicture: {
    width: height * 0.12, // hp(20)
    height: height * 0.12,
    borderRadius: height * 0.125, // hp(12.5)
    marginRight: width * 0.02, // wp(2)
    borderWidth: 4,
    borderColor: '#0A66C2',
  },
  textColumn: {
    flexDirection: 'column',
    flex: 1,
  },
  welcomeText: {
    fontSize: height * 0.025, // hp(5)
    fontWeight: 'bold',
    color: '#1A1A1A',
    // marginBottom: height * 0.008, // hp(0.8)
    textAlign: 'left',
  },
  nameText: {
    fontSize: height * 0.022, // hp(4.5)
    color: '#0A66C2',
    fontWeight: '600',
    textAlign: 'left',
    // marginBottom: height * 0.005, // hp(0.5)
  },
  emailText: {
    fontSize: height * 0.015, // hp(2.8)
    color: '#5A5A5A',
    textAlign: 'left',
  },
  grid: {
    paddingHorizontal: 20,
    // paddingTop: 10,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
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
  iconWrapper: {
    backgroundColor: '#0A66C2',
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
    shadowColor: '#0A66C2',
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalImage: {
    width: width * 0.08,
    height: height * 0.06,
    borderRadius: 10,
  },
  // End of Maindashboard
});
