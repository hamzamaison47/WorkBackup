/* eslint-disable curly */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

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
      <View style={styles.overlay}>
        <TouchableWithoutFeedback>
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownTitle}>Select Company</Text>

              <ScrollView
                style={styles.scrollView}
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
                          styles.companyItem,
                          isSelected && styles.selectedCompanyItem,
                          isSelected && isFirst && styles.firstSelectedItem,
                          isSelected && isLast && styles.lastSelectedItem,
                        ]}
                        onPress={() => handleSelectCompany(entity.LegalEntity)}
                        activeOpacity={0.7}>
                        <View style={styles.companyInfo}>
                          <Text
                            style={[
                              styles.companyName,
                              isSelected && styles.selectedCompanyName,
                            ]}>
                            {entity.LegalEntity.toUpperCase()}
                          </Text>
                        </View>
                        {isSelected && (
                          <Icon
                            name="check"
                            size={16}
                            color="#FFA500"
                            style={styles.checkIcon}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.noDataText}>No companies available</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  dropdownContainer: {
    marginTop: 10,
    marginRight: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    width: 200,
    maxHeight: 400,
  },
  dropdownContent: {
    padding: 0,
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFA500',
    textAlign: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  scrollView: {
    maxHeight: 300,
  },
  companyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  selectedCompanyName: {
    color: '#FFA500',
  },
  checkIcon: {
    marginLeft: 10,
  },
  noDataText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  firstSelectedItem: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastSelectedItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  selectedCompanyItem: {
    backgroundColor: '#FFF5E6',
    zIndex: 1,
  },
});

export default CompanyDropdown;
