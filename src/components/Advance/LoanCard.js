import React, {useState} from 'react';
import {styles} from '../../styles/LeaveRequestStyles';
import LinearGradient from 'react-native-linear-gradient';
import {View, Text, TouchableOpacity} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {AlertDeleteModal} from '../Leaves/AlertModal';

export const LoanCard = ({
  RecId,
  AdvanceTypeCode,
  AdvanceAmount,
  PaymentDate,
  RecoveryStartDate,
  RequestedInstallmentAmount,
  RequestedInstallments,
  RequestDate,
  AdvanceDescription,
  AdvanceRequestId,
  WFStatus,
  onPress,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [alertModal, setAlertModal] = useState(false);

  const isEditDisabled = WFStatus !== 'Draft';
  const isDeleteDisabled = WFStatus !== 'Draft';

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const confirmDeleteLeave = () => {
    setAlertModal(true);
  };

  const advanceAmountValue = String(AdvanceAmount).replace(/[^0-9]/g, '');
  const formattedAdvanceAmount = new Intl.NumberFormat().format(
    advanceAmountValue,
  );

  const recoveryAmountValue = String(RequestedInstallmentAmount).replace(
    /[^0-9]/g,
    '',
  );
  const formattedRecoveryAmount = new Intl.NumberFormat().format(
    recoveryAmountValue,
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
          {/* Summary Information (Visible in collapsed state) */}
          <View style={styles.textContainer}>
            <Text style={styles.cardTextHeading}>Payment Date:</Text>
            <Text style={styles.cardText}>
              {PaymentDate
                ? isNaN(Date.parse(PaymentDate))
                  ? 'Invalid Date'
                  : new Date(PaymentDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })
                : 'N/A'}
            </Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.cardTextHeading}>Recovery Start Date:</Text>
            <Text style={styles.cardText}>
              {RecoveryStartDate
                ? isNaN(Date.parse(RecoveryStartDate))
                  ? 'Invalid Date'
                  : new Date(RecoveryStartDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })
                : 'N/A'}
            </Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.cardTextHeading}>Advance Amount:</Text>
            <Text style={styles.cardText}>{formattedAdvanceAmount}</Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.cardTextHeading}>Recovery Amount:</Text>
            <Text style={styles.cardText}>{formattedRecoveryAmount}</Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.cardTextHeading}>Recoveries:</Text>
            <Text style={styles.cardText}>{RequestedInstallments}</Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.cardTextHeading}>Status:</Text>
            <Text style={styles.cardTextHeading}>{WFStatus}</Text>
          </View>

          {/* Expandable Content (Visible only when expanded) */}
          {expanded && (
            <>
              <View style={styles.sectionDivider} />

              <View style={styles.textContainer}>
                <Text style={styles.cardTextHeading}>Advance Request Id:</Text>
                <Text style={styles.cardText}>{AdvanceRequestId}</Text>
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.cardTextHeading}>Request Date:</Text>
                {/* <Text style={styles.cardText}>{formatDate(RequestDate)}</Text> */}
                <Text style={styles.cardText}>
                  {PaymentDate
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
                <Text style={styles.cardTextHeading}>Advance Description:</Text>
                <Text style={styles.cardText}>{AdvanceDescription}</Text>
              </View>

              <View style={styles.sectionDivider} />
            </>
          )}
        </View>

        {/* Expand/Collapse Button */}
        <TouchableOpacity onPress={toggleExpand} style={styles.expandButton}>
          <FontAwesome
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>
      </LinearGradient>

      <AlertDeleteModal
        visible={alertModal}
        heading="Confirm Deletion"
        text="Are you sure you want to delete this Loan Request?"
        onPress={() => {
          onDelete(RecId);
          setAlertModal(false);
        }}
        onCancel={() => setAlertModal(false)}
      />
    </View>
  );
};
