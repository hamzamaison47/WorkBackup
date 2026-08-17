/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../Controller/secureConfig';

const RetrieveSiteSurveyByExpense = async ({expenseNumber}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <retrieveSiteSurvey xmlns="http://tempuri.org">
        <_expNumber>${expenseNumber}</_expNumber>
      </retrieveSiteSurvey>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFTrvSiteSurveyFormSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFTrvSiteSurveyFormSvc/retrieveSiteSurvey',
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
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveSiteSurveyResponse']?.[
        'result'
      ]?.['a:DFTrvSiteSurveyFormContract'];

    if (!rawData) {
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
      'RetrieveSiteSurveyByExpense SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {RetrieveSiteSurveyByExpense};
