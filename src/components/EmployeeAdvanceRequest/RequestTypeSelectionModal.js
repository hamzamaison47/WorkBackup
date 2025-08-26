// import React from 'react';
// import {
//   View,
//   Text,
//   Modal,
//   TouchableOpacity,
//   StyleSheet,
//   Pressable,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/Ionicons';

// const RequestTypeSelectionModal = ({visible, onClose, onSelectType}) => {
//   const requestTypes = [
//     {
//       type: 'Loan',
//       advanceType: 0, // Based on your API response, Loan has AdvanceType: "Loan"
//       title: 'Loan Request',
//       description: 'Create a new loan request',
//       icon: 'cash-outline',
//       color: '#2E7D32',
//     },
//     {
//       type: 'Advance',
//       advanceType: 1, // Based on your API response, Advance has AdvanceType: "Salary"
//       title: 'Advance Salary',
//       description: 'Create an advance salary request',
//       icon: 'cash-outline',
//       color: '#0A66C2',
//     },
//   ];

//   const handleSelectType = selectedType => {
//     onSelectType(selectedType);
//     onClose();
//   };

//   return (
//     <Modal
//       visible={visible}
//       transparent={true}
//       animationType="fade"
//       onRequestClose={onClose}>
//       <Pressable style={styles.modalOverlay} onPress={onClose}>
//         <Pressable style={styles.modalContent} onPress={() => {}}>
//           {/* Header */}
//           <View style={styles.modalHeader}>
//             <Text style={styles.modalTitle}>Select Request Type</Text>
//           </View>

//           {/* Request Type Options */}
//           <View style={styles.optionsContainer}>
//             {requestTypes.map((item, index) => (
//               <TouchableOpacity
//                 key={index}
//                 style={[styles.optionCard, {borderLeftColor: item.color}]}
//                 onPress={() => handleSelectType(item)}
//                 activeOpacity={0.8}>
//                 <View style={styles.iconContainer}>
//                   <Icon name={item.icon} size={28} color={item.color} />
//                 </View>
//                 <View style={styles.textContainer}>
//                   <Text style={styles.optionTitle}>{item.title}</Text>
//                   <Text style={styles.optionDescription}>
//                     {item.description}
//                   </Text>
//                 </View>
//                 <View style={styles.arrowContainer}>
//                   <Icon name="chevron-forward" size={20} color="#999" />
//                 </View>
//               </TouchableOpacity>
//             ))}
//           </View>

//           {/* Cancel Button */}
//           <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
//             <Text style={styles.cancelButtonText}>Cancel</Text>
//           </TouchableOpacity>
//         </Pressable>
//       </Pressable>
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContent: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 20,
//     margin: 20,
//     width: '90%',
//     maxWidth: 400,
//     elevation: 10,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   closeButton: {
//     padding: 4,
//   },
//   optionsContainer: {
//     marginBottom: 20,
//   },
//   optionCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     borderLeftWidth: 4,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 1,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   iconContainer: {
//     marginRight: 16,
//     width: 40,
//     alignItems: 'center',
//   },
//   textContainer: {
//     flex: 1,
//   },
//   optionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 4,
//   },
//   optionDescription: {
//     fontSize: 14,
//     color: '#666',
//   },
//   arrowContainer: {
//     marginLeft: 8,
//   },
//   cancelButton: {
//     backgroundColor: '#f5f5f5',
//     borderRadius: 12,
//     padding: 16,
//     alignItems: 'center',
//   },
//   cancelButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#666',
//   },
// });

// export default RequestTypeSelectionModal;

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const RequestTypeSelectionModal = ({visible, onClose, onSelectType}) => {
  const requestTypes = [
    {
      type: 'Loan',
      advanceType: 0,
      title: 'Loan Request',
      description: 'Create a new loan request', // 28 characters
      icon: 'cash-outline',
      color: '#2E7D32',
    },
    {
      type: 'Advance',
      advanceType: 1,
      title: 'Advance Salary',
      description: 'Create an advance salary request', // 35 characters
      icon: 'cash-outline',
      color: '#0A66C2',
    },
  ];

  const handleSelectType = selectedType => {
    onSelectType(selectedType);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={() => {}}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Request Type</Text>
          </View>

          {/* Request Type Options */}
          <View style={styles.optionsContainer}>
            {requestTypes.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.optionCard, {borderLeftColor: item.color}]}
                onPress={() => handleSelectType(item)}
                activeOpacity={0.8}>
                <View style={styles.iconContainer}>
                  <Icon name={item.icon} size={28} color={item.color} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.optionTitle}>{item.title}</Text>
                  <Text style={styles.optionDescription}>
                    {item.description}
                  </Text>
                </View>
                <View style={styles.arrowContainer}>
                  <Icon name="chevron-forward" size={20} color="#999" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    marginRight: 16,
    width: 40,
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  arrowContainer: {
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

export default RequestTypeSelectionModal;
