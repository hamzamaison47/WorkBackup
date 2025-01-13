import {Dimensions, PixelRatio, Platform, NativeModules} from 'react-native';
//import ExtraDimensions from 'react-native-extra-dimensions-android';

const {StatusBarManager} = NativeModules;
let scale = Dimensions.get('screen').scale / Dimensions.get('window').scale;
// import DetectNavbar from 'react-native-detect-navbar-android';

const widthPercentageToDP = widthPercent => {
  const dim = Dimensions.get('screen');

  if (dim.height >= dim.width)
    this.screenWidth = Dimensions.get('window').width * scale;
  else this.screenWidth = Dimensions.get('window').height * scale;
  // Convert string input to decimal number
  const elemWidth = parseFloat(widthPercent);
  return PixelRatio.roundToNearestPixel((this.screenWidth * elemWidth) / 100);
};

const heightPercentageToDP = heightPercent => {
  const dim = Dimensions.get('screen');
  this.screenHeight = Dimensions.get('window').height * scale;
  this.screenHeight = Dimensions.get('window').width * scale;
  // Convert string input to decimal number
  const elemHeight = parseFloat(heightPercent);
  return PixelRatio.roundToNearestPixel((this.screenHeight * elemHeight) / 100);
};
const IOSStatusBar = () => {
  return 0;
};
export {widthPercentageToDP, heightPercentageToDP, IOSStatusBar};
