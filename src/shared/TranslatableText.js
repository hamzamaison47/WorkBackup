// // src/shared/TranslatableText.js
// import React, {Component} from 'react';
// import {Text} from 'react-native';
// import {connect} from 'react-redux';
// import {translate} from '../store/utils/translate';

// /**
//  * Reusable component for translatable text
//  * Automatically re-renders when language changes
//  */
// class TranslatableText extends Component {
//   render() {
//     const {translationKey, variables, style, children, ...otherProps} =
//       this.props;

//     // If translationKey is provided, use translation
//     if (translationKey) {
//       const translatedText = translate(translationKey, variables);
//       return (
//         <Text style={style} {...otherProps}>
//           {translatedText}
//         </Text>
//       );
//     }

//     // Otherwise, render children as-is
//     return (
//       <Text style={style} {...otherProps}>
//         {children}
//       </Text>
//     );
//   }
// }

// // Connect to Redux to trigger re-render on language change
// const mapStateToProps = state => ({
//   currentLanguage: state.language.currentLanguage,
// });

// export default connect(mapStateToProps)(TranslatableText);

// src/shared/TranslatableText.js
import React from 'react';
import {Text} from 'react-native';
import {useSelector} from 'react-redux';
import {translate} from '../store/utils/translate';

/**
 * Reusable component for translatable text
 * Automatically re-renders when language changes
 */
const TranslatableText = ({
  translationKey,
  variables,
  style,
  children,
  ...otherProps
}) => {
  // Subscribe to language changes to trigger re-render
  useSelector(state => state.language.currentLanguage);

  // If translationKey is provided, use translation
  if (translationKey) {
    const translatedText = translate(translationKey, variables);
    return (
      <Text style={style} {...otherProps}>
        {translatedText}
      </Text>
    );
  }

  // Otherwise, render children as-is
  return (
    <Text style={style} {...otherProps}>
      {children}
    </Text>
  );
};

export default TranslatableText;
