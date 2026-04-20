/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const retrieveESSIdentificationtableTableRecId = async ({person}) => {
  try {
    const config = await getActiveConfigData();
    console.log('here is the data received in service', person);

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
      <retrieveESSTableIdandRecId xmlns="http://tempuri.org">
        <_person>${person}</_person>
      </retrieveESSTableIdandRecId>`;

    const soapEnvelope = createSoapEnvelope(soapBody);
    const {data: xml} = await axios.post(
      `${config.resource}soap/services/HcmPersonIdentificationNumberSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/HcmPersonIdentificationNumberSvc/retrieveESSTableIdandRecId',
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

    // Check for Infolog messages
    const infolog = parsed?.['s:Envelope']?.['s:Header']?.['Infolog'];
    if (infolog && infolog.Entries) {
      console.log('Infolog messages:', infolog.Entries);
    }

    // Log the complete structure to see if there's any data
    console.log('Full parsed response:', JSON.stringify(parsed, null, 2));

    const resultElement =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'retrieveESSTableIdandRecIdResponse'
      ]?.['result'];

    // Check if result has any actual data (not just namespace declarations)
    const hasData = resultElement && Object.keys(resultElement).length > 2; // More than just xmlns attributes

    if (!hasData) {
      console.log(
        `No ESS identification records found for person RecId: ${person}`,
      );
      console.log(
        'This means the essPersonIdentificationNumber table has no entries for this PERSON field value',
      );
      return [];
    }

    const rawData =
      resultElement?.['a:HcmPersonIdentificationNumberSvcContract'];

    if (!rawData) {
      console.log('No contract data in result');
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

    console.log('Found ESS identification records:', cleanedData.length);
    return cleanedData;
  } catch (err) {
    console.error(
      'retrieveESSTableIdandRecId SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {retrieveESSIdentificationtableTableRecId};
