/* eslint-disable curly */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import styles from '../../styles/styles';

const CompanyDropdown = ({
  visible,
  onClose,
  legalEntities,
  selectedLegalEntity,
  onSelect,
}) => {
  if (!visible) return null;

  const handleSelectCompany = entityName => {
    onSelect(entityName);
    onClose();
  };

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.CD_Overlay}>
        <TouchableWithoutFeedback>
          <View style={styles.CD_DropdownContainer}>
            <View style={styles.CD_DropdownContent}>
              <Text style={styles.CD_DropdownTitle}>Select Company</Text>

              <ScrollView
                style={styles.CD_ScrollView}
                showsVerticalScrollIndicator={false}>
                {legalEntities && legalEntities.length > 0 ? (
                  legalEntities.map((entity, index) => {
                    const isSelected =
                      selectedLegalEntity === entity.LegalEntity;
                    const isFirst = index === 0;
                    const isLast = index === legalEntities.length - 1;

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.CD_CompanyItem,
                          isSelected && styles.CD_SelectedCompanyItem,
                          isSelected && isFirst && styles.CD_FirstSelectedItem,
                          isSelected && isLast && styles.CD_LastSelectedItem,
                        ]}
                        onPress={() => handleSelectCompany(entity.LegalEntity)}
                        activeOpacity={0.7}>
                        <View style={styles.CD_CompanyInfo}>
                          <Text
                            style={[
                              styles.CD_CompanyName,
                              isSelected && styles.CD_SelectedCompanyName,
                            ]}>
                            {entity.LegalEntity.toUpperCase()}
                          </Text>
                        </View>
                        {isSelected && (
                          <Icon
                            name="check"
                            size={16}
                            color="#0A66C2"
                            style={styles.CD_CheckIcon}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.CD_NoDataText}>
                    No companies available
                  </Text>
                )}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default CompanyDropdown;
