import React from 'react';
import {ScrollView, StyleSheet, View, Text} from 'react-native';
import CertificateCard from './CertificateCard';

const CertificateList = ({data, onCardPress}) => {
  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyText}>No Certificates Available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {data.map((item, index) => (
        <CertificateCard key={index} certificate={item} onPress={onCardPress} />
      ))}
    </ScrollView>
  );
};

export default CertificateList;

const styles = StyleSheet.create({
  container: {flex: 1, padding: 12, backgroundColor: '#f8fafc'},
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {fontSize: 64, marginBottom: 16},
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999999',
  },
});
