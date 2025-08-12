import React from 'react';
import {TouchableOpacity, Text, ActivityIndicator} from 'react-native';
import {styles} from '../../styles/styles';

const SaveButton = ({isLoading, onSave}) => {
  return (
    <TouchableOpacity onPress={onSave} style={styles.SB_saveButton}>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <Text style={styles.SB_saveButtonText}>Save & Submit</Text>
      )}
    </TouchableOpacity>
  );
};

export default SaveButton;
