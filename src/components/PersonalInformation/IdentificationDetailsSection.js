/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {AlertDeleteModal} from '../Leaves/AlertModal';

const IdentificationDetailsSection = ({
  IdentityrRows,
  onCreate,
  onEdit,
  onDelete,
}) => {
  const [identificationRows, setIdentificationRows] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [selectedRecId, setSelectedRecId] = useState(null); // State to store the selected RecId

  useEffect(() => {
    if (IdentityrRows) {
      const formattedRows = IdentityrRows.map(item => ({
        RecId: item.RecId || 0,
        Description: item.Description || 'N/A',
        Classification: item.Classification || 'N/A',
        IdentificationNumber: item.IdentificationNumber || 'N/A',
        IdentificationTypeId: item.IdentificationTypeId || 'N/A',
        IssuedDate: item.IssuedDate || 'N/A',
        ExpirationDate: item.ExpirationDate || 'N/A',
        IssuingAgencyId: item.IssuingAgencyId || 'N/A',
        IsPrimary: item.IsPrimary,
        WorkflowOperation: item.WorkflowOperation || 'N/A',
        ApprovalStatus: item.ApprovalStatus || 'N/A',
      }));
      setIdentificationRows(formattedRows);
    }
  }, [IdentityrRows]);

  const confirmDeleteLeave = RecId => {
    setSelectedRecId(RecId); // Store the RecId of the row to be deleted
    setAlertModal(true);
  };

  const renderDetailsHeader = () => {
    if (!identificationRows || identificationRows.length === 0) {
      return (
        <Text style={styles.cardTextHeading}>
          No Identification Details Available
        </Text>
      );
    }
    return <Text style={styles.cardTextHeading}>Details:</Text>;
  };

  const ExceptionDate = date =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

  return (
    <View style={styles.detailsContainer}>
      {renderDetailsHeader()}
      {identificationRows && identificationRows.length > 0 && (
        <View style={styles.detailsContainerBorder}>
          {identificationRows.map((row, index) => (
            <View key={index} style={styles.textContainer}>
              <View style={styles.textContainers}>
                <Text style={styles.insideCardTextHeading}>
                  Identification Type: {row.IdentificationTypeId}
                </Text>
                <View style={styles.iconsContainer}>
                  <TouchableOpacity
                    onPress={() => confirmDeleteLeave(row.RecId)}
                    style={styles.deleteIconContainer}>
                    <Icon name="trash" size={16} color="#fff" />
                  </TouchableOpacity>

                  {/* <TouchableOpacity
                    onPress={() => onEdit(row)}
                    style={styles.editIconContainer}>
                    <Icon name="edit" size={16} color="#fff" />
                  </TouchableOpacity> */}
                </View>
              </View>

              <View style={styles.textContainers}>
                <Text style={styles.cardSideTextHeading}>
                  Identification Number
                </Text>
                <Text style={styles.cardText}>{row.IdentificationNumber}</Text>
              </View>

              <View style={styles.textContainers}>
                <Text style={styles.cardSideTextHeading}>Description</Text>
                <Text style={styles.cardText}>{row.Description}</Text>
              </View>

              <View style={styles.textContainers}>
                <Text style={styles.cardSideTextHeading}>Entry type</Text>
                <Text style={styles.cardText}>{row.Classification}</Text>
              </View>

              <View style={styles.textContainers}>
                <Text style={styles.cardSideTextHeading}>Primary</Text>
                <Text style={styles.cardText}>
                  {row.IsPrimary ? 'Yes' : 'No'}
                </Text>
              </View>

              <View style={styles.textContainers}>
                <Text style={styles.cardSideTextHeading}>Issuing Agency</Text>
                <Text style={styles.cardText}>{row.IssuingAgencyId}</Text>
              </View>

              <View style={styles.textContainers}>
                <Text style={styles.cardSideTextHeading}>Issued Date</Text>
                <Text style={styles.cardText}>
                  {ExceptionDate(row.IssuedDate)}
                </Text>
              </View>

              <View style={styles.textContainers}>
                <Text style={styles.cardSideTextHeading}>Expiration Date</Text>
                <Text style={styles.cardText}>
                  {ExceptionDate(row.ExpirationDate)}
                </Text>
              </View>

              <View style={styles.textContainers}>
                <Text style={styles.cardSideTextHeading}>Status</Text>
                <Text style={styles.cardText}>{row.ApprovalStatus}</Text>
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
    backgroundColor: '#ffe8d1',
  },
  detailsContainerBorder: {
    padding: 16,
    marginTop: 16,
    backgroundColor: '#fffcf7',
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
    marginVertical: 5,
  },
  cardSideTextHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#808080',
  },
  cardText: {
    fontSize: 14,
    color: '#808080',
  },
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFA500',
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
    backgroundColor: '#FFA500',
    borderRadius: 5,
    padding: 8,
    marginTop: 15,
  },
});

export default IdentificationDetailsSection;
