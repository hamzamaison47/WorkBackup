/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../Controller/secureConfig';

const RetrieveExpenseCategory = async ({workerRecId}) => {
  try {
    const config = await getActiveConfigData();
    console.log('here is what is going in id', workerRecId);

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `<retrieveExpenseCategory xmlns="http://tempuri.org">
      <_workerRecId>${workerRecId}</_workerRecId>
      </retrieveExpenseCategory>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/ExpenseReportSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml; charset=utf-8',
          SOAPAction:
            'http://tempuri.org/ExpenseReportsServiceSvc/retrieveExpenseCategory',
        },
        responseType: 'text',
      },
    );

    // console.log({soapEnvelope});

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);
    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveExpenseCategoryResponse']?.[
        'result'
      ]?.['a:ExpenseReportLookupSvcContract'];

    if (!rawData) {
      console.log('No Retrieve Expense Category Response found');
      return [];
    }

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
  } catch (err) {
    console.error(
      'Retrieve Expense Category SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {RetrieveExpenseCategory};
