/* eslint-disable curly */
/* eslint-disable dot-notation */
import {getActiveConfigData} from '../../Controller/secureConfig';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {normalizeObject} from './soapNormalize';

const RetrieveByPersonAttendance = async ({person}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <retrieveByPerson xmlns="http://tempuri.org">
        <_personRecId>${person}</_personRecId>
      </retrieveByPerson>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    if (__DEV__) {
      console.log('Person =-=-=-=-=-', {person});
      console.log('soapEnvelope =-=-=-=-=-', {soapEnvelope});
    }

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFUserAttendanceSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DFUserAttendanceSvc/retrieveByPerson',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        responseType: 'text',
        timeout: 10000, // 10 seconds timeout for slow internet
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      trimValues: true,
    });

    const parsed = parser.parse(xml);

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveByPersonResponse']?.[
        'result'
      ];

    if (!result || Object.keys(result).length === 0) {
      console.log('No person attendance returned from backend');
      return [];
    }

    // AX SOAP sometimes returns single object instead of array
    let attendanceContracts =
      result?.['a:DFUserAttendanceSvcContract'] ||
      result?.['DFUserAttendanceSvcContract'];

    // If the contract key is missing, it means there are no actual records (even if "result" has XML namespaces)
    if (!attendanceContracts) {
      console.log('No person attendance records found');
      return [];
    }

    if (!Array.isArray(attendanceContracts)) {
      attendanceContracts = [attendanceContracts];
    }

    const cleanedData = attendanceContracts.map((item, index) => {
      const normalized = normalizeObject(item);

      return {
        $id: String(index + 1),
        ...normalized,
      };
    });

    if (__DEV__) {
      console.log(
        'Final cleaned person attendance data:',
        cleanedData?.length,
        'records fetched',
      );
      console.log('Final cleaned person attendance data:', cleanedData);
    }

    return cleanedData;
  } catch (err) {
    if (__DEV__) {
      console.error(
        'Retrieve Person attendance SOAP error:',
        err.response?.data || err.message,
      );
    }
    if (
      err.code === 'ECONNABORTED' ||
      !err.response ||
      err.message?.toLowerCase().includes('network error')
    ) {
      throw new Error('Internet connection is slow or down. Please try again.');
    }
    throw err;
  }
};

export {RetrieveByPersonAttendance};
