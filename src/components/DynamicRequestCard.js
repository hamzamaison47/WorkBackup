// /* eslint-disable react-native/no-inline-styles */
// /* eslint-disable curly */
// import React, {useState, useEffect} from 'react';
// import {View, Text, TouchableOpacity} from 'react-native';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';
// import LinearGradient from 'react-native-linear-gradient';
// import styles from '../styles/styles';

// const DynamicRequestCard = ({
//   data = {},
//   fields = [],
//   headerConfig = {},
//   buttons = {},
//   gradientColors = ['#6ee0ff', '#bddeff', '#cce6ff'],
//   highlightGradientColors = ['#E8F5E8', '#F0FFF0'],
//   isHighlighted = false,
//   expandableFields = [],
//   isExpandable = true,
//   onButtonPress = () => {},
//   processingButtons = [], // New prop to track which buttons are processing
// }) => {
//   const [expanded, setExpanded] = useState(false);

//   useEffect(() => {
//     if (isHighlighted) {
//       console.log('Card highlighted');
//     }
//   }, [isHighlighted]);

//   // Helper function to get gradient colors
//   const getGradientColors = () => {
//     return isHighlighted ? highlightGradientColors : gradientColors;
//   };

//   const formatValue = (value, fieldType) => {
//     switch (fieldType) {
//       case 'date': {
//         const d = new Date(value);
//         const month = String(d.getMonth() + 1).padStart(2, '0');
//         const day = String(d.getDate()).padStart(2, '0');
//         const year = d.getFullYear(); // always 4-digit
//         return `${month}/${day}/${year}`;
//       }
//       case 'currency':
//         return `${value}`;
//       case 'status':
//         return value;
//       default:
//         return value || 'N/A';
//     }
//   };

//   // Render field row
//   const renderField = (field, index) => {
//     const value = data[field.key];
//     const formattedValue = formatValue(value, field.type);

//     if (field.type === 'status') {
//       return (
//         <View key={index} style={styles.DRC_InfoBlock}>
//           <Text style={styles.DRC_StatusText}>{formattedValue}</Text>
//         </View>
//       );
//     }

//     return (
//       <View key={index} style={styles.DRC_InfoBlock}>
//         <Text style={styles.DRC_Label}>{field.label}:</Text>
//         <Text style={styles.DRC_Value}>{formattedValue}</Text>
//       </View>
//     );
//   };

//   // Render button
//   const renderButton = (buttonKey, buttonConfig) => {
//     if (!buttonConfig.show) return null;

//     const isProcessing = processingButtons.includes(buttonKey);
//     const isDisabled =
//       buttonConfig.disabled || isProcessing || processingButtons.length > 0;

//     return (
//       <TouchableOpacity
//         key={buttonKey}
//         onPress={() => onButtonPress(buttonKey, data)}
//         disabled={isDisabled}
//         style={[
//           buttonConfig.style === 'icon'
//             ? styles.DRC_IconButton
//             : styles.DRC_TextButton,
//           isDisabled && styles.DRC_Disabled,
//           buttonConfig.customStyle,
//         ]}>
//         {buttonConfig.icon && !isProcessing && (
//           <FontAwesome
//             name={buttonConfig.icon}
//             size={buttonConfig.iconSize || 16}
//             color={isDisabled ? '#999' : buttonConfig.iconColor || '#0A66C2'}
//           />
//         )}
//         {isProcessing && (
//           <FontAwesome
//             name="spinner"
//             size={buttonConfig.iconSize || 16}
//             color="#999"
//           />
//         )}
//         {buttonConfig.text && (
//           <Text
//             style={[
//               buttonConfig.style === 'icon'
//                 ? styles.DRC_IconButtonText
//                 : styles.DRC_TextButtonText,
//               isDisabled && styles.DRC_DisabledText,
//               {
//                 color: isDisabled
//                   ? '#999'
//                   : buttonConfig.textColor || '#0A66C2',
//               },
//             ]}>
//             {isProcessing ? 'Processing...' : buttonConfig.text}
//           </Text>
//         )}
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <View
//       style={[
//         styles.DRC_CardContainer,
//         isHighlighted && styles.DRC_HighlightedContainer,
//       ]}>
//       <LinearGradient
//         colors={getGradientColors()}
//         start={{x: 0, y: 0}}
//         end={{x: 1, y: 1}}
//         style={styles.DRC_Card}>
//         {/* Header */}
//         <View style={styles.DRC_CardHeader}>
//           <View>
//             {headerConfig.title && (
//               <Text style={styles.DRC_CardHeaderText}>
//                 {data[headerConfig.title.key] ||
//                   headerConfig.title.defaultValue}
//               </Text>
//             )}
//             {headerConfig.subtitle && (
//               <Text style={styles.DRC_CardSubHeaderText}>
//                 {data[headerConfig.subtitle.key] ||
//                   headerConfig.subtitle.defaultValue}
//               </Text>
//             )}
//           </View>

//           {/* Header buttons */}
//           <View style={styles.DRC_ButtonsContainer}>
//             {Object.entries(buttons)
//               .filter(([key, config]) => config.position === 'header')
//               .map(([key, config]) => renderButton(key, config))}
//           </View>
//         </View>

//         {/* Main fields */}
//         {fields.map((field, index) => renderField(field, index))}

//         {/* Expandable content */}
//         {expanded && expandableFields.length > 0 && (
//           <>
//             <View style={styles.DRC_SectionDivider} />
//             {expandableFields.map((field, index) => renderField(field, index))}
//           </>
//         )}

//         {/* Bottom container */}
//         <View style={styles.DRC_BottomContainer}>
//           {/* Expand toggle */}
//           {isExpandable && expandableFields.length > 0 && (
//             <TouchableOpacity
//               onPress={() => setExpanded(!expanded)}
//               style={styles.DRC_ExpandToggle}>
//               <FontAwesome
//                 name={expanded ? 'chevron-up' : 'chevron-down'}
//                 size={18}
//                 color="#fff"
//               />
//             </TouchableOpacity>
//           )}

//           {/* Bottom buttons */}
//           <View style={styles.DRC_BottomButtonsContainer}>
//             {Object.entries(buttons)
//               .filter(([key, config]) => config.position === 'bottom')
//               .map(([key, config]) => renderButton(key, config))}
//           </View>
//         </View>
//       </LinearGradient>
//     </View>
//   );
// };

/* eslint-disable react-native/no-inline-styles */
/* eslint-disable curly */
import React, {useState, useEffect, useRef} from 'react';
import {View, Text, TouchableOpacity, Animated} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import styles from '../styles/styles';

const DynamicRequestCard = ({
  data = {},
  fields = [],
  headerConfig = {},
  buttons = {},
  gradientColors = ['#6ee0ff', '#bddeff', '#cce6ff'],
  highlightGradientColors = ['#E8F5E8', '#F0FFF0'],
  isHighlighted = false,
  expandableFields = [],
  isExpandable = true,
  onButtonPress = () => {},
  processingButtons = [],
  showNavigationArrow = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const animationIntervalRef = useRef(null);

  useEffect(() => {
    if (isHighlighted) {
      console.log('Card highlighted');
    }
  }, [isHighlighted]);

  // Continuous arrow animation every 5 seconds
  useEffect(() => {
    if (showNavigationArrow) {
      const startAnimation = () => {
        // Bounce animation sequence
        Animated.sequence([
          Animated.timing(arrowAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(arrowAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(arrowAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(arrowAnim, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      };

      // Start immediately
      startAnimation();

      // Set interval for continuous animation
      animationIntervalRef.current = setInterval(() => {
        startAnimation();
      }, 3000); // Repeat every 3 seconds

      return () => {
        if (animationIntervalRef.current) {
          clearInterval(animationIntervalRef.current);
        }
      };
    } else {
      // Reset animation when arrow is hidden
      arrowAnim.setValue(0);
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    }
  }, [showNavigationArrow, arrowAnim]);

  // Helper function to get gradient colors
  const getGradientColors = () => {
    return isHighlighted ? highlightGradientColors : gradientColors;
  };

  const formatValue = (value, fieldType) => {
    switch (fieldType) {
      case 'date': {
        const d = new Date(value);
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        return `${month}/${day}/${year}`;
      }
      case 'currency':
        return `${value}`;
      case 'status':
        return value;
      default:
        return value || 'N/A';
    }
  };

  // Render field row
  const renderField = (field, index) => {
    const value = data[field.key];
    const formattedValue = formatValue(value, field.type);

    if (field.type === 'status') {
      return (
        <View key={index} style={styles.DRC_InfoBlock}>
          <Text style={styles.DRC_StatusText}>{formattedValue}</Text>
        </View>
      );
    }

    return (
      <View key={index} style={styles.DRC_InfoBlock}>
        <Text style={styles.DRC_Label}>{field.label}:</Text>
        <Text
          style={[
            styles.DRC_Value,
            showNavigationArrow && styles.DRC_ValueWithArrow,
          ]}>
          {formattedValue}
        </Text>
      </View>
    );
  };

  // Render button
  const renderButton = (buttonKey, buttonConfig) => {
    if (!buttonConfig.show) return null;

    const isProcessing = processingButtons.includes(buttonKey);
    const isDisabled =
      buttonConfig.disabled || isProcessing || processingButtons.length > 0;

    return (
      <TouchableOpacity
        key={buttonKey}
        onPress={() => onButtonPress(buttonKey, data)}
        disabled={isDisabled}
        style={[
          buttonConfig.style === 'icon'
            ? styles.DRC_IconButton
            : styles.DRC_TextButton,
          isDisabled && styles.DRC_Disabled,
          buttonConfig.customStyle,
        ]}>
        {buttonConfig.icon && !isProcessing && (
          <FontAwesome
            name={buttonConfig.icon}
            size={buttonConfig.iconSize || 16}
            color={isDisabled ? '#999' : buttonConfig.iconColor || '#0A66C2'}
          />
        )}
        {isProcessing && (
          <FontAwesome
            name="spinner"
            size={buttonConfig.iconSize || 16}
            color="#999"
          />
        )}
        {buttonConfig.text && (
          <Text
            style={[
              buttonConfig.style === 'icon'
                ? styles.DRC_IconButtonText
                : styles.DRC_TextButtonText,
              isDisabled && styles.DRC_DisabledText,
              {
                color: isDisabled
                  ? '#999'
                  : buttonConfig.textColor || '#0A66C2',
              },
            ]}>
            {isProcessing ? 'Processing...' : buttonConfig.text}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // Render navigation arrow with continuous animation
  const renderNavigationArrow = () => {
    if (!showNavigationArrow) return null;

    const arrowStyle = {
      transform: [
        {
          translateX: arrowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 8], // Move to the right
          }),
        },
        {
          scale: arrowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.2], // Scale up
          }),
        },
      ],
      opacity: arrowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.9], // Slight opacity change
      }),
    };

    return (
      <Animated.View style={[styles.DRC_NavigationArrow, arrowStyle]}>
        <FontAwesome name="chevron-right" size={14} color="#0A66C2" />
      </Animated.View>
    );
  };

  return (
    <View
      style={[
        styles.DRC_CardContainer,
        isHighlighted && styles.DRC_HighlightedContainer,
        showNavigationArrow && styles.DRC_ClickableContainer,
      ]}>
      <LinearGradient
        colors={getGradientColors()}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.DRC_Card}>
        {/* Navigation Arrow - Only shows when showNavigationArrow is true */}
        {renderNavigationArrow()}

        {/* Header */}
        <View style={styles.DRC_CardHeader}>
          <View
            style={
              showNavigationArrow
                ? styles.DRC_HeaderContentWithArrow
                : {flex: 1}
            }>
            {headerConfig.title && (
              <Text style={styles.DRC_CardHeaderText}>
                {data[headerConfig.title.key] ||
                  headerConfig.title.defaultValue}
              </Text>
            )}
            {headerConfig.subtitle && (
              <Text style={styles.DRC_CardSubHeaderText}>
                {data[headerConfig.subtitle.key] ||
                  headerConfig.subtitle.defaultValue}
              </Text>
            )}
          </View>

          {/* Header buttons - Slide left when arrow is shown */}
          <View
            style={[
              styles.DRC_ButtonsContainer,
              showNavigationArrow && styles.DRC_ButtonsContainerWithArrow,
            ]}>
            {Object.entries(buttons)
              .filter(([key, config]) => config.position === 'header')
              .map(([key, config]) => renderButton(key, config))}
          </View>
        </View>

        {/* Main fields */}
        {fields.map((field, index) => renderField(field, index))}

        {/* Expandable content */}
        {expanded && expandableFields.length > 0 && (
          <>
            <View style={styles.DRC_SectionDivider} />
            {expandableFields.map((field, index) => renderField(field, index))}
          </>
        )}

        {/* Bottom container */}
        <View style={styles.DRC_BottomContainer}>
          {/* Expand toggle */}
          {isExpandable && expandableFields.length > 0 && (
            <TouchableOpacity
              onPress={() => setExpanded(!expanded)}
              style={styles.DRC_ExpandToggle}>
              <FontAwesome
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#fff"
              />
            </TouchableOpacity>
          )}

          {/* Bottom buttons - Slide left when arrow is shown */}
          <View
            style={[
              styles.DRC_BottomButtonsContainer,
              showNavigationArrow && styles.DRC_BottomButtonsContainerWithArrow,
            ]}>
            {Object.entries(buttons)
              .filter(([key, config]) => config.position === 'bottom')
              .map(([key, config]) => renderButton(key, config))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default DynamicRequestCard;
