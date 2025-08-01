/* eslint-disable dot-notation */
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';

const GetLeaveBalance = async ({employeeId, leaveCode, leaveStartDate}) => {
  try {
    const token = await getToken();

    const soapBody = `
      <getLeaveBalance xmlns="http://tempuri.org">
        <_employeeId>${employeeId}</_employeeId>
        <_leaveCode>${leaveCode}</_leaveCode>
        <_leaveStartDate>${leaveStartDate}</_leaveStartDate>
      </getLeaveBalance>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${resource}soap/services/PREmploymentInformationSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/PREmploymentInformationSvc/getLeaveBalance',
        },
        responseType: 'text',
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      attributeNamePrefix: '',
      isArray: () => false,
      parseTagValue: true,
    });

    const parsed = parser.parse(xml);

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['getLeaveBalanceResponse']?.[
        'result'
      ];

    if (result === undefined || result === null) {
      console.log('No leave balance found');
      return null;
    }

    return Number(result); // Convert to number if not already
  } catch (err) {
    console.error(
      'GetLeaveBalance SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {GetLeaveBalance};
