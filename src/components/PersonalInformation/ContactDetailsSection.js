/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import styles from '../../styles/styles';
import AlertDeleteModal from '../Alert/AlertDeleteModal';
import brand from '../../theme/brand';

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
        <Text style={styles.CntDtlSec_cardTextHeading}>
          No Contact Details Available
        </Text>
      );
    }
    return <Text style={styles.CntDtlSec_cardTextHeading}>Details:</Text>;
  };

  return (
    <View style={styles.CntDtlSec_detailsContainer}>
      {renderDetailsHeader()}
      {nameRows && nameRows.length > 0 && (
        <View style={styles.CntDtlSec_detailsContainerBorder}>
          {nameRows.map((row, index) => (
            <View key={index} style={styles.CntDtlSec_textContainer}>
              <View style={styles.CntDtlSec_textContainers}>
                <Text style={styles.CntDtlSec_insideCardTextHeading}>
                  Type: {typeMapping[row.Type]}
                </Text>

                <View style={styles.CntDtlSec_iconsContainer}>
                  <TouchableOpacity
                    onPress={() => confirmDeleteLeave(row.RecId)} // Pass RecId to delete confirmation
                    style={styles.CntDtlSec_deleteIconContainer}>
                    <Icon name="trash" size={16} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => onEdit(row)} // Pass entire row to the onEdit handler
                    style={styles.CntDtlSec_editIconContainer}>
                    <Icon name="edit" size={16} color={brand.onPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.CntDtlSec_textContainers}>
                <Text style={styles.CntDtlSec_cardSideTextHeading}>
                  Address
                </Text>
                <Text style={styles.CntDtlSec_cardText}>{row.Locator}</Text>
              </View>

              <View style={styles.CntDtlSec_textContainers}>
                <Text style={styles.CntDtlSec_cardSideTextHeading}>
                  Extension
                </Text>
                <Text style={styles.CntDtlSec_cardText}>
                  {row.Extension || 'N/A'}
                </Text>
              </View>

              <View style={styles.CntDtlSec_textContainers}>
                <Text style={styles.CntDtlSec_cardSideTextHeading}>
                  Primary
                </Text>
                <Text style={styles.CntDtlSec_cardText}>
                  {row.IsPrimary ? 'Yes' : 'No'}
                </Text>
              </View>

              <View style={styles.CntDtlSec_textContainers}>
                <Text style={styles.CntDtlSec_cardSideTextHeading}>
                  Description
                </Text>
                <Text style={styles.CntDtlSec_cardText}>{row.Description}</Text>
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

      <TouchableOpacity
        onPress={onCreate}
        style={styles.CntDtlSec_createIconContainer}>
        <Icon name="plus" size={16} color={brand.onPrimary} />
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

export default ContactDetailsSection;
