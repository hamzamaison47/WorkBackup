/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const GetLeaveDays = async ({
  employeeId,
  leaveCode,
  leaveStartDate,
  leaveEndDate,
}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <getLeaveDays xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
        <_leaveCode>${leaveCode}</_leaveCode>
        <_leaveEndDate>${leaveEndDate}</_leaveEndDate>
        <_leaveStartDate>${leaveStartDate}</_leaveStartDate>
      </getLeaveDays>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    // console.log({soapEnvelope});

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/PREmployeeLeavesSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/PREmployeeLeavesSvc/getLeaveDays',
        },
        responseType: 'text',
      },
    );

    // console.log({xml});

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: true,
    });

    const parsed = parser.parse(xml);

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['getLeaveDaysResponse']?.['result'];

    if (result === undefined || result === null) {
      console.log('No leave balance found');
      return null;
    }

    // console.log({result});

    return Number(result); // Convert to number if not already
  } catch (err) {
    console.error(
      'GetLeaveBalance SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {GetLeaveDays};
