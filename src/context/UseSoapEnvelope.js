import {useContext} from 'react';
// import {CompanyContext} from './CompanyContext';
import {UserContext} from './UserContext';

export const UseSoapEnvelope = () => {
  //   const {selectedLegalEntity} = useContext(CompanyContext);
  const {userData} = useContext(UserContext);
  const language = 'en-us';

  const createSoapEnvelope = bodyContent => {
    return `<?xml version="1.0" encoding="utf-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
        <soapenv:Header>
            <dat:CallContext xmlns:dat="http://schemas.microsoft.com/dynamics/2013/01/datacontracts">
            <dat:Company>${userData.defaultLegalEntity}</dat:Company>
            <dat:Language>${language}</dat:Language>
            </dat:CallContext>
        </soapenv:Header>
        <soapenv:Body>
            ${bodyContent}
        </soapenv:Body>
    </soapenv:Envelope>`;
  };

  return createSoapEnvelope;
};
