/* eslint-disable curly */

import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const SVC_GROUP = 'TASEmployeeAdjustmentLinesGroup';
const SOAP_ACTION =
  'http://tempuri.org/TASEmployeeAdjustmentLinesSvc/CreateAdjustment';

const CreateAdjustment = async ({
  attendanceDate,
  clockIn,
  clockOut,
  employeeId,
  remarks = '',
  shiftId,
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    if (!employeeId) throw new Error('Employee ID is required.');
    if (!shiftId) throw new Error('Shift ID is required.');
    if (!attendanceDate) throw new Error('Attendance date is required.');
    if (!clockIn) throw new Error('Clock-in datetime is required.');
    if (!clockOut) throw new Error('Clock-out datetime is required.');

    const formattedDate = attendanceDate.split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      throw new Error(`Invalid attendance date format: ${formattedDate}`);
    }

    const toUTCISO = dateStr => {
      const d = new Date(dateStr);
      if (isNaN(d)) throw new Error(`Invalid datetime: ${dateStr}`);
      return d.toISOString();
    };

    const clockInUTC = toUTCISO(clockIn);
    const clockOutUTC = toUTCISO(clockOut);

    const soapBody = `
      <CreateAdjustment xmlns="http://tempuri.org">
        <contract xmlns:tem="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
          ${buildContractXml({
            attendanceDate: formattedDate,
            clockIn: clockInUTC,
            clockOut: clockOutUTC,
            employeeId,
            remarks,
            shiftId,
          })}
        </contract>
      </CreateAdjustment>`;

    const soapEnvelope = createSoapEnvelope(soapBody);
    console.log('SOAP Request:', soapEnvelope);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/${SVC_GROUP}`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction: SOAP_ACTION,
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseTagValue: true,
      parseAttributeValue: true,
      trimValues: true,
      isArray: () => false,
    });

    const parsed = parser.parse(xml);
    console.log('PARSED SOAP RESPONSE:', JSON.stringify(parsed, null, 2));

    const body =
      parsed?.['s:Envelope']?.['s:Body'] ||
      parsed?.['soap:Envelope']?.['soap:Body'] ||
      parsed?.Envelope?.Body ||
      {};

    const fault = body?.['s:Fault'] || body?.['soap:Fault'] || body.Fault;
    if (fault) {
      const msg =
        fault.faultstring?.['#text'] ||
        fault.faultstring ||
        fault.reason?.['#text'] ||
        'SOAP Fault occurred';
      throw new Error(msg);
    }

    // === Find CreateResponse ===
    let CreateAdjustmentResponseNode = null;
    for (const [key, value] of Object.entries(body)) {
      if (key.endsWith('CreateAdjustmentResponse')) {
        CreateAdjustmentResponseNode = value;
        break;
      }
    }

    if (!CreateAdjustmentResponseNode) {
      console.warn('No CreateResponse found:', body);
      return {
        recId: null,
        isSuccess: false,
        message: 'No CreateResponse in server reply.',
      };
    }

    // === Find 'result' (not CreateResult!) ===
    let resultNode = null;
    for (const [key, value] of Object.entries(CreateAdjustmentResponseNode)) {
      if (key === 'result' || key.endsWith(':result')) {
        resultNode = value;
        break;
      }
    }

    if (!resultNode) {
      console.warn('No result node found:', CreateAdjustmentResponseNode);
      return {
        recId: null,
        isSuccess: false,
        message: 'No result node in response.',
      };
    }

    // === Clean namespace prefixes ===
    const cleanObject = obj => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(cleanObject);
      const cleaned = {};
      for (const [k, v] of Object.entries(obj)) {
        const cleanKey = k.replace(/^[a-z0-9]+:/, '');
        cleaned[cleanKey] = cleanObject(v);
      }
      return cleaned;
    };

    const cleanedResult = cleanObject(resultNode);
    console.log('CLEANED RESULT:', cleanedResult);

    return {
      recId: cleanedResult.RecId ? Number(cleanedResult.RecId) : null,
      isSuccess: cleanedResult.IsSuccess === true,
      message: cleanedResult.Message || 'Operation completed.',
    };
  } catch (error) {
    console.error(
      'CreateAdjustment failed:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

const buildContractXml = ({
  attendanceDate,
  clockIn,
  clockOut,
  employeeId,
  remarks,
  shiftId,
}) => {
  const ns = 'tem';
  const fields = {
    AttendanceDate: attendanceDate,
    ClockIn: clockIn,
    ClockOut: clockOut,
    EmployeeId: employeeId,
    GenerationType: 'MobileApp',
    Remarks: remarks || '',
    ShiftId: shiftId,
  };

  return Object.entries(fields)
    .map(([field, value]) => {
      if (value === null || value === undefined || value === '') {
        return `<${ns}:${field} xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>`;
      }
      return `<${ns}:${field}>${escapeXml(value)}</${ns}:${field}>`;
    })
    .join('');
};

const escapeXml = str => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export {CreateAdjustment};
