/* eslint-disable curly */
/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

/* ------------------------------------------------------------------ */
/* Service constants                                                   */
/* ------------------------------------------------------------------ */
const SVC_GROUP = 'TASEmployeeRosterGroup';
const SOAP_ACTION =
  'http://tempuri.org/TASEmployeeRosterSvc/retrieveEmployeeShiftId';

/* ------------------------------------------------------------------ */
/* Main exported function                                              */
/* ------------------------------------------------------------------ */
/**
 * Retrieves all ShiftId values that belong to the employee.
 *
 * @param {string} employeeId
 * @returns {Promise<string[]>} Array of shift IDs (e.g. ["DAY","NIGHT"])
 */
export const retrieveEmployeeShiftIds = async employeeId => {
  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    if (!employeeId) throw new Error('Employee ID is required.');

    /* -------------------------------------------------------------- */
    /* Build SOAP body – the contract only needs the employee id    */
    /* -------------------------------------------------------------- */
    const soapBody = `
      <retrieveEmployeeShiftId xmlns="http://tempuri.org">
        <_employeeID xmlns="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application">${escapeXml(
          employeeId,
        )}</_employeeID>
      </retrieveEmployeeShiftId>`;

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

    /* -------------------------------------------------------------- */
    /* Parse SOAP response                                            */
    /* -------------------------------------------------------------- */
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);

    const body =
      parsed?.['s:Envelope']?.['s:Body'] ||
      parsed?.['soap:Envelope']?.['soap:Body'] ||
      {};

    const fault = body?.['s:Fault'] || body?.['soap:Fault'];
    if (fault) {
      throw new Error(fault.faultstring || 'SOAP Fault occurred');
    }

    const responseNode =
      body.retrieveEmployeeShiftIdResponse ||
      body['retrieveEmployeeShiftIdResponse'] ||
      {};

    const resultNode =
      responseNode.retrieveEmployeeShiftIdResult ||
      responseNode['retrieveEmployeeShiftIdResult'] ||
      responseNode.result ||
      responseNode['result'];

    if (!resultNode) {
      console.warn('No result node found in response', parsed);
      return [];
    }

    /* -------------------------------------------------------------- */
    /* Clean namespace prefixes (same helper as CreateAdjustment)    */
    /* -------------------------------------------------------------- */
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

    /* -------------------------------------------------------------- */
    /* The service returns a list of TASAttendanceItemsContract      */
    /* each containing a ShiftId field.                               */
    /* -------------------------------------------------------------- */
    const rawList = cleaned?.TASAttendanceItemsContract || [];
    const list = Array.isArray(rawList) ? rawList : rawList ? [rawList] : [];

    const shiftIds = list.map(item => item?.ShiftId).filter(s => s); // remove empty/null

    return shiftIds;
  } catch (error) {
    console.error(
      'Failed to retrieve employee shift IDs:',
      error.response?.data || error.message,
    );
    throw error; // let the UI handle the error
  }
};

/* ------------------------------------------------------------------ */
/* Helper – XML escape (same as in CreateAdjustment)                  */
/* ------------------------------------------------------------------ */
const escapeXml = str => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};
export default retrieveEmployeeShiftIds;
