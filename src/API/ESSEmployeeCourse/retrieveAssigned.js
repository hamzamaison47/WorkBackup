/* eslint-disable dot-notation */
import {getToken} from '../Token/getToken';
import {XMLParser} from 'fast-xml-parser';
import {getActiveConfigData} from '../../Controller/secureConfig';
import axios from 'axios';

const retrieveAssigned = async ({person}) => {
  try {
    // Get configuration from secure storage
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const accessToken = await getToken();
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
      <soapenv:Header>
        <dat:CallContext xmlns:dat="http://schemas.microsoft.com/dynamics/2013/01/datacontracts">
            <dat:Company>USMF</dat:Company>
            <dat:Language>en-us</dat:Language>
        </dat:CallContext>
      </soapenv:Header>
      <soapenv:Body>
        <retrieveAssigned xmlns="http://tempuri.org">
          <_person>${person}</_person>
        </retrieveAssigned>
      </soapenv:Body>
    </soapenv:Envelope>`;

    console.log({soapEnvelope});

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/ESSCourseSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/ESSCourseSvc/retrieveAssigned',
        },
        responseType: 'text',
      },
    );
    console.log(xml);
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: false,
    });

    const parsed = parser.parse(xml);

    const rawData =
      parsed?.['s:Envelope']?.['s:Body']?.['retrieveAssignedResponse']?.[
        'result'
      ];

    let courseData =
      rawData?.['a:ESSCourseContract'] ||
      rawData?.['ESSCourseContract'] ||
      rawData;

    if (!courseData || Object.keys(courseData).length === 0) {
      console.warn('No assigned courses found');
      return [];
    }

    // Handle both single object and array responses
    const courseArray = Array.isArray(courseData) ? courseData : [courseData];

    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''), // remove the namespace prefix
          value,
        ]),
      );

    const cleanedData = courseArray.map(cleanObject);

    console.log({cleanedData});

    return cleanedData;
  } catch (error) {
    console.error('Failed to fetch assigned courses:', error);
    throw error;
  }
};

export {retrieveAssigned};
