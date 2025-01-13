import React, {useState} from 'react';
import {styles} from '../../styles/LeaveRequestStyles';
import LinearGradient from 'react-native-linear-gradient';
import {View, Text, TouchableOpacity} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {AlertDeleteModal} from '../../components/Leaves/AlertModal';

const EndOfServiceCard = ({
  RecId,
  NoticePeriodCode,
  EOSNotificationDate,
  LastWorkingDate_Actual,
  EOSStatus,
  WorkflowStatus,
  EOSReasonCode,
  Remarks,
  onPress,
  onDelete,
}) => {
  // State to manage expansion and collapse
  const [expanded, setExpanded] = useState(false);
  const [alertModal, setAlertModal] = useState(false);

  const isEditDisabled = WorkflowStatus !== 'Draft';
  const isDeleteDisabled = WorkflowStatus !== 'Draft';
  // Function to toggle the expanded state
  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const confirmDeleteLeave = () => {
    setAlertModal(true);
  };

  const ExceptionDate = date =>
    new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={['#FFF3E0', '#FFF3E0', '#FFF3E0']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.card}>
        {/* Header Text and Edit Button */}

        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>{NoticePeriodCode}</Text>
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
            <Text style={styles.cardTextHeading}>Notification Date:</Text>
            <Text style={styles.cardText}>
              {ExceptionDate(EOSNotificationDate)}
            </Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.cardTextHeading}>
              Last Working Date Requested:
            </Text>
            <Text style={styles.cardText}>
              {ExceptionDate(LastWorkingDate_Actual)}
            </Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.cardTextHeading}>Status:</Text>
            <Text style={[styles.cardText, styles.statusText]}>
              {EOSStatus.toUpperCase()}
            </Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.cardTextHeading}>WF Status:</Text>
            <Text style={[styles.cardText, styles.statusText]}>
              {WorkflowStatus.toUpperCase()}
            </Text>
          </View>

          {/* Expandable Content (Visible only when expanded) */}
          {expanded && (
            <>
              <View style={styles.sectionDivider} />

              <View style={styles.textContainer}>
                <Text style={styles.cardTextHeading}>Reason Code:</Text>
                <Text style={styles.cardText}>{EOSReasonCode}</Text>
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.cardTextHeading}>Remarks:</Text>
                <Text style={styles.cardText}>{Remarks}</Text>
              </View>
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
        text="Are you sure you want to Delete this End of Service Request?"
        onPress={() => {
          onDelete(RecId);
          setAlertModal(false);
        }}
        onCancel={() => setAlertModal(false)}
      />
    </View>
  );
};

export default EndOfServiceCard;
