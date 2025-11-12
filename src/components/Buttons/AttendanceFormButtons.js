import React from 'react';
import {View, Text, Pressable} from 'react-native';
import styles from '../../styles/styles';

const AttendanceFormButtons = ({
  mode = 'create',
  processingButton = '',
  onSave,
  onCancel,
  isSaveDisabled = false,
  isSubmitDisabled = false,
  isCancelDisabled = false,
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
          isSaveDisabled && styles.LReqSR_DisabledButton,
        ]}
        onPress={handleSavePress}
        disabled={isSaveDisabled}>
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
          isSubmitDisabled && styles.LReqSR_DisabledButton,
        ]}
        onPress={handleSubmitPress}
        disabled={isSubmitDisabled}>
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
          isCancelDisabled && styles.LReqSR_pressedCancelButton,
        ]}
        onPress={handleCancelPress}
        disabled={isCancelDisabled}>
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

export default AttendanceFormButtons;
