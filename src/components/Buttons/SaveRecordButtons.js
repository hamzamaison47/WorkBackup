/* eslint-disable curly */
import React from 'react';
import {View, Text, Pressable} from 'react-native';
import styles from '../../styles/styles';

// Button type constants
const BUTTON_TYPES = {
  CREATE: 'CREATE',
  SUBMIT: 'SUBMIT',
  CANCEL: 'CANCEL',
};

const SaveRecordButtons = ({
  mode = 'create',
  processingButton = '',
  onSave,
  onCancel,
  isDisabled = false,
  showButtons = [BUTTON_TYPES.CREATE, BUTTON_TYPES.SUBMIT, BUTTON_TYPES.CANCEL],
}) => {
  const handleCreatePress = () => {
    onSave?.('save');
  };

  const handleSubmitPress = () => {
    onSave?.('submit');
  };

  const handleCancelPress = () => {
    onCancel?.();
  };

  const getButtonFlex = () => {
    const visibleCount = showButtons.length;
    if (visibleCount === 1) return 0.5;
    if (visibleCount === 2) return 1;
    return 1;
  };

  const buttonFlex = getButtonFlex();
  const isSingleButton = showButtons.length === 1;

  return (
    <View
      style={[
        styles.SRBtn_Footer,
        isSingleButton && styles.SRBtn_SingleButtonFooter, // Add this style for single button
      ]}>
      {/* Create Button */}
      {showButtons.includes(BUTTON_TYPES.CREATE) && (
        <Pressable
          style={({pressed}) => [
            styles.SRBtn_Button,
            {flex: buttonFlex},
            pressed && styles.SRBtn_PressedButton,
            isDisabled && styles.SRBtn_DisabledButton,
            isSingleButton && styles.SRBtn_SingleButton,
          ]}
          onPress={handleCreatePress}
          disabled={isDisabled}>
          {({pressed}) => (
            <Text
              style={[
                styles.SRBtn_ButtonText,
                pressed && styles.SRBtn_pressedText,
                isSingleButton && styles.SRBtn_SingleButtonText,
              ]}>
              {processingButton === 'save'
                ? 'Processing...'
                : mode === 'edit'
                ? 'Update'
                : 'Create'}
            </Text>
          )}
        </Pressable>
      )}

      {/* Submit Button */}
      {showButtons.includes(BUTTON_TYPES.SUBMIT) && (
        <Pressable
          style={({pressed}) => [
            styles.SRBtn_Button,
            styles.SRBtn_SubmitButton,
            {flex: buttonFlex},
            pressed && styles.SRBtn_pressedSubmitButton,
            isDisabled && styles.SRBtn_DisabledButton,
            isSingleButton && styles.SRBtn_SingleButton,
          ]}
          onPress={handleSubmitPress}
          disabled={isDisabled}>
          {({pressed}) => (
            <Text
              style={[
                styles.SRBtn_SubmitButtonText,
                pressed && styles.SRBtn_pressedText,
                isSingleButton && styles.SRBtn_SingleButtonText,
              ]}>
              {processingButton === 'submit'
                ? 'Processing...'
                : mode === 'edit'
                ? 'Update & Submit'
                : 'Create & Submit'}
            </Text>
          )}
        </Pressable>
      )}

      {/* Cancel Button */}
      {showButtons.includes(BUTTON_TYPES.CANCEL) && (
        <Pressable
          style={({pressed}) => [
            styles.SRBtn_Button,
            styles.SRBtn_CancelButton,
            {flex: buttonFlex},
            pressed && styles.SRBtn_pressedCancelButton,
            isDisabled && styles.SRBtn_DisabledButton,
            isSingleButton && styles.SRBtn_SingleButton,
          ]}
          onPress={handleCancelPress}
          disabled={isDisabled}>
          {({pressed}) => (
            <Text
              style={[
                styles.SRBtn_CancelButtonText,
                pressed && styles.SRBtn_pressedCancelText,
                isSingleButton && styles.SRBtn_SingleButtonText,
              ]}>
              Cancel
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
};

export default SaveRecordButtons;
export {BUTTON_TYPES};
