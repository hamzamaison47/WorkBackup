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
    if (!isDisabled && processingButton === '') {
      onSave?.('create');
    }
  };

  const handleSubmitPress = () => {
    if (!isDisabled && processingButton === '') {
      onSave?.('submit');
    }
  };

  const handleCancelPress = () => {
    if (!isDisabled && processingButton === '') {
      onCancel?.();
    }
  };

  const getButtonFlex = () => {
    const visibleCount = showButtons.length;
    if (visibleCount === 1) return 0.5;
    if (visibleCount === 2) return 1;
    return 1;
  };

  const buttonFlex = getButtonFlex();
  const isSingleButton = showButtons.length === 1;

  // Helper function to get button text based on mode
  const getButtonText = (buttonType, isProcessing) => {
    if (isProcessing) {
      return 'Processing...';
    }

    switch (buttonType) {
      case 'CREATE':
        return mode === 'edit' ? 'Update' : 'Create';
      case 'SUBMIT':
        return mode === 'edit' ? 'Update & Submit' : 'Create & Submit';
      case 'CANCEL':
        return 'Cancel';
      default:
        return '';
    }
  };

  // Check if specific button is processing
  const isButtonProcessing = buttonType => {
    if (buttonType === 'CREATE') return processingButton === 'create';
    if (buttonType === 'SUBMIT') return processingButton === 'submit';
    return false;
  };

  // Check if button should be disabled
  const isButtonDisabled = buttonType => {
    if (isDisabled) return true;
    if (processingButton === '') return false;
    // Disable all buttons when any button is processing
    return true;
  };

  return (
    <View
      style={[
        styles.SRBtn_Footer,
        isSingleButton && styles.SRBtn_SingleButtonFooter,
      ]}>
      {/* Create Button */}
      {showButtons.includes(BUTTON_TYPES.CREATE) && (
        <Pressable
          style={({pressed}) => [
            styles.SRBtn_Button,
            {flex: buttonFlex},
            pressed &&
              !isButtonDisabled('CREATE') &&
              styles.SRBtn_PressedButton,
            isButtonDisabled('CREATE') && styles.SRBtn_DisabledButton,
            isSingleButton && styles.SRBtn_SingleButton,
          ]}
          onPress={handleCreatePress}
          disabled={isButtonDisabled('CREATE')}>
          {({pressed}) => (
            <Text
              style={[
                styles.SRBtn_ButtonText,
                pressed &&
                  !isButtonDisabled('CREATE') &&
                  styles.SRBtn_pressedText,
                isSingleButton && styles.SRBtn_SingleButtonText,
              ]}>
              {getButtonText(BUTTON_TYPES.CREATE, isButtonProcessing('CREATE'))}
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
            pressed &&
              !isButtonDisabled('SUBMIT') &&
              styles.SRBtn_pressedSubmitButton,
            isButtonDisabled('SUBMIT') && styles.SRBtn_DisabledButton,
            isSingleButton && styles.SRBtn_SingleButton,
          ]}
          onPress={handleSubmitPress}
          disabled={isButtonDisabled('SUBMIT')}>
          {({pressed}) => (
            <Text
              style={[
                styles.SRBtn_SubmitButtonText,
                isSingleButton && styles.SRBtn_SingleButtonText,
              ]}>
              {getButtonText(BUTTON_TYPES.SUBMIT, isButtonProcessing('SUBMIT'))}
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
            pressed &&
              !isButtonDisabled('CANCEL') &&
              styles.SRBtn_pressedCancelButton,
            isButtonDisabled('CANCEL') && styles.SRBtn_DisabledButton,
            isSingleButton && styles.SRBtn_SingleButton,
          ]}
          onPress={handleCancelPress}
          disabled={isButtonDisabled('CANCEL')}>
          {({pressed}) => (
            <Text
              style={[
                styles.SRBtn_CancelButtonText,
                pressed &&
                  !isButtonDisabled('CANCEL') &&
                  styles.SRBtn_pressedCancelText,
                isSingleButton && styles.SRBtn_SingleButtonText,
              ]}>
              {getButtonText(BUTTON_TYPES.CANCEL, false)}
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
};

export default SaveRecordButtons;
export {BUTTON_TYPES};
