import React, {useState} from 'react';
import {styles} from '../../styles/LeaveRequestStyles';
import LinearGradient from 'react-native-linear-gradient';
import {View, Text, TouchableOpacity} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {AlertDeleteModal} from '../Leaves/AlertModal';

export const AdvanceCard = ({
  RecId,
  AdvanceTypeCode,
  AdvanceAmount,
  RequestDate,
  AdvanceDescription,
  AdvanceRequestId,
  WFStatus,
  onPress,
  onDelete,
}) => {
  const [alertModal, setAlertModal] = useState(false);

  const isEditDisabled = WFStatus !== 'Draft';
  const isDeleteDisabled = WFStatus !== 'Draft';

  const confirmDeleteLeave = () => {
    setAlertModal(true);
  };

  const advanceAmountValue = String(AdvanceAmount).replace(/[^0-9]/g, '');
  const formattedAdvanceAmount = new Intl.NumberFormat().format(
    advanceAmountValue,
  );

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={['#FFF3E0', '#FFF3E0', '#FFF3E0']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.card}>
        {/* Header Text and Edit Button */}

        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>{AdvanceTypeCode}</Text>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={onPress}
              style={[styles.buttons, isEditDisabled && styles.disabledButton]}
              disabled={isEditDisabled}>
              <FontAwesome name="edit" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => confirmDeleteLeave()}
              style={[
                styles.buttons,
                isDeleteDisabled && styles.disabledButton,
              ]}
              disabled={isDeleteDisabled}>
              <FontAwesome name="trash" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.cardContent}>
          <View style={styles.textContainer}>
            <Text style={styles.cardTextHeading}>Advance Request Id:</Text>
            <Text style={styles.cardText}>{AdvanceRequestId}</Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.cardTextHeading}>Advance Amount:</Text>
            <Text style={styles.cardText}>{formattedAdvanceAmount}</Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.cardTextHeading}>Advance Description:</Text>
            <Text style={styles.cardText}>{AdvanceDescription}</Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.cardTextHeading}>Request Date:</Text>
            <Text style={styles.cardText}>
              {RequestDate
                ? isNaN(Date.parse(RequestDate))
                  ? 'Invalid Date'
                  : new Date(RequestDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })
                : 'N/A'}
            </Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.cardTextHeading}>Status:</Text>
            <Text style={styles.cardTextHeading}>{WFStatus}</Text>
          </View>
        </View>
      </LinearGradient>

      <AlertDeleteModal
        visible={alertModal}
        heading="Confirm Deletion"
        text="Are you sure you want to delete this Advance Salary?"
        onPress={() => {
          onDelete(RecId);
          setAlertModal(false);
        }}
        onCancel={() => setAlertModal(false)}
      />
    </View>
  );
};
