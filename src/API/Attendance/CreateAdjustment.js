/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const SVC_GROUP = 'TASEmployeeAdjustmentLinesGroup';
const SOAP_ACTION = 'http://tempuri.org/TASEmployeeAdjustmentLinesSvc/create';

const CreateAdjustment = async ({
  employeeId,
  shiftId,
  attendanceDate, // Should be YYYY-MM-DD (Date only)
  clockIn, // ISO string (local or UTC)
  clockOut, // ISO string (local or UTC)
  remarks = '',
}) => {
  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // Validate required fields
    if (!employeeId) throw new Error('Employee ID is required.');
    if (!shiftId) throw new Error('Shift ID is required.');
    if (!attendanceDate) throw new Error('Attendance date is required.');
    if (!clockIn) throw new Error('Clock-in datetime is required.');
    if (!clockOut) throw new Error('Clock-out datetime is required.');

    // Format attendanceDate to YYYY-MM-DD (X++ expects Date, not DateTime)
    const formattedDate = attendanceDate.split('T')[0]; // Ensure only date part

    // Convert clockIn/clockOut to UTC ISO strings (X++ expects utcdatetime)
    // We'll send in UTC format: 2025-04-05T10:30:00Z
    const toUTCISO = dateStr => {
      const d = new Date(dateStr);
      if (isNaN(d)) throw new Error(`Invalid date: ${dateStr}`);
      return d.toISOString(); // Always UTC
    };

    const clockInUTC = toUTCISO(clockIn);
    const clockOutUTC = toUTCISO(clockOut);

    // Build SOAP body with contract
    const soapBody = `
      <create xmlns="http://tempuri.org">
        <contract xmlns:tem="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">
          ${buildContractXml({
            employeeId,
            shiftId,
            attendanceDate: formattedDate,
            clockIn: clockInUTC,
            clockOut: clockOutUTC,
            remarks,
          })}
        </contract>
      </create>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

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
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);

    // Extract result from SOAP response
    const body =
      parsed?.['s:Envelope']?.['s:Body'] ||
      parsed?.['soap:Envelope']?.['soap:Body'] ||
      {};

    const fault = body?.['s:Fault'] || body?.['soap:Fault'];
    if (fault) {
      throw new Error(fault.faultstring || 'SOAP Fault occurred');
    }

    const responseNode = body.createResponse || body['createResponse'] || {};

    const resultNode =
      responseNode.createResult ||
      responseNode['createResult'] ||
      responseNode.result ||
      responseNode['result'];

    if (!resultNode) {
      console.warn('No result node found in response', parsed);
      return {
        recId: null,
        isSuccess: false,
        message: 'No response from server.',
      };
    }

    // Clean namespace prefixes
    const cleanObject = obj => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(cleanObject);
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [
          k.replace(/^[a-zA-Z0-9]+:/, ''),
          cleanObject(v),
        ]),
      );
    };

    const cleaned = cleanObject(resultNode);

    // Return normalized response
    return {
      recId: cleaned?.RecId || null,
      isSuccess:
        String(cleaned?.IsSuccess || '').toLowerCase() === 'true' ||
        cleaned?.IsSuccess === true,
      message: cleaned?.Message || 'Operation completed.',
    };
  } catch (error) {
    console.error(
      'Failed to create adjustment:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

// Helper: Build <tem:Field> XML for contract
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
    AttendanceDate: attendanceDate, // Date only: YYYY-MM-DD
    ClockIn: clockIn, // UTC ISO: 2025-04-05T05:30:00Z
    ClockOut: clockOut, // UTC ISO
    EmployeeId: employeeId,
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
