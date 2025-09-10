/* eslint-disable dot-notation */
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const RetrieveEmployeeMenuItems = async ({employeeId}) => {
  try {
    const token = await getToken();

    const soapBody = `
      <retrieveEmployeeMenuItems xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
        <_menuType>${'MobileApp'}</_menuType>
      </retrieveEmployeeMenuItems>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // console.log('soapEnvelope in Retrieve Employee Menu Items', soapEnvelope);

    const {data: xml} = await axios.post(
      `${resource}soap/services/DFUserInfoSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFUserInfoSvc/retrieveEmployeeMenuItems',
        },
        responseType: 'text',
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);
    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'retrieveEmployeeMenuItemsResponse'
      ]?.['result']?.['a:DFEmployeeMenusContract'];

    // console.log('xml in Retrieve Employee Menu Items', xml);
    // console.log('parsed in Retrieve Employee Menu Items', parsed);
    // console.log('rawData in Retrieve Employee Menu Items', rawData);

    if (!rawData) {
      console.log('No Retrieve Employee Menu Items Request Response found');
      return [];
    }

    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''),
          value,
        ]),
      );

    const cleanedData = Array.isArray(rawData)
      ? rawData.map(cleanObject)
      : [cleanObject(rawData)];

    // console.log('cleanedData in Retrieve Employee Menu Items', cleanedData);

    return cleanedData;
  } catch (err) {
    console.error(
      'Retrieve Employee Menu Items Request SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {RetrieveEmployeeMenuItems};
