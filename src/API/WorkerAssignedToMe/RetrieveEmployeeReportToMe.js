/* eslint-disable dot-notation */
import {getToken} from '../Token/getToken';
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const RetrieveEmployeeReportToMe = async ({employeeId}) => {
  try {
    const accessToken = await getToken();

    const soapBody = `
    <retrieve xmlns = "http://tempuri.org">
      <_employeeId>${employeeId}</_employeeId>
    </retrieve>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${resource}soap/services/HREmployeesListReportToMeSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/HREmployeesListReportToMeSvc/retrieve',
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
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveResponse']?.['result']?.[
        'a:HREmployeesListReportToMeSvcContract'
      ];

    if (!rawData) {
      console.log('No leave data found');
      return [];
    }

    // Normalize and remove "a:" prefix from keys
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

    return cleanedData;
  } catch (error) {
    console.error('Failed to fetch Team employee IDs:', error);
    throw error;
  }
};

export {RetrieveEmployeeReportToMe};
