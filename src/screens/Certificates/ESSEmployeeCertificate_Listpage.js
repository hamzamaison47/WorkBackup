import React, {useState, useCallback} from 'react';
import {Text, FlatList, View, StyleSheet, I18nManager} from 'react-native';

import ActionPaneContainer from '../../components/ActionPaneContainer';
import DynamicRequestCard from '../../components/DynamicRequestCard';
import {useSelector} from 'react-redux';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {retrieveAll} from '../../API/Certificates/retrieveAll';
const ESSEmployeeCertificate_Listpage = () => {
  const isRTL = I18nManager.isRTL;
  const navigation = useNavigation();

  const {userData} = useSelector(state => state.user);

  const [certificateData, setCertificateData] = useState([]);
  const [loading, setLoading] = useState(false);

  /** ✅ API CALL */
  const loadData = async person => {
    try {
      setLoading(true);

      const result = await retrieveAll({person});

      console.log('API RESULT:', result);

      setCertificateData(result || []);
    } catch (error) {
      console.error('Error loading certificates:', error);
      setCertificateData([]);
    } finally {
      setLoading(false);
    }
  };

  /** ✅ Load on screen focus */
  useFocusEffect(
    useCallback(() => {
      const person = userData?.Person;

      if (!person) {
        console.warn('Person is missing, API not called');
        return;
      }

      console.log('PERSON:', person);

      loadData(person);
    }, [userData]),
  );

  /** ✅ Card Config */
  const cardConfig = {
    headerConfig: {
      title: {key: 'certificateType'},
      subtitle: {key: 'description'},
    },
    fields: [
      {key: 'certificateType', label: 'Certificate Type', type: 'text'},
      {key: 'description', label: 'Description', type: 'text'},
      {key: 'note', label: 'Notes', type: 'text'},
    ],
    expandableFields: [
      {key: 'issuedate', label: 'Start Date', type: 'date'},
      {key: 'expirationdate', label: 'End Date', type: 'date'},
    ],
    isRTL,
  };

  const renderCertificateCard = ({item}) => {
    return (
      <DynamicRequestCard
        data={item}
        headerConfig={cardConfig.headerConfig}
        fields={cardConfig.fields}
        expandableFields={cardConfig.expandableFields}
        isExpandable={true}
        isRTL={isRTL}
      />
    );
  };

  return (
    <ActionPaneContainer
      pageTitle="Certificates"
      showFooter
      isHeaderActive
      showPageTitleRow
      showFloatingButton={true}
      onFloatingButtonPress={() =>
        navigation.navigate('ESSEmployeeCertificate_Saverecord')
      }>
      {certificateData.length > 0 ? (
        <FlatList
          data={certificateData}
          renderItem={renderCertificateCard}
          keyExtractor={(item, index) =>
            item.recId ? String(item.recId) : index.toString()
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            {loading ? 'Loading...' : 'No Certificates Found'}
          </Text>
        </View>
      )}
    </ActionPaneContainer>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 20,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noDataText: {
    fontSize: 16,
    color: '#555',
  },
});

export default ESSEmployeeCertificate_Listpage;
