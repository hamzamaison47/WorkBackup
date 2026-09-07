/* eslint-disable curly */
/* eslint-disable dot-notation */
// Finds every payroll pay period (no filter — returns the full list).
//
// Operation: DFAttendanceCalendarSvc/findPayPeriod
//   Group    : DFAttendanceCalenderSvcGroup
//   Params   : none
//   Returns  : (Array of) a:DFAttendanceCalendarContract
//
// NOTE: the operation namespace is "http://tempuri.org" with NO trailing slash.
// Do not add one.
//
// PayPeriodStart/PayPeriodEnd are parsed LITERALLY (digits taken as-is, no
// timezone shift) — same convention as every other plain business date in
// this app (see dynamicsDate.js). If a standard-form check ever shows these
// two fields are auto-converted by the Dynamics kernel (the way SLD_DepDateTime/
// SLD_ArrivalDateTime are), this parsing will need to change to match — but
// there's no evidence of that yet for PayrollPayPeriod's own start/end dates.
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../Controller/secureConfig';

const FindPayPeriod = async () => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // NOTE: the operation namespace is "http://tempuri.org" with NO trailing
    // slash. Do not add one.
    const soapBody = `
      <findPayPeriod xmlns="http://tempuri.org">
      </findPayPeriod>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/DFAttendanceCalenderSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DFAttendanceCalendarSvc/findPayPeriod',
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: false,
      parseTagValue: false,
      trimValues: true,
      alwaysCreateTextNode: false,
      allowBooleanAttributes: false,
      parseAttributeValue: false,
    });

    const parsed = parser.parse(response.data);

    if (parsed?.['s:Envelope']?.['s:Body']?.['s:Fault']) {
      const fault = parsed['s:Envelope']['s:Body']['s:Fault'];
      const faultReason =
        fault.faultstring || fault.Reason?.Text || 'Unknown SOAP fault';
      throw new Error(`SOAP Fault: ${faultReason}`);
    }

    const result =
      parsed?.['s:Envelope']?.['s:Body']?.['findPayPeriodResponse']?.['result'];

    // 0-row case: result absent or an empty object.
    if (
      !result ||
      (typeof result === 'object' && Object.keys(result).length === 0)
    ) {
      console.log('[PayPeriod FIND] empty result — no pay periods found');
      return [];
    }

    const rawContracts =
      result['a:DFAttendanceCalendarContract'] ||
      result['DFAttendanceCalendarContract'];

    if (!rawContracts) {
      console.log('[PayPeriod FIND] result node had no contracts:', result);
      return [];
    }

    const contracts = Array.isArray(rawContracts)
      ? rawContracts
      : [rawContracts];

    // Tolerates the a: datacontract namespace prefix on contract elements.
    const pick = (obj, name) =>
      obj?.['a:' + name] !== undefined ? obj['a:' + name] : obj?.[name];

    const toStr = value => {
      if (value === undefined || value === null) return '';
      if (typeof value === 'object')
        return value['#text'] !== undefined ? String(value['#text']) : '';
      return String(value);
    };

    const toInt = value => {
      const num = parseInt(toStr(value), 10);
      return isNaN(num) ? 0 : num;
    };

    // D365 serializes "no date" as 1900-01-01T00:00:00; surface that as null
    // so the UI can render N/A rather than a bogus 1900 date. Parses date
    // components directly from the string instead of new Date(str) — Hermes
    // interprets a timezone-less ISO string as UTC, which silently shifts the
    // wall-clock time once read back via local getters.
    const toDate = value => {
      const str = toStr(value);
      if (!str || str.startsWith('1900-01-01')) return null;

      const match = str.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/,
      );
      if (!match) return null;

      const [, year, month, day, hours, minutes, seconds] = match;
      const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hours),
        Number(minutes),
        Number(seconds),
      );

      return isNaN(date.getTime()) ? null : date;
    };

    const periods = contracts.map(contract => ({
      PayPeriodRecId: toInt(pick(contract, 'PayPeriodRecId')),
      PayPeriodStart: toDate(pick(contract, 'PayPeriodStart')),
      PayPeriodEnd: toDate(pick(contract, 'PayPeriodEnd')),
    }));

    return periods;
  } catch (err) {
    console.error(
      '[PayPeriod FIND] SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {FindPayPeriod};
