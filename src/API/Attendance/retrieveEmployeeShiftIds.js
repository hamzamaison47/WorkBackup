/* eslint-disable curly */
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
const retrieveEmployeeShiftIds = async ({employeeId}) => {
  try {
    const config = await getActiveConfigData();
    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    if (!employeeId) throw new Error('Employee ID is required.');

    /* -------------------------------------------------------------- */
    /* Build SOAP body - FIXED VERSION                               */
    /* -------------------------------------------------------------- */
    const soapBody = `
      <retrieveEmployeeShiftId xmlns="http://tempuri.org">
        <_employeeID>${escapeXml(employeeId)}</_employeeID>
      </retrieveEmployeeShiftId>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    console.log('SOAP Request:', {soapEnvelope});

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

    console.log('SOAP Response:', xml);

    /* -------------------------------------------------------------- */
    /* Parse SOAP response - FIXED PARSING                           */
    /* -------------------------------------------------------------- */
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false, // Changed to false to handle namespaces properly
      removeNSPrefix: false, // Keep namespace prefixes
      attributeNamePrefix: '@_',
      allowBooleanAttributes: false,
      parseTagValue: true,
      parseAttributeValue: false,
      trimValues: true,
      isArray: (name, jpath, isLeafNode, isAttribute) => {
        // Make TASAttendanceItemsContract always an array
        if (
          name === 'TASAttendanceItemsContract' ||
          jpath.endsWith('/TASAttendanceItemsContract')
        ) {
          return true;
        }
        return false;
      },
    });

    const parsed = parser.parse(xml);
    console.log('Full parsed XML:', JSON.stringify(parsed, null, 2));

    const body =
      parsed['s:Envelope']?.['s:Body'] || parsed.Envelope?.Body || {};

    const fault = body.Fault || body['s:Fault'];
    if (fault) {
      throw new Error(
        fault.faultstring || fault.faultstring || 'SOAP Fault occurred',
      );
    }

    // Handle different possible response structures with namespaces
    const responseNode =
      body.retrieveEmployeeShiftIdResponse ||
      body['ns0:retrieveEmployeeShiftIdResponse'] ||
      body.retrieveEmployeeShiftIdResponse ||
      {};

    console.log('Response node:', JSON.stringify(responseNode, null, 2));

    let resultNode =
      responseNode.result ||
      responseNode['ns0:result'] ||
      responseNode.return ||
      {};

    console.log('Result node:', JSON.stringify(resultNode, null, 2));

    if (!resultNode || Object.keys(resultNode).length === 0) {
      console.warn('No result node found in response');
      return [];
    }

    /* -------------------------------------------------------------- */
    /* Handle the response data - IMPROVED PARSING                   */
    /* -------------------------------------------------------------- */
    let rawList = [];

    // Try multiple possible paths to find TASAttendanceItemsContract
    if (resultNode['a:TASAttendanceItemsContract']) {
      rawList = Array.isArray(resultNode['a:TASAttendanceItemsContract'])
        ? resultNode['a:TASAttendanceItemsContract']
        : [resultNode['a:TASAttendanceItemsContract']];
    } else if (resultNode.TASAttendanceItemsContract) {
      rawList = Array.isArray(resultNode.TASAttendanceItemsContract)
        ? resultNode.TASAttendanceItemsContract
        : [resultNode.TASAttendanceItemsContract];
    } else if (resultNode['ns0:TASAttendanceItemsContract']) {
      rawList = Array.isArray(resultNode['ns0:TASAttendanceItemsContract'])
        ? resultNode['ns0:TASAttendanceItemsContract']
        : [resultNode['ns0:TASAttendanceItemsContract']];
    }
    // Check if resultNode itself is the array/object we need
    else if (resultNode['a:ShiftId'] || resultNode.ShiftId) {
      rawList = [resultNode];
    }

    console.log('Raw list:', rawList);

    // Extract shift IDs with multiple possible property names
    const shiftIds = rawList
      .map(item => {
        // Try all possible property names due to namespaces
        const shiftId =
          item['a:ShiftId'] ||
          item.ShiftId ||
          item['ns0:ShiftId'] ||
          item.ShiftId ||
          item.shiftId;

        console.log('Item:', item, 'Extracted ShiftId:', shiftId);
        return shiftId;
      })
      .filter(s => s && s !== '' && s !== null && s !== undefined);

    console.log('Final shift IDs:', shiftIds);
    return shiftIds;
  } catch (error) {
    console.error(
      'Failed to retrieve employee shift IDs:',
      error.response?.data || error.message,
      error.stack,
    );
    throw error;
  }
};

/* ------------------------------------------------------------------ */
/* Helper – XML escape                                                */
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
