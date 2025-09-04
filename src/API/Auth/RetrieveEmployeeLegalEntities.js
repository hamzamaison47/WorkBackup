/* eslint-disable dot-notation */
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const RetrieveEmployeeLegalEntities = async ({employeeId}) => {
  try {
    const token = await getToken();

    const soapBody = `
      <retrieveEmployeeLegalEntities xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
      </retrieveEmployeeLegalEntities>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${resource}soap/services/DFUserInfoSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFUserInfoSvc/retrieveEmployeeLegalEntities',
        },
        responseType: 'text',
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      parseTagValue: true, // allow proper nested parsing
      isArray: tagName => tagName.includes('DFEmployeeLegalEntitiesContract'),
    });

    const parsed = parser.parse(xml);

    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'retrieveEmployeeLegalEntitiesResponse'
      ]?.['result']?.['a:DFEmployeeLegalEntitiesContract'];

    if (!rawData) {
      console.log('No Retrieve Employee Legal Entities Request Response found');
      return [];
    }

    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''), // remove "a:" namespace prefix
          value,
        ]),
      );

    const cleanedData = Array.isArray(rawData)
      ? rawData.map(cleanObject)
      : [cleanObject(rawData)];

    return cleanedData;
  } catch (err) {
    console.error(
      'Retrieve Employee Legal Entities Request SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {RetrieveEmployeeLegalEntities};
