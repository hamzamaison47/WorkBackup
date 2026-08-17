/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../Controller/secureConfig';

const getEmployeeLeaveDays = async ({
  fromDate,
  toDate,
  leaveHours = 0,
  workerRecId,
  leaveName,
  isShortLeave = false, // ← destructure it
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const worker = Number(workerRecId) || 0;
    const fromDateOnly = String(fromDate).split('T')[0];
    const toDateOnly = String(toDate).split('T')[0];

    const soapBody = `
  <getEmployeeLeaveDays xmlns="http://tempuri.org">
    <_contract xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
      <a:FromDateForCreation>${fromDateOnly}</a:FromDateForCreation>
      <a:IsShortLeave>${isShortLeave ? 'true' : 'false'}</a:IsShortLeave>
      <a:LeaveNameForCreation>${leaveName || ''}</a:LeaveNameForCreation>
      <a:ToDateForCreation>${toDateOnly}</a:ToDateForCreation>
      <a:Worker>${worker}</a:Worker>
      <a:leaveHoursForCreation>${leaveHours}</a:leaveHoursForCreation>
    </_contract>
  </getEmployeeLeaveDays>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFEmployeeLeaveRequestSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFEmployeeLeaveRequestSvc/getEmployeeLeaveDays',
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
      parsed?.['s:Envelope']?.['s:Body']?.['getEmployeeLeaveDaysResponse']?.[
        'result'
      ]?.['a:DFEmployeeLeaveRequestContract'];

    if (!rawData) {
      console.log('No leave days data returned');
      return [];
    }

    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''),
          value,
        ]),
      );

    return Array.isArray(rawData)
      ? rawData.map(cleanObject)
      : [cleanObject(rawData)];
  } catch (err) {
    console.error(
      'getEmployeeLeaveDays SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {getEmployeeLeaveDays};
