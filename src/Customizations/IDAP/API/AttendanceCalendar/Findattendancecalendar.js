/* eslint-disable curly */
/* eslint-disable dot-notation */
// Finds ALL attendance records for a given pay period and employee.
// (Date filtering was removed — the X++ service now returns every
// attendance row for the period/worker, and the calendar screen does its
// own date-based grouping on the client.)
//
// Operation: DFAttendanceCalendarSvc/findAttendanceCalendar
//   Group    : DFAttendanceCalenderSvcGroup
//   Params (element order in the SOAP body is ALPHABETICAL, per the AIF
//           document/literal schema's xs:sequence — NOT declaration order):
//     <_personnelNumberId> (string) — HcmPersonnelNumberId
//     <_recId>             (Int64)  — PayrollPayPeriodRecId
//   Returns  : (Array of) a:DFAttendanceCalendarContract
//
// NOTE: the operation namespace is "http://tempuri.org" with NO trailing slash.
// Do not add one.
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../Controller/secureConfig';

const FindAttendanceCalendar = async (payPeriodRecId, personnelNumberId) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!payPeriodRecId) {
      console.log(
        '[Attendance FIND] bailing — missing payPeriodRecId. value:',
        payPeriodRecId,
        typeof payPeriodRecId,
      );
      return [];
    }

    if (!personnelNumberId) {
      console.log(
        '[Attendance FIND] bailing — missing personnelNumberId. value:',
        personnelNumberId,
        typeof personnelNumberId,
      );
      return [];
    }

    const token = await getToken();

    console.log('[Attendance FIND] calling with:', {
      payPeriodRecId,
      typeOfRecId: typeof payPeriodRecId,
      personnelNumberId,
      typeOfPersonnelNumberId: typeof personnelNumberId,
    });

    // Element order MUST be alphabetical (_personnelNumberId, _recId) to
    // match the AIF-generated schema's xs:sequence.
    const soapBody = `
      <findAttendanceCalendar xmlns="http://tempuri.org">
        <_personnelNumberId>${personnelNumberId}</_personnelNumberId>
        <_recId>${payPeriodRecId}</_recId>
      </findAttendanceCalendar>
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
            'http://tempuri.org/DFAttendanceCalendarSvc/findAttendanceCalendar',
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    // TEMP DEBUG — raw response as sent over the wire, before any parsing.
    // Remove once the Jan-2026 period is confirmed matching Dynamics.
    console.log('[Attendance FIND] raw response:', {
      status: response.status,
      length: response.data ? response.data.length : 0,
      dataSnippet: (response.data || '').slice(0, 4000),
    });

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
      parsed?.['s:Envelope']?.['s:Body']?.['findAttendanceCalendarResponse']?.[
        'result'
      ];

    // TEMP DEBUG — shape of the <result> node after XML→JS parsing, before
    // we go looking for the contract array inside it.
    console.log('[Attendance FIND] parsed result node:', {
      resultType: typeof result,
      resultKeys:
        result && typeof result === 'object' ? Object.keys(result) : result,
    });

    if (
      !result ||
      (typeof result === 'object' && Object.keys(result).length === 0)
    ) {
      console.log('[Attendance FIND] empty result — no records for period');
      return [];
    }

    const rawContracts =
      result['a:DFAttendanceCalendarContract'] ||
      result['DFAttendanceCalendarContract'];

    if (!rawContracts) {
      console.log('[Attendance FIND] result node had no contracts:', result);
      return [];
    }

    const contracts = Array.isArray(rawContracts)
      ? rawContracts
      : [rawContracts];

    // TEMP DEBUG — how many contract rows actually came back, and the raw
    // (unmapped) shape of the first one, to check field names/casing match
    // what `pick` below expects.
    console.log('[Attendance FIND] contracts found:', contracts.length);
    console.log('[Attendance FIND] first raw contract:', contracts[0]);

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

    // AX's TimeExpected/TimeOfDay fields use -1 as their "not entered"
    // sentinel (0 is a legitimate midnight clock event, so it can't be used
    // as the "unset" marker). Normalize -1 to null here, once, so every
    // downstream consumer (status derivation, time formatting) can just
    // check for null/undefined instead of special-casing -1 everywhere.
    const toTimeOrNull = value => {
      const num = toInt(value);
      return num < 0 ? null : num;
    };

    const toBool = value => toStr(value).toLowerCase() === 'yes';

    const toDate = value => {
      const str = toStr(value);
      if (!str) return null;
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    };

    const records = contracts.map(contract => ({
      AttendanceRecId: toInt(pick(contract, 'AttendanceRecId')),
      AttendanceDate: toDate(pick(contract, 'AttendanceDate')),
      ClockIn: toTimeOrNull(pick(contract, 'ClockIn')),
      ClockOut: toTimeOrNull(pick(contract, 'ClockOut')),
      IsLateArrival: toBool(pick(contract, 'IsLateArrival')),
      IsEarlyDeparture: toBool(pick(contract, 'IsEarlyDeparture')),
      IsAbsent: toBool(pick(contract, 'IsAbsent')),
      IsLeave: toBool(pick(contract, 'IsLeave')),
    }));

    // TEMP DEBUG — the final, mapped records exactly as the calendar screen
    // will consume them. Compare AttendanceDate + flags row-by-row against
    // the Dynamics "My view" grid to confirm they match.
    console.log(
      '[Attendance FIND] mapped records:',
      records.map(r => ({
        date: r.AttendanceDate ? r.AttendanceDate.toDateString() : null,
        clockIn: r.ClockIn,
        clockOut: r.ClockOut,
        isAbsent: r.IsAbsent,
        isLeave: r.IsLeave,
        isLate: r.IsLateArrival,
        isEarly: r.IsEarlyDeparture,
      })),
    );

    return records;
  } catch (err) {
    console.error(
      '[Attendance FIND] SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {FindAttendanceCalendar};
