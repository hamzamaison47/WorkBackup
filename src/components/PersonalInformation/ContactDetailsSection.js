/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {AlertDeleteModal} from '../Alert/AlertModal';

const ContactDetailsSection = ({ContactRows, onCreate, onEdit, onDelete}) => {
  const [nameRows, setNameRows] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [selectedRecId, setSelectedRecId] = useState(null); // State to store the selected RecId

  useEffect(() => {
    if (ContactRows) {
      const formattedRows = ContactRows.map(item => ({
        RecId: item.RecId || 0,
        Description: item.Description || 'N/A',
        Type: item.Type || 'N/A',
        Locator: item.Locator || 'N/A',
        Extension: item.LocatorExtension || 'N/A',
        IsPrimary: item.IsPrimary,
      }));
      setNameRows(formattedRows);
    }
  }, [ContactRows]);

  const confirmDeleteLeave = RecId => {
    setSelectedRecId(RecId); // Store the RecId of the row to be deleted
    setAlertModal(true);
  };

  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  const typeMapping = {
    0: 'None',
    1: 'Phone',
    2: 'Email address',
    3: 'URL',
    4: 'Telex',
    5: 'Fax',
    6: 'Facebook',
    7: 'Twitter',
    8: 'LinkedIn',
    9: 'Home number',
    10: 'Work number',
    11: 'Mobile number',
  };

  const renderDetailsHeader = () => {
    if (!nameRows || nameRows.length === 0) {
      return (
        <Text style={styles.cardTextHeading}>No Contact Details Available</Text>
      );
    }
    return <Text style={styles.cardTextHeading}>Details:</Text>;
  };

  return (
    <View style={styles.detailsContainer}>
      {renderDetailsHeader()}
      {nameRows && nameRows.length > 0 && (
        <View style={styles.detailsContainerBorder}>
          {nameRows.map((row, index) => (
            <View key={index} style={styles.textContainer}>
              <View style={styles.textContainers}>
                <Text style={styles.insideCardTextHeading}>
                  Type: {typeMapping[row.Type]}
                </Text>

                <View style={styles.iconsContainer}>
                  <TouchableOpacity
                    onPress={() => confirmDeleteLeave(row.RecId)} // Pass RecId to delete confirmation
                    style={styles.deleteIconContainer}>
                    <Icon name="trash" size={16} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => onEdit(row)} // Pass entire row to the onEdit handler
                    style={styles.editIconContainer}>
                    <Icon name="edit" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.textContainers}>
                <Text style={styles.cardSideTextHeading}>Address</Text>
                <Text style={styles.cardText}>{row.Locator}</Text>
              </View>

              <View style={styles.textContainers}>
                <Text style={styles.cardSideTextHeading}>Extension</Text>
                <Text style={styles.cardText}>{row.Extension || 'N/A'}</Text>
              </View>

              <View style={styles.textContainers}>
                <Text style={styles.cardSideTextHeading}>Primary</Text>
                <Text style={styles.cardText}>
                  {row.IsPrimary ? 'Yes' : 'No'}
                </Text>
              </View>

              <View style={styles.textContainers}>
                <Text style={styles.cardSideTextHeading}>Description</Text>
                <Text style={styles.cardText}>{row.Description}</Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 10,
                }}>
                <View style={{flex: 1, height: 1, backgroundColor: 'grey'}} />
                <View style={{flex: 1, height: 1, backgroundColor: 'grey'}} />
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity onPress={onCreate} style={styles.createIconContainer}>
        <Icon name="plus" size={16} color="#fff" />
      </TouchableOpacity>

      <AlertDeleteModal
        visible={alertModal}
        heading="Confirm Deletion"
        text="Are you sure you want to Delete this Record?"
        onPress={() => {
          onDelete(selectedRecId);
          setAlertModal(false);
        }}
        onCancel={() => setAlertModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  detailsContainer: {
    padding: 16,
    backgroundColor: '#bddeff',
  },
  detailsContainerBorder: {
    padding: 16,
    marginTop: 16,
    backgroundColor: '#cce6ff',
    borderRadius: 5,
    elevation: 3,
  },
  textContainer: {
    marginBottom: 16,
  },
  textContainers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  cardTextHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
  insideCardTextHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    flexShrink: 1,
  },
  cardSideTextHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#808080',
    flexShrink: 0,
    width: '30%',
  },
  cardText: {
    fontSize: 14,
    color: '#808080',
    flexShrink: 1,
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A66C2',
    borderRadius: 25,
    height: 30,
    width: 30,
    alignSelf: 'flex-end',
    marginLeft: 5,
  },
  deleteIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff292c',
    borderRadius: 25,
    height: 30,
    width: 30,
    alignSelf: 'flex-end',
    marginRight: 5,
  },
  createIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A66C2',
    borderRadius: 5,
    padding: 8,
    marginTop: 15,
  },
});

export default ContactDetailsSection;
