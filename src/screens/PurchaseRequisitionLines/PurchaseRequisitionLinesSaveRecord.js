/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import ActionPaneContainer from '../../components/ActionPaneContainer';
import AlertModal from '../../components/Alert/AlertModal';
import CustomIndicator from '../../components/CustomIndicator/CustomIndicator';
import styles from '../../styles/styles';
import {Dropdown} from 'react-native-element-dropdown';

import {itemLookupforPurchRequisitionLine} from '../../API/PurchaseRequisitionLines/PurchaseRequisitionLinesRetrieveItemLookup';
import {itemModifiedforPurchaseRequisitionLines} from '../../API/PurchaseRequisitionLines/PurchaseRequisitionLinesItemModified';
import {createPurchaseRequistionLines} from '../../API/PurchaseRequisitionLines/PurchaseRequisitionLinesSaveRecord';
import {updatePurchaseRequisitionLines} from '../../API/PurchaseRequisitionLines/PurchaseRequisitionLinesUpdateRecord';

import {retrieveConfigIdPurchaseRequisitionLines} from '../../API/PurchaseRequisitionLines/PurchaseRequisitionLinesRetrieveConfigId';
import {retrieveSizeIdPurchaseRequisitionLines} from '../../API/PurchaseRequisitionLines/PurchaseRequisitionLinesRetrieveSizeId';
import {retrieveColorIdPurchaseRequisitionLines} from '../../API/PurchaseRequisitionLines/PurchaseRequisitionLinesRetrieveColorId';
import {retrieveStyleIdPurchaseRequisitionLines} from '../../API/PurchaseRequisitionLines/PurchaseRequisitionLinesRetrieveStyleId';
import {retrieveSerialIdPurchaseRequisitionLines} from '../../API/PurchaseRequisitionLines/PurchaseRequisitionLinesRetrieveSerialId';
import {retrieveBatchIdPurchaseRequisitionLines} from '../../API/PurchaseRequisitionLines/PurchaseRequisitionLinesRetrieveBatchId';

import {retrieveSiteIdPurchaseRequisitionLines} from '../../API/PurchaseRequisitionLines/PurchaseRequisitionLinesRetrieveSiteId';
import {retrieveLocationIdPurchaseRequisitionLines} from '../../API/PurchaseRequisitionLines/PurchaseRequisitionLinesRetrieveLocationId';
import SaveRecordButtons, {
  BUTTON_TYPES,
} from '../../components/Buttons/SaveRecordButtons';

const PurchaseRequisitionLinesSaveRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();

  const userData = useSelector(state => state.user.userData);
  const {menuItems} = useSelector(state => state.menuItem);
  const routeUserData = route.params?.userData;
  const effectiveUserData = routeUserData || userData || {};

  const {
    mode = 'create',
    employeeId = effectiveUserData?.employeeId || '',
    employeeName = effectiveUserData?.employeeName || '',
    WorkerRecId = effectiveUserData?.WorkerRecId || '',
    PurchReqId = route.params?.PurchReqId || '',
    PurchReqName = route.params?.PurchReqName || '',
    RequiredDate = route.params?.RequiredDate || '',
    userData: finalUserData = effectiveUserData || {},
    cameFrom = 'PurchaseRequisitionLinesListPage',
    originalCameFrom = route.params?.cameFrom || '',
    purchaseRequisitiondata = route.params?.purchaseRequisitiondata || {},
  } = route.params || {};

  const effectiveEmployeeId = employeeId || effectiveUserData?.employeeId;
  const effectiveEmployeeName = employeeName || effectiveUserData?.employeeName;
  const effectiveWorkerRecId = WorkerRecId || effectiveUserData?.WorkerRecId;

  const {selectedLegalEntity, defaultLegalEntity} = useSelector(
    state => state.company,
  );

  const [isLoading, setIsLoading] = useState(false);
  const [processingButton, setProcessingButton] = useState('');
  const [alertModal, setAlertModal] = useState(false);
  const [quantity, setQuantity] = useState('0.00');
  const [alertMessage, setAlertMessage] = useState('');
  const [itemList, setItemList] = useState([]);
  const [configList, setConfigList] = useState([]);
  const [sizeList, setSizeList] = useState([]);
  const [colorList, setColorList] = useState([]);
  const [styleList, setStyleList] = useState([]);
  const [batchList, setBatchList] = useState([]);
  const [serialList, setSerialList] = useState([]);
  const [siteList, setSiteList] = useState([]);
  const [locationList, setLocationList] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedSerial, setSelectedSerial] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedItem, setSelectedItem] = useState('');
  const [itemDetails, setItemDetails] = useState({
    ItemName: '',
    PurchUnitofMeasureCode: '',
    PurchPrice: '',
  });

  const createInitialFormData = () => ({
    RecId: '',
    ItemId: '',
    employeeId,
    employeeName,
    WorkerRecId,
  });

  const [formData, setFormData] = useState(() => createInitialFormData());

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      // Reset ALL form states
      setFormData(createInitialFormData());
      setSelectedItem('');
      setSelectedConfig(null);
      setSelectedSize(null);
      setSelectedColor(null);
      setSelectedStyle(null);
      setSelectedBatch(null);
      setSelectedSerial(null);
      setSelectedSite(null);
      setSelectedLocation(null);
      setQuantity('0.00');
      setItemDetails({
        ItemName: '',
        PurchUnitofMeasureCode: '',
        PurchPrice: '',
      });

      // Reset ALL dropdown lists
      setConfigList([]);
      setSizeList([]);
      setColorList([]);
      setStyleList([]);
      setBatchList([]);
      setSerialList([]);
      setSiteList([]);
      setLocationList([]);

      // Refetch items
      await fetchItems();
    } catch (error) {
      console.error('Error refreshing form:', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    employeeId,
    employeeName,
    WorkerRecId,
    purchaseRequisitiondata,
    fetchItems,
  ]);

  /** ✅ Fetch items */
  const fetchItems = useCallback(async () => {
    try {
      if (!RequiredDate) {
        console.warn('Required date is missing, cannot fetch items.');
        setItemList([]);
        return;
      }

      const data = await itemLookupforPurchRequisitionLine({
        _dataAreaId: selectedLegalEntity,
        _requireddate: RequiredDate,
        _operatingUnitRecId: 0,
      });

      if (Array.isArray(data) && data.length) {
        const list = data.map(item => ({
          label: `${item.ItemId} - ${item.ItemName}`,
          value: item.ItemId,
          originalItem: item,
        }));
        setItemList(list);
      } else {
        setItemList([]);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      setAlertMessage('Failed to fetch items.');
      setAlertModal(true);
      setItemList([]);
    }
  }, [selectedLegalEntity, purchaseRequisitiondata]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        goBack();
        return true; // prevent default back
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => subscription.remove();
    }, [goBack]),
  );

  /** ✅ Handle item change */
  const handleItemChange = async item => {
    setSelectedItem(item.value);
    setIsLoading(true);
    try {
      const modifiedData = await itemModifiedforPurchaseRequisitionLines({
        _itemId: item.value,
        _dataAreaId: selectedLegalEntity,
      });

      if (Array.isArray(modifiedData) && modifiedData.length) {
        const itemData = modifiedData[0];
        setItemDetails({
          ItemName: itemData?.ItemName || '',
          PurchUnitofMeasureCode: itemData?.PurchUnitofMeasureCode || '',
          PurchPrice: itemData?.PurchPrice || '',
        });
      } else {
        setItemDetails({
          ItemName: '',
          PurchUnitofMeasureCode: '',
          PurchPrice: '',
        });
      }
      await loadLookups(item.value);
    } catch (error) {
      console.error('Error fetching item details:', error);
      setItemDetails({
        ItemName: '',
        PurchUnitofMeasureCode: '',
        PurchPrice: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadLookups = async itemId => {
    try {
      const [config, size, color, style, batch, serial, site] =
        await Promise.all([
          retrieveConfigIdPurchaseRequisitionLines({
            _itemid: itemId,
          }),
          retrieveSizeIdPurchaseRequisitionLines({
            _itemId: itemId,
          }),
          retrieveColorIdPurchaseRequisitionLines({
            _itemid: itemId,
          }),
          retrieveStyleIdPurchaseRequisitionLines({
            _itemid: itemId,
          }),
          retrieveBatchIdPurchaseRequisitionLines({
            _itemid: itemId,
          }),
          retrieveSerialIdPurchaseRequisitionLines({
            _itemid: itemId,
          }),
          retrieveSiteIdPurchaseRequisitionLines({
            _dataAreaid: selectedLegalEntity,
          }),
        ]);

      setConfigList(formatDropdown(config, 'config'));
      setSizeList(formatDropdown(size, 'size'));
      setColorList(formatDropdown(color, 'color'));
      setStyleList(formatDropdown(style, 'style'));
      setBatchList(formatDropdown(batch, 'batch'));
      setSerialList(formatDropdown(serial, 'serial'));
      setSiteList(formatDropdown(site, 'site'));
      setLocationList([]); // Reset locations when item changes
    } catch (err) {
      console.log('Error loading lookups:', err);

      setConfigList([]);
      setSizeList([]);
      setColorList([]);
      setStyleList([]);
      setBatchList([]);
      setSerialList([]);
    }
  };

  const handleSiteChange = async siteItem => {
    setSelectedSite(siteItem.value);
    setSelectedLocation(null); // Reset location when site changes
    setLocationList([]); // Clear previous locations

    if (siteItem.value) {
      try {
        setIsLoading(true);
        const locations = await retrieveLocationIdPurchaseRequisitionLines({
          _siteId: siteItem.value,
        });

        setLocationList(formatDropdown(locations, 'location'));
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLocationList([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const goBack = useCallback(() => {
    // ALWAYS go back to the Lines List page, no matter where we are in the stack
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'PurchaseRequisitionLinesListPage',
          params: {
            PurchReqId,
            PurchReqName,
            RequiredDate,
            employeeId: effectiveEmployeeId,
            employeeName: effectiveEmployeeName,
            WorkerRecId: effectiveWorkerRecId,
            userData: effectiveUserData,
            // keep any other params you need
          },
        },
      ],
    });
  }, [
    navigation,
    PurchReqId,
    PurchReqName,
    RequiredDate,
    effectiveEmployeeId,
    effectiveEmployeeName,
    effectiveWorkerRecId,
    effectiveUserData,
  ]);

  const formatDropdown = (arr, type) => {
    if (!Array.isArray(arr)) return [];

    return arr
      .map(x => {
        let label = '';
        let value = '';

        switch (type) {
          case 'config':
            label = x.ConfigId || '';
            value = x.ConfigId || '';
            break;
          case 'size':
            label = x.InventSizeId || '';
            value = x.InventSizeId || '';
            break;
          case 'color':
            label = x.InventColorId || '';
            value = x.InventColorId || '';
            break;
          case 'style':
            label = x.InventStyle || '';
            value = x.InventStyle || '';
            break;
          case 'batch':
            label = x.InventBatchId || '';
            value = x.InventBatchId || '';
            break;
          case 'serial':
            label = x.InventSerialId || '';
            value = x.InventSerialId || '';
            break;
          case 'site': // Add this case for site
            label = x.InventSiteId || '';
            value = x.InventSiteId || '';
            break;
          case 'location': // Add this case for location
            label = x.InventLocationId || '';
            value = x.InventLocationId || '';
            break;
          default:
            label = x.Name || x.value || '';
            value = x.Id || x.Value || '';
        }

        // Filter out empty values
        return label && value ? {label, value} : null;
      })
      .filter(Boolean); // Remove null entries
  };

  const validate = () => {
    const missing = [];
    if (!selectedItem) missing.push('Item Number');
    if (!quantity || parseFloat(quantity) <= 0)
      missing.push('Enter Valid Quantity');

    if (missing.length) {
      setAlertMessage(
        'Please fill in the following fields:\n' + missing.join('\n'),
      );
      setAlertModal(true);
      return false;
    }
    return true;
  };

  /** ✅ Handle create */
  const handleCreate = async () => {
    if (!validate()) return;
    setProcessingButton('create');

    if (!quantity || parseFloat(quantity) <= 0) {
      setAlertMessage('Please enter a valid quantity');
      setAlertModal(true);
      return;
    }

    setIsLoading(true);
    try {
      // Prepare the payload with all selected values
      const payload = {
        PurchReqId: PurchReqId,
        ItemId: selectedItem,
        PurchQty: parseFloat(quantity).toString(),
        InventSiteId: selectedSite || '',
        InventLocationId: selectedLocation || '',
        ConfigId: selectedConfig || '',
        InventSizeId: selectedSize || '',
        InventColorId: selectedColor || '',
        InventStyleId: selectedStyle || '',
        InventBatchId: selectedBatch || '',
        InventSerialId: selectedSerial || '',
        Requisitioner: employeeId,
        dataAreaId: selectedLegalEntity,
        // Add any other required fields
      };

      console.log('Payload to create:', payload);

      // Call the create API
      const result = await createPurchaseRequistionLines({
        PurchaseRequisitionLinesData: [payload], // Pass as array
      });

      console.log('Create API response:', result);

      if (result && result.IsSuccess) {
        setAlertMessage('Purchase Requisition Line Created Successfully');
        setAlertModal(true);

        setTimeout(() => goBack(), 1500); // navigate back after success
      } else {
        const errorMessage =
          result?.Message || 'Failed to create purchase requisition line';
        setAlertMessage(errorMessage);
        setAlertModal(true);
      }
    } catch (err) {
      console.error('Error creating requisition line:', err);
      setAlertMessage('Error creating requisition line. Please try again.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
      setProcessingButton('');
    }
  };

  /** ✅ Handle update */
  const handleUpdate = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      setAlertMessage('Please enter a valid quantity');
      setAlertModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        CurrencyCode: purchaseRequisitiondata.CurrencyCode,
        PurchQty: parseFloat(quantity).toString(),
        PurchPrice: purchaseRequisitiondata.PurchPrice,
        PurchUnitofMeasure: purchaseRequisitiondata.PurchUnitofMeasure,
        RecId: purchaseRequisitiondata.RecId,
        VendAccount: purchaseRequisitiondata.VendAccount,
      };

      console.log('Payload to update:', payload);

      const result = await updatePurchaseRequisitionLines({
        PurchaseRequisitionLinesData: [payload],
      });

      console.log('Update API response:', result);

      if (result && result.IsSuccess) {
        setAlertMessage('Purchase Requisition Line Updated Successfully');
        setAlertModal(true);

        setTimeout(() => goBack(), 1500);
      } else {
        const errorMessage =
          result?.Message || 'Failed to update purchase requisition line';
        setAlertMessage(errorMessage);
        setAlertModal(true);
      }
    } catch (err) {
      console.error('Error updating requisition line:', err);
      setAlertMessage('Error updating requisition line. Please try again.');
      setAlertModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  /** ✅ Handle OK button press based on mode */
  const handleOkPress = () => {
    if (mode === 'edit') {
      handleUpdate();
    } else {
      handleCreate();
    }
  };

  useEffect(() => {
    if (mode === 'create') fetchItems();
  }, [fetchItems, mode]);

  useEffect(() => {
    if (mode === 'edit' && purchaseRequisitiondata) {
      console.log(
        '📝 Edit Mode - Populating form data:',
        purchaseRequisitiondata,
      );

      // Set the selected item
      setSelectedItem(purchaseRequisitiondata.ItemId || '');

      // Set item details (name, unit, price)
      setItemDetails({
        ItemName: purchaseRequisitiondata.ItemName || '',
        PurchUnitofMeasureCode:
          purchaseRequisitiondata.PurchUnitofMeasureCode || '',
        PurchPrice: purchaseRequisitiondata.PurchPrice || '',
      });

      // Set quantity
      setQuantity(purchaseRequisitiondata.PurchQty?.toString() || '0.00');

      // DO NOT load lookups or dimension fields in edit mode
    }
  }, [mode, purchaseRequisitiondata]);

  return (
    <ActionPaneContainer
      pageTitle={
        mode === 'edit'
          ? 'Edit Purchase Requisition Lines'
          : 'Create Purchase Requisition Lines'
      }
      isBackButton
      showFooter={false}
      showFloatingButton={false}
      isHeaderActive
      onBackPress={goBack}>
      {isLoading ? (
        <CustomIndicator />
      ) : (
        <SafeAreaView style={styles.LReqSR_SafeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.LReqSR_ContentWrapper}>
            <ScrollView
              contentContainerStyle={styles.LReqSR_FormContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {/* ITEM DROPDOWN - Disabled in edit mode */}
              <View style={styles.LReqSR_FieldWrapper}>
                <Text style={styles.LReqSR_Label}>Item Number*</Text>
                {mode === 'edit' ? (
                  <TextInput
                    style={[styles.LReqSR_Input, styles.LReqSR_Disabled]}
                    value={selectedItem}
                    editable={false}
                    placeholder="Item Number"
                    placeholderTextColor="#888"
                  />
                ) : (
                  <Dropdown
                    style={styles.LReqSR_Input}
                    data={
                      itemList.length === 0
                        ? [
                            {
                              label: 'Loading items...',
                              value: 'loading',
                              disabled: true,
                            },
                          ]
                        : itemList
                    }
                    labelField="label"
                    valueField="value"
                    placeholder={
                      itemList.length === 0 ? 'Loading items...' : 'Select Item'
                    }
                    value={selectedItem}
                    onChange={handleItemChange}
                    search={itemList.length > 0}
                    searchPlaceholder={
                      itemList.length === 0 ? 'Please wait...' : 'Search Item'
                    }
                    placeholderStyle={styles.LReqSR_DropdownPlaceholder}
                    selectedTextStyle={styles.LReqSR_DropdownSelectedText}
                    itemTextStyle={styles.LReqSR_DropdownItemText}
                    inputSearchStyle={{color: '#888'}}
                    activeColor="#E6F0FF"
                    containerStyle={[
                      styles.LReqSR_DropdownContainer,
                      {zIndex: 1000},
                    ]}
                    maxHeight={280}
                    dropdownPosition="auto"
                    disable={itemList.length === 0} // disables dropdown while loading
                    renderItem={item => (
                      <View
                        style={{
                          padding: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          opacity: item.value === 'loading' ? 0.7 : 1,
                        }}>
                        <Text
                          style={[
                            styles.LReqSR_DropdownItemText,
                            item.value === 'loading' && {
                              color: '#888',
                              fontStyle: 'italic',
                            },
                          ]}>
                          {item.label}
                        </Text>
                      </View>
                    )}
                  />
                )}
              </View>

              {/* DISABLED FIELDS - Always disabled */}
              <View style={styles.LReqSR_FieldWrapper}>
                <Text style={styles.LReqSR_Label}>Product Name</Text>
                <TextInput
                  style={[styles.LReqSR_Input, styles.LReqSR_Disabled]}
                  value={itemDetails.ItemName}
                  editable={false}
                  placeholder="Product Name"
                  placeholderTextColor="#888"
                />
              </View>

              <View style={styles.LReqSR_FieldWrapper}>
                <Text style={styles.LReqSR_Label}>Unit</Text>
                <TextInput
                  style={[styles.LReqSR_Input, styles.LReqSR_Disabled]}
                  value={itemDetails.PurchUnitofMeasureCode}
                  editable={false}
                  placeholder="Unit of Measure"
                  placeholderTextColor="#888"
                />
              </View>

              <View style={styles.LReqSR_FieldWrapper}>
                <Text style={styles.LReqSR_Label}>Unit Price</Text>
                <TextInput
                  style={[styles.LReqSR_Input, styles.LReqSR_Disabled]}
                  value={
                    itemDetails.PurchPrice
                      ? parseFloat(itemDetails.PurchPrice).toFixed(2)
                      : ''
                  }
                  editable={false}
                  placeholder="Price"
                  placeholderTextColor="#888"
                />
              </View>

              {/* QUANTITY FIELD - Always editable */}
              <View style={styles.LReqSR_FieldWrapper}>
                <Text style={styles.LReqSR_Label}>Quantity*</Text>
                <TextInput
                  style={styles.LReqSR_Input}
                  value={quantity}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#888"
                  onChangeText={text => {
                    // allow only numbers and one decimal point
                    let cleaned = text.replace(/[^0-9.]/g, '');

                    const parts = cleaned.split('.');
                    if (parts.length > 2) {
                      cleaned = parts[0] + '.' + parts[1];
                    }

                    setQuantity(cleaned);
                  }}
                  onEndEditing={() => {
                    // if empty or invalid, set to '0'
                    if (quantity === '' || quantity === '.') {
                      setQuantity('0');
                    }
                  }}
                />
              </View>

              {/* DIMENSIONS SECTION - Only visible in create mode when item is selected */}
              {mode === 'create' && selectedItem && (
                <>
                  <View
                    style={{
                      backgroundColor: '#f5f5f5',
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 6,
                      marginTop: 20,
                      marginBottom: 12,
                      borderLeftWidth: 4,
                      borderLeftColor: '#0275d8',
                    }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: '#333',
                      }}>
                      Dimensions
                    </Text>
                  </View>

                  {/* SITE DROPDOWN */}
                  <View style={styles.LReqSR_FieldWrapper}>
                    <Text style={styles.LReqSR_Label}>Site</Text>
                    <Dropdown
                      style={styles.LReqSR_Input}
                      data={siteList}
                      labelField="label"
                      valueField="value"
                      placeholder="Select Site"
                      value={selectedSite}
                      onChange={handleSiteChange}
                      search
                      searchPlaceholder="Search Site"
                      placeholderStyle={styles.LReqSR_DropdownPlaceholder}
                      selectedTextStyle={styles.LReqSR_DropdownSelectedText}
                      itemTextStyle={styles.LReqSR_DropdownItemText}
                      inputSearchStyle={{color: '#888'}}
                      activeColor="#E6F0FF"
                      containerStyle={[
                        styles.LReqSR_DropdownContainer,
                        {zIndex: 994},
                      ]}
                      maxHeight={280}
                      dropdownPosition="auto"
                      renderItem={item => (
                        <View style={{padding: 10}}>
                          <Text style={styles.LReqSR_DropdownItemText}>
                            {item.label}
                          </Text>
                        </View>
                      )}
                    />
                  </View>

                  {/* LOCATION DROPDOWN */}
                  <View style={styles.LReqSR_FieldWrapper}>
                    <Text style={styles.LReqSR_Label}>Warehouse</Text>
                    <Dropdown
                      style={styles.LReqSR_Input}
                      data={locationList}
                      labelField="label"
                      valueField="value"
                      placeholder={
                        selectedSite ? 'Select Warehouse' : 'Select Site First'
                      }
                      value={selectedLocation}
                      onChange={item => setSelectedLocation(item.value)}
                      search
                      searchPlaceholder="Search Location"
                      placeholderStyle={styles.LReqSR_DropdownPlaceholder}
                      selectedTextStyle={styles.LReqSR_DropdownSelectedText}
                      itemTextStyle={styles.LReqSR_DropdownItemText}
                      inputSearchStyle={{color: '#888'}}
                      activeColor="#E6F0FF"
                      containerStyle={[
                        styles.LReqSR_DropdownContainer,
                        {zIndex: 993},
                      ]}
                      maxHeight={280}
                      dropdownPosition="auto"
                      renderItem={item => (
                        <View style={{padding: 10}}>
                          <Text style={styles.LReqSR_DropdownItemText}>
                            {item.label}
                          </Text>
                        </View>
                      )}
                    />
                  </View>

                  {/* CONFIGURATION DROPDOWN */}
                  {configList.length > 0 && (
                    <View style={styles.LReqSR_FieldWrapper}>
                      <Text style={styles.LReqSR_Label}>Configuration</Text>
                      <Dropdown
                        style={styles.LReqSR_Input}
                        data={configList}
                        labelField="label"
                        valueField="value"
                        placeholder="Select Configuration"
                        value={selectedConfig}
                        onChange={item => setSelectedConfig(item.value)}
                        search
                        searchPlaceholder="Search Configuration"
                        placeholderStyle={styles.LReqSR_DropdownPlaceholder}
                        selectedTextStyle={styles.LReqSR_DropdownSelectedText}
                        itemTextStyle={styles.LReqSR_DropdownItemText}
                        inputSearchStyle={{color: '#888'}}
                        activeColor="#E6F0FF"
                        containerStyle={[
                          styles.LReqSR_DropdownContainer,
                          {zIndex: 1000},
                        ]}
                        maxHeight={280}
                        dropdownPosition="auto"
                        renderItem={item => (
                          <View style={{padding: 10}}>
                            <Text style={styles.LReqSR_DropdownItemText}>
                              {item.label}
                            </Text>
                          </View>
                        )}
                      />
                    </View>
                  )}

                  {/* SIZE DROPDOWN */}
                  {sizeList.length > 0 && (
                    <View style={styles.LReqSR_FieldWrapper}>
                      <Text style={styles.LReqSR_Label}>Size</Text>
                      <Dropdown
                        style={styles.LReqSR_Input}
                        data={sizeList}
                        labelField="label"
                        valueField="value"
                        placeholder="Select Size"
                        value={selectedSize}
                        onChange={item => setSelectedSize(item.value)}
                        search
                        searchPlaceholder="Search Size"
                        placeholderStyle={styles.LReqSR_DropdownPlaceholder}
                        selectedTextStyle={styles.LReqSR_DropdownSelectedText}
                        itemTextStyle={styles.LReqSR_DropdownItemText}
                        inputSearchStyle={{color: '#888'}}
                        activeColor="#E6F0FF"
                        containerStyle={[
                          styles.LReqSR_DropdownContainer,
                          {zIndex: 999},
                        ]}
                        maxHeight={280}
                        dropdownPosition="auto"
                        renderItem={item => (
                          <View style={{padding: 10}}>
                            <Text style={styles.LReqSR_DropdownItemText}>
                              {item.label}
                            </Text>
                          </View>
                        )}
                      />
                    </View>
                  )}

                  {/* COLOR DROPDOWN */}
                  {colorList.length > 0 && (
                    <View style={styles.LReqSR_FieldWrapper}>
                      <Text style={styles.LReqSR_Label}>Color</Text>
                      <Dropdown
                        style={styles.LReqSR_Input}
                        data={colorList}
                        labelField="label"
                        valueField="value"
                        placeholder="Select Color"
                        value={selectedColor}
                        onChange={item => setSelectedColor(item.value)}
                        search
                        searchPlaceholder="Search Color"
                        placeholderStyle={styles.LReqSR_DropdownPlaceholder}
                        selectedTextStyle={styles.LReqSR_DropdownSelectedText}
                        itemTextStyle={styles.LReqSR_DropdownItemText}
                        inputSearchStyle={{color: '#888'}}
                        activeColor="#E6F0FF"
                        containerStyle={[
                          styles.LReqSR_DropdownContainer,
                          {zIndex: 998},
                        ]}
                        maxHeight={280}
                        dropdownPosition="auto"
                        renderItem={item => (
                          <View style={{padding: 10}}>
                            <Text style={styles.LReqSR_DropdownItemText}>
                              {item.label}
                            </Text>
                          </View>
                        )}
                      />
                    </View>
                  )}

                  {/* STYLE DROPDOWN */}
                  {styleList.length > 0 && (
                    <View style={styles.LReqSR_FieldWrapper}>
                      <Text style={styles.LReqSR_Label}>Style</Text>
                      <Dropdown
                        style={styles.LReqSR_Input}
                        data={styleList}
                        labelField="label"
                        valueField="value"
                        placeholder="Select Style"
                        value={selectedStyle}
                        onChange={item => setSelectedStyle(item.value)}
                        search
                        searchPlaceholder="Search Style"
                        placeholderStyle={styles.LReqSR_DropdownPlaceholder}
                        selectedTextStyle={styles.LReqSR_DropdownSelectedText}
                        itemTextStyle={styles.LReqSR_DropdownItemText}
                        inputSearchStyle={{color: '#888'}}
                        activeColor="#E6F0FF"
                        containerStyle={[
                          styles.LReqSR_DropdownContainer,
                          {zIndex: 997},
                        ]}
                        maxHeight={280}
                        dropdownPosition="auto"
                        renderItem={item => (
                          <View style={{padding: 10}}>
                            <Text style={styles.LReqSR_DropdownItemText}>
                              {item.label}
                            </Text>
                          </View>
                        )}
                      />
                    </View>
                  )}

                  {/* BATCH DROPDOWN */}
                  {batchList.length > 0 && (
                    <View style={styles.LReqSR_FieldWrapper}>
                      <Text style={styles.LReqSR_Label}>Batch</Text>
                      <Dropdown
                        style={styles.LReqSR_Input}
                        data={batchList}
                        labelField="label"
                        valueField="value"
                        placeholder="Select Batch"
                        value={selectedBatch}
                        onChange={item => setSelectedBatch(item.value)}
                        search
                        searchPlaceholder="Search Batch"
                        placeholderStyle={styles.LReqSR_DropdownPlaceholder}
                        selectedTextStyle={styles.LReqSR_DropdownSelectedText}
                        itemTextStyle={styles.LReqSR_DropdownItemText}
                        inputSearchStyle={{color: '#888'}}
                        activeColor="#E6F0FF"
                        containerStyle={[
                          styles.LReqSR_DropdownContainer,
                          {zIndex: 996},
                        ]}
                        maxHeight={280}
                        dropdownPosition="auto"
                        renderItem={item => (
                          <View style={{padding: 10}}>
                            <Text style={styles.LReqSR_DropdownItemText}>
                              {item.label}
                            </Text>
                          </View>
                        )}
                      />
                    </View>
                  )}

                  {/* SERIAL DROPDOWN */}
                  {serialList.length > 0 && (
                    <View style={styles.LReqSR_FieldWrapper}>
                      <Text style={styles.LReqSR_Label}>Serial</Text>
                      <Dropdown
                        style={styles.LReqSR_Input}
                        data={serialList}
                        labelField="label"
                        valueField="value"
                        placeholder="Select Serial"
                        value={selectedSerial}
                        onChange={item => setSelectedSerial(item.value)}
                        search
                        searchPlaceholder="Search Serial"
                        placeholderStyle={styles.LReqSR_DropdownPlaceholder}
                        selectedTextStyle={styles.LReqSR_DropdownSelectedText}
                        itemTextStyle={styles.LReqSR_DropdownItemText}
                        inputSearchStyle={{color: '#888'}}
                        activeColor="#E6F0FF"
                        containerStyle={[
                          styles.LReqSR_DropdownContainer,
                          {zIndex: 995},
                        ]}
                        maxHeight={280}
                        dropdownPosition="auto"
                        renderItem={item => (
                          <View style={{padding: 10}}>
                            <Text style={styles.LReqSR_DropdownItemText}>
                              {item.label}
                            </Text>
                          </View>
                        )}
                      />
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {/* ACTION BUTTONS
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                margin: 20,
              }}>
              <TouchableOpacity
                onPress={handleOkPress}
                style={{
                  backgroundColor: '#0275d8',
                  paddingVertical: 12,
                  paddingHorizontal: 25,
                  borderRadius: 8,
                }}>
                <Text style={{color: '#fff', fontSize: 16, fontWeight: 'bold'}}>
                  OK
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={goBack}
                style={{
                  backgroundColor: '#fff',
                  paddingVertical: 12,
                  paddingHorizontal: 25,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#170a09ff',
                }}>
                <Text style={{color: '#000', fontSize: 16, fontWeight: 'bold'}}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View> */}

            <SaveRecordButtons
              mode={mode}
              processingButton={processingButton}
              onSave={handleOkPress}
              onCancel={goBack}
              isDisabled={
                processingButton === 'save' || processingButton === 'submit'
              }
              showButtons={[BUTTON_TYPES.CREATE, BUTTON_TYPES.CANCEL]}
            />

            <AlertModal
              visible={alertModal}
              heading="Alert"
              text={alertMessage}
              onPress={() => setAlertModal(false)}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}
    </ActionPaneContainer>
  );
};

export default PurchaseRequisitionLinesSaveRecord;
