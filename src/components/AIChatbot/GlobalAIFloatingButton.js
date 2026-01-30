// components/GlobalAIFloatingButton.js
import React, {useState} from 'react';
import {TouchableOpacity, Text, StyleSheet} from 'react-native';

const GlobalAIFloatingButton = ({onPress}) => {
  const [isPulsing, setIsPulsing] = useState(false);

  // Start pulsing animation every 10 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 1000);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <TouchableOpacity
      style={[styles.floatingButton, isPulsing && styles.pulsingButton]}
      onPress={onPress}
      activeOpacity={0.8}>
      <Text style={styles.buttonIcon}>🤖</Text>
      <Text style={styles.buttonText}>AI</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 9999,
  },
  pulsingButton: {
    transform: [{scale: 1.1}],
    backgroundColor: '#1565C0',
  },
  buttonIcon: {
    fontSize: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
});

export default GlobalAIFloatingButton;
