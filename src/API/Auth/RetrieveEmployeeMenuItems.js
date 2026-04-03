/* eslint-disable dot-notation */
import {getActiveConfigData} from '../../Controller/secureConfig';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const RetrieveEmployeeMenuItems = async ({person}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <retrieveUserMenuItems xmlns="http://tempuri.org">
      <_menuType>MobileApp</_menuType>
      <_person>${person}</_person>
      </retrieveUserMenuItems>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFUserInfoSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DFUserInfoSvc/retrieveUserMenuItems',
        },
        responseType: 'text',
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      trimValues: true,
    });

    const parsed = parser.parse(xml);

    // 🔎 Navigate safely
    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveUserMenuItemsResponse']?.[
        'result'
      ];

    if (!result || Object.keys(result).length === 0) {
      console.log('No menu items returned from backend');
      return [];
    }

    // 🔥 AX sometimes returns single object OR array
    let menuContracts =
      result?.['a:DFEmployeeMenusContract'] ||
      result?.['DFEmployeeMenusContract'] ||
      result;

    if (!menuContracts) {
      return [];
    }

    if (!Array.isArray(menuContracts)) {
      menuContracts = [menuContracts];
    }

    const cleanedData = menuContracts.map(item => {
      const cleanObj = {};

      Object.keys(item).forEach(key => {
        const cleanKey = key.includes(':') ? key.split(':')[1] : key;

        const value = item[key];

        cleanObj[cleanKey] =
          value === null || value === undefined ? '' : String(value);
      });

      return cleanObj;
    });

    // console.log('Final cleaned menu data:', cleanedData);

    return cleanedData;
  } catch (err) {
    console.error(
      'Retrieve Employee Menu Items SOAP error:',
      err.response?.data || err.message,
    );
    return [];
  }
};

export {RetrieveEmployeeMenuItems};
