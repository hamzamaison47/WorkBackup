import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {AlertDeleteModal} from '../Alert/AlertModal';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const {width, height} = Dimensions.get('window');

const LeaveRequestCard = ({
  recId,
  leaveReqId,
  employeeId,
  employeeName,
  leaveCode,
  leaveCategory,
  leaveReqDate,
  leaveDays,
  leaveStartDate,
  leaveEndDate,
  reason,
  balance,
  wfStatus,
  onDelete,
  isHighlighted = false,
}) => {
  const [alertModal, setAlertModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigation = useNavigation();

  const isDeleteDisabled = wfStatus !== 'Draft';

  useEffect(() => {
    if (isHighlighted) {
      console.log('Highlight triggered');
    }
  }, [isHighlighted]);

  const formatDate = date =>
    new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });

  const handleEditPress = () => {
    navigation.navigate('LeaveSaveRecord', {
      mode: 'edit',
      employeeId,
      employeeName,
      cameFrom: 'LeavesListPage',
      leaveData: {
        recId,
        employeeId,
        employeeName,
        leaveCode,
        leaveCategory,
        balance,
        leaveStartDate,
        leaveEndDate,
        leaveDays,
        reason,
      },
    });
  };

  const getStatusStyle = () => {
    switch (wfStatus?.toLowerCase()) {
      case 'draft':
        return {backgroundColor: '#FFD54F', color: '#5D4037'};
      case 'approved':
        return {backgroundColor: '#81C784', color: '#1B5E20'};
      case 'rejected':
        return {backgroundColor: '#E57373', color: '#B71C1C'};
      case 'submitted':
        return {backgroundColor: '#64B5F6', color: '#0D47A1'};
      case 'pending approval':
        return {backgroundColor: '#FFB74D', color: '#ffffffff'};
      default:
        return {backgroundColor: '#B0BEC5', color: '#263238'};
    }
  };

  const handleDeleteConfirm = () => {
    onDelete(recId);
    setAlertModal(false);
  };

  const getGradientColors = () => {
    if (isHighlighted) {
      return ['#E8F5E8', '#F0FFF0'];
    }
    return ['#FFF3E0', '#FFF3E0'];
  };

  return (
    <View
      style={[
        styles.cardContainer,
        isHighlighted && styles.highlightedContainer,
      ]}>
      <LinearGradient colors={getGradientColors()} style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardHeaderText}>{leaveCode}</Text>
            <Text style={styles.value}>{employeeName}</Text>
          </View>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={handleEditPress}
              disabled={isDeleteDisabled}
              style={[styles.button, isDeleteDisabled && styles.disabled]}>
              <FontAwesome name="edit" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setAlertModal(true)}
              disabled={isDeleteDisabled}
              style={[styles.button, isDeleteDisabled && styles.disabled]}>
              <FontAwesome name="trash" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.label}>Leave Start Date:</Text>
          <Text style={styles.value}>{formatDate(leaveStartDate)}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.label}>Leave End Date:</Text>
          <Text style={styles.value}>{formatDate(leaveEndDate)}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.label}>Leave Days:</Text>
          <Text style={styles.value}>{leaveDays}</Text>
        </View>

        {expanded && (
          <>
            <View style={styles.sectionDivider} />
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Leave Request ID:</Text>
              <Text style={styles.value}>{leaveReqId}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Leave Category:</Text>
              <Text style={styles.value}>{leaveCategory}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Leave Request Date:</Text>
              <Text style={styles.value}>{formatDate(leaveReqDate)}</Text>
            </View>
            <View style={styles.sectionDivider} />
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Balance:</Text>
              <Text style={styles.value}>{balance}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Reason:</Text>
              <Text style={styles.value}>{reason || 'No reason provided'}</Text>
            </View>
          </>
        )}

        <View
          style={[
            styles.statusBadge,
            {backgroundColor: getStatusStyle().backgroundColor},
          ]}>
          <Text style={[styles.statusText, {color: getStatusStyle().color}]}>
            {wfStatus}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={styles.expandToggle}>
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
        text="Are you sure you want to delete this Leave request?"
        onPress={handleDeleteConfirm}
        onCancel={() => setAlertModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: height * 0.01,
    marginHorizontal: width * 0.01,
  },
  // NEW: Highlighted container with border and shadow
  highlightedContainer: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: width * 0.045,
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  card: {
    borderRadius: width * 0.04,
    padding: width * 0.045,
    elevation: 3,
  },
  // NEW: Success badge styles
  newRecordBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    zIndex: 1,
  },
  newRecordText: {
    color: '#FFFFFF',
    fontSize: width * 0.028,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  // ALL YOUR ORIGINAL STYLES BELOW - UNCHANGED
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.015,
  },
  cardHeaderText: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#37474F',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: width * 0.025,
  },
  button: {
    backgroundColor: 'orange',
    borderRadius: 20,
    padding: 8,
  },
  disabled: {
    backgroundColor: '#BDBDBD',
  },
  infoBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height * 0.008,
  },
  label: {
    fontWeight: '600',
    color: '#455A64',
    fontSize: width * 0.035,
  },
  value: {
    color: '#263238',
    fontSize: width * 0.035,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.005,
    marginTop: height * 0.015,
  },
  statusText: {
    fontWeight: '700',
    fontSize: width * 0.033,
    textTransform: 'uppercase',
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#555555',
    marginVertical: 8,
  },
  expandToggle: {
    alignItems: 'center',
    marginTop: height * 0.01,
    padding: 5,
    backgroundColor: 'orange',
    borderRadius: 50,
    alignSelf: 'center',
  },
});

export default LeaveRequestCard;
