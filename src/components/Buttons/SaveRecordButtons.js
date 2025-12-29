/* eslint-disable curly */
import React from 'react';
import {View, Text, Pressable} from 'react-native';
import {useTranslation} from 'react-i18next';
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
  const {t} = useTranslation();

  const handleCreatePress = () => {
    onSave?.('create');
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

  // Helper function to get button text based on mode
  const getButtonText = (buttonType, isProcessing) => {
    if (isProcessing) {
      return buttonType === 'create'
        ? t('common.processing', {defaultValue: 'Processing...'})
        : t('common.processing', {defaultValue: 'Processing...'});
    }

    if (buttonType === 'CREATE') {
      return mode === 'edit'
        ? t('buttons.edit', {defaultValue: 'Update'})
        : t('buttons.create', {defaultValue: 'Create'});
    }

    if (buttonType === 'SUBMIT') {
      return mode === 'edit'
        ? t('leaveSaveRecord.updatedAndSubmitted', {
            defaultValue: 'Update & Submit',
          })
        : t('leaveSaveRecord.createdAndSubmitted', {
            defaultValue: 'Create & Submit',
          });
    }

    if (buttonType === 'CANCEL') {
      return t('buttons.cancel', {defaultValue: 'Cancel'});
    }

    return '';
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
              {getButtonText(
                BUTTON_TYPES.CREATE,
                processingButton === 'sacreateve',
              )}
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
              {getButtonText(
                BUTTON_TYPES.SUBMIT,
                processingButton === 'submit',
              )}
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
