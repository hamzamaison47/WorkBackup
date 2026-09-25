/* eslint-disable curly */
/* eslint-disable dot-notation */
// Finds attendance records for all direct reportees of a given manager
// on a specific date.
//
// Operation: DFAttendanceCalendarSvc/findTeamAttendance
//   Group    : DFAttendanceCalenderSvcGroup
//   Params (element order in the SOAP body is ALPHABETICAL, per the AIF
//           document/literal schema's xs:sequence — NOT declaration order):
//     <_date>              (xs:dateTime) — the target date (date only, time
//                                          serialized as midnight)
//     <_personnelNumberId> (string)      — HcmPersonnelNumberId of the manager
//   Returns  : (Array of) a:DFAttendanceCalendarContract
//              (includes WorkerName; does NOT include pay-period fields)
//
// NOTE: the operation namespace is "http://tempuri.org" with NO trailing slash.
// Do not add one.
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../Controller/secureConfig';

// Serialize a JS Date as the xs:dateTime AX expects: "YYYY-MM-DDT00:00:00".
// Reads the LOCAL date parts (getFullYear/getMonth/getDate) and forces the
// time to midnight, so the date never shifts due to UTC conversion. AX only
// matches on the date portion inside findTeamAttendance.
const toAxDateTime = date => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) throw new Error(`Invalid date supplied: ${date}`);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T00:00:00`;
};

const FindTeamAttendance = async (date, personnelNumberId) => {
  try {
    const config = await getActiveConfigData();
    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!date) {
      console.log(
        '[Team Attendance FIND] bailing — missing date. value:',
        date,
        typeof date,
      );
      return [];
    }

    if (!personnelNumberId) {
      console.log(
        '[Team Attendance FIND] bailing — missing personnelNumberId. value:',
        personnelNumberId,
        typeof personnelNumberId,
      );
      return [];
    }

    const token = await getToken();

    const axDate = toAxDateTime(date);

    console.log('[Team Attendance FIND] calling with:', {
      date,
      axDate,
      personnelNumberId,
    });

    // Element order MUST be alphabetical (_date, _personnelNumberId) to
    // match the AIF-generated schema's xs:sequence.
    const soapBody = `
      <findTeamAttendance xmlns="http://tempuri.org">
        <_date>${axDate}</_date>
        <_personnelNumberId>${personnelNumberId}</_personnelNumberId>
      </findTeamAttendance>
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
            'http://tempuri.org/DFAttendanceCalendarSvc/findTeamAttendance',
        },
        responseType: 'text',
        timeout: 30000,
      },
    );

    // TEMP DEBUG — raw response before any parsing.
    console.log('[Team Attendance FIND] raw response:', {
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
      parsed?.['s:Envelope']?.['s:Body']?.['findTeamAttendanceResponse']?.[
        'result'
      ];

    // TEMP DEBUG — shape of the <result> node after XML→JS parsing.
    console.log('[Team Attendance FIND] parsed result node:', {
      resultType: typeof result,
      resultKeys:
        result && typeof result === 'object' ? Object.keys(result) : result,
    });

    if (
      !result ||
      (typeof result === 'object' && Object.keys(result).length === 0)
    ) {
      console.log('[Team Attendance FIND] empty result — no records for date');
      return [];
    }

    const rawContracts =
      result['a:DFAttendanceCalendarContract'] ||
      result['DFAttendanceCalendarContract'];

    if (!rawContracts) {
      console.log(
        '[Team Attendance FIND] result node had no contracts:',
        result,
      );
      return [];
    }

    const contracts = Array.isArray(rawContracts)
      ? rawContracts
      : [rawContracts];

    // TEMP DEBUG — how many contract rows came back, and the raw shape of
    // the first one, to confirm field names/casing match what `pick` expects.
    console.log('[Team Attendance FIND] contracts found:', contracts.length);
    console.log('[Team Attendance FIND] first raw contract:', contracts[0]);

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

    // AX uses -1 as the "not entered" sentinel for TimeExpected fields.
    // Normalize to null so downstream consumers don't need to special-case it.
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
      WorkerName: toStr(pick(contract, 'WorkerName')),
      DepartmentName: toStr(pick(contract, 'DepartmentName')),
    }));

    // TEMP DEBUG — final mapped records as the team attendance screen will
    // consume them. Compare against Dynamics to confirm they match.
    console.log(
      '[Team Attendance FIND] mapped records:',
      records.map(r => ({
        date: r.AttendanceDate ? r.AttendanceDate.toDateString() : null,
        workerName: r.WorkerName,
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
      '[Team Attendance FIND] SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {FindTeamAttendance};
