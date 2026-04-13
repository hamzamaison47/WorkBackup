/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

/**
 * Retrieve employee reportees via SOAP from D365 FO
 * @param {string} employeeId - HcmPersonnelNumberId
 * @returns {Promise<Array>} - Array of PREmploymentInformationSvcContract
 */
const RetrieveEmployeeReporteesEmpInfo = async employeeId => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found.');
    }

    const token = await getToken();

    // ✅ SOAP Body with parameter
    const soapBody = `
      <retriveEmployeeReportees xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
      </retriveEmployeeReportees>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/PREmploymentInformationSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/PREmploymentInformationSvc/retriveEmployeeReportees',
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

    // ✅ Navigate SOAP Response to the return list
    const rawData =
      parsed['s:Envelope']['s:Body']['retriveEmployeeReporteesResponse'][
        'result'
      ]['a:PREmploymentInformationSvcContract'];

    if (!rawData) return [];

    // ✅ Clean namespace prefix
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
      'RetrieveEmployeeReportees error:',
      err.response?.data || err.message,
    );
    return [];
  }
};

export {RetrieveEmployeeReporteesEmpInfo};
