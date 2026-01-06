import {store} from '../index.ts';

export const createSoapHeader = () => {
  const state = store.getState();
  const {selectedLegalEntity, defaultLegalEntity} = state.company;
  const {languageCode} = state.language;

  const companyToUse = selectedLegalEntity || defaultLegalEntity;
  // Use language code from Redux, fallback to 'en-us' if not set
  const language = languageCode || 'en-us';

  if (!companyToUse) {
    console.warn('No company found in Redux store for SOAP header');
    throw new Error('Company is required for SOAP header');
  }

  return `
    <soapenv:Header>
      <dat:CallContext xmlns:dat="http://schemas.microsoft.com/dynamics/2013/01/datacontracts">
        <dat:Company>${companyToUse}</dat:Company>
        <dat:Language>${language}</dat:Language>
      </dat:CallContext>
    </soapenv:Header>`;
};

export const createSoapEnvelope = bodyContent => {
  const header = createSoapHeader();

  return `<?xml version="1.0" encoding="utf-8"?>
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
      ${header}
      <soapenv:Body>
        ${bodyContent}
      </soapenv:Body>
    </soapenv:Envelope>`;
};

export const getCurrentCompany = () => {
  const state = store.getState();
  const {selectedLegalEntity, defaultLegalEntity} = state.company;
  return selectedLegalEntity || defaultLegalEntity;
};
