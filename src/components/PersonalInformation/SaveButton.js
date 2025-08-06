import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

const SaveButton = ({isLoading, onSave}) => {
  return (
    <TouchableOpacity onPress={onSave} style={styles.saveButton}>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <Text style={styles.saveButtonText}>Save & Submit</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  saveButton: {
    backgroundColor: '#0A66C2',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    position: 'relative',
    alignSelf: 'center',
    width: 320,
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SaveButton;
