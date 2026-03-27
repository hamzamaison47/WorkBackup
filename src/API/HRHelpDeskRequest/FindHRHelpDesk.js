/* eslint-disable dot-notation */
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { getToken } from '../Token/getToken';
import { createSoapEnvelope } from '../../store/utils/soapHeaderUtils';
import { getActiveConfigData } from '../../Controller/secureConfig';

const FindHRHelpDesk = async ({ recId }) => {
    try {
        const config = await getActiveConfigData();

        if (!config || !config.resource) {
            throw new Error('No configuration found. Please scan QR code first.');
        }

        const token = await getToken();

        const soapBody = `
      <find xmlns="http://tempuri.org">
        <_recId>${recId}</_recId>
      </find>`;

        const soapEnvelope = createSoapEnvelope(soapBody);

        const { data: xml } = await axios.post(
            `${config.resource}soap/services/ESSHRHelpDeskRequestSvcGroup`,
            soapEnvelope,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'text/xml;charset=utf-8',
                    SOAPAction: 'http://tempuri.org/ESSHRHelpDeskRequestSvc/find',
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
        const result =
            parsed?.['s:Envelope']?.['s:Body']?.['findResponse']?.['result'] ||
            parsed?.['soap:Envelope']?.['soap:Body']?.['findResponse']?.['result'];

        if (!result) {
            console.log('No HR HelpDesk record found for recId:', recId);
            return null;
        }

        const cleanObject = obj => {
            if (obj === null || obj === undefined) return obj;
            if (typeof obj !== 'object') return obj;
            if (Array.isArray(obj)) return obj.map(cleanObject);

            return Object.fromEntries(
                Object.entries(obj).map(([key, value]) => [
                    key.replace(/^[a-zA-Z0-9]+:/, ''),
                    typeof value === 'object' ? cleanObject(value) : value,
                ]),
            );
        };

        return cleanObject(result);
    } catch (err) {
        console.error(
            'Find HR HelpDesk SOAP error:',
            err.response?.data || err.message,
        );
        throw err;
    }
};

export { FindHRHelpDesk };
