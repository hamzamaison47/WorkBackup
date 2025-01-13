import {
  widthPercentageToDP,
  heightPercentageToDP,
  IOSStatusBar,
} from './windowDimension';

const Size = num =>
  Math.sqrt(
    heightPercentageToDP('100%') * heightPercentageToDP('100%') +
      widthPercentageToDP('100%') * widthPercentageToDP('100%'),
  ) *
  (num / 100);
const hp = num => heightPercentageToDP(`${num}%`);
const wp = num => widthPercentageToDP(`${num}%`);
const IOS = IOSStatusBar() > 20 ? 5 : IOSStatusBar();
export {Size, hp, wp, IOS};
