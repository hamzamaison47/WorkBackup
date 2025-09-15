import React from 'react';
import {View, Text, Pressable} from 'react-native';
import styles from '../../styles/styles';

const SaveRecordButtons = ({
  mode = 'create',
  processingButton = '',
  onSave,
  onCancel,
  isDisabled = false,
}) => {
  const handleSavePress = () => {
    if (onSave && typeof onSave === 'function') {
      onSave('save');
    }
  };

  const handleSubmitPress = () => {
    if (onSave && typeof onSave === 'function') {
      onSave('submit');
    }
  };

  const handleCancelPress = () => {
    if (onCancel && typeof onCancel === 'function') {
      onCancel();
    }
  };

  return (
    <View style={styles.LReqSR_Footer}>
      {/* Save/Update Button */}
      <Pressable
        style={({pressed}) => [
          styles.LReqSR_Button,
          pressed && styles.LReqSR_PressedButton,
          isDisabled && styles.LReqSR_DisabledButton,
        ]}
        onPress={handleSavePress}
        disabled={isDisabled}>
        {({pressed}) => (
          <Text
            style={[
              styles.LReqSR_ButtonText,
              pressed && styles.LReqSR_pressedText,
            ]}>
            {processingButton === 'save'
              ? 'Processing...'
              : mode === 'edit'
              ? 'Update'
              : 'Create'}
          </Text>
        )}
      </Pressable>

      {/* Submit Button */}
      <Pressable
        style={({pressed}) => [
          styles.LReqSR_Button,
          styles.LReqSR_SubmitButton,
          pressed && styles.LReqSR_pressedSubmitButton,
          isDisabled && styles.LReqSR_DisabledButton,
        ]}
        onPress={handleSubmitPress}
        disabled={isDisabled}>
        {({pressed}) => (
          <Text
            style={[
              styles.LReqSR_SubmitButtonText,
              pressed && styles.LReqSR_pressedText,
            ]}>
            {processingButton === 'submit'
              ? 'Processing...'
              : mode === 'edit'
              ? 'Update & Submit'
              : 'Create & Submit'}
          </Text>
        )}
      </Pressable>

      {/* Cancel Button */}
      <Pressable
        style={({pressed}) => [
          styles.LReqSR_Button,
          pressed && styles.LReqSR_CancelButton,
          isDisabled && styles.LReqSR_pressedCancelButton,
        ]}
        onPress={handleCancelPress}
        disabled={isDisabled}>
        {({pressed}) => (
          <Text
            style={[
              styles.LReqSR_CancelButtonText,
              pressed && styles.LReqSR_pressedCancelText,
            ]}>
            Cancel
          </Text>
        )}
      </Pressable>
    </View>
  );
};

export default SaveRecordButtons;
