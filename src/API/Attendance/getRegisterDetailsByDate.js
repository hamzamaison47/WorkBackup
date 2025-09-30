// /* eslint-disable dot-notation */
// import axios from 'axios';
// import {XMLParser} from 'fast-xml-parser';
// import {getToken} from '../Token/getToken';
// import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
// import {getActiveConfigData} from '../../Controller/secureConfig';

// // --- helpers (mirror your sample) ---
// const stripA = key => key.replace(/^a:/, '');
// const cleanObject = obj =>
//   Object.fromEntries(Object.entries(obj || {}).map(([k, v]) => [stripA(k), v]));

// // unify field names so UI sees consistent keys
// const normalizeItem = (o, idx) => {
//   const AttendanceDate =
//     o.AttendanceDate ??
//     o.AttendaceDate ?? // occasionally misspelled from X++
//     o.shiftDate ??
//     null;

//   // accept ClockIn/ClockOut or CheckIn/CheckOut
//   const ClockIn = o.ClockIn ?? o.CheckIn ?? null;
//   const ClockOut = o.ClockOut ?? o.CheckOut ?? null;

//   // prefer ShiftWorkingTime, else ShiftHours, else TotalWorkingTime
//   const ShiftWorkingTime =
//     o.ShiftWorkingTime ?? o.ShiftHours ?? o.TotalWorkingTime ?? null;

//   // color may come as hex without '#'
//   let Color = o.Color ?? o.color ?? '#6ce66c';
//   if (
//     typeof Color === 'string' &&
//     !Color.startsWith('#') &&
//     /^[0-9A-Fa-f]{6}$/.test(Color)
//   ) {
//     Color = `#${Color}`;
//   }

//   const id =
//     o.id ??
//     `${AttendanceDate || 'NA'}-${ClockIn ?? 'NA'}-${ClockOut ?? 'NA'}-${idx}`;

//   return {
//     id,
//     AttendanceDate,
//     ClockIn,
//     ClockOut,
//     ShiftWorkingTime,
//     Color,
//     // pass through a few useful fields your components use
//     TotalWorkingTime: o.TotalWorkingTime ?? null,
//     LeaveCode: o.LeaveCode ?? '',
//     Status: o.Status ?? o.StatusTag ?? '',
//     OffDay: !!o.OffDay,
//     GazettedDay: !!o.GazettedDay,
//     Absent: !!o.Absent,
//     LateArrival: !!o.LateArrival,
//     EarlyOut: !!o.EarlyOut,
//   };
// };

// const getRegisterDetailsByDate = async ({employeeId, fromDate, toDate}) => {
//   try {
//     const config = await getActiveConfigData();
//     if (!config || !config.resource) {
//       throw new Error('No configuration found. Please scan QR code first.');
//     }

//     const token = await getToken();

//     // ✅ SOAP Body (same style as your sample)
//     const soapBody = `
//       <getRegisterDetailsByDate xmlns="http://tempuri.org">
//         <_employeeId>${employeeId}</_employeeId>
//         <fromDate>${fromDate}</fromDate>
//         <toDate>${toDate}</toDate>
//       </getRegisterDetailsByDate>`;

//     const soapEnvelope = createSoapEnvelope(soapBody);

//     console.log('employeeId-0-0-0-0-0-', employeeId);
//     console.log('fromDate-0-0-0-0-0-', fromDate);
//     console.log('toDate-0-0-0-0-0-', toDate);
//     console.log('soapEnvelope-0-0-0-0-0-', soapEnvelope);

//     // ✅ SOAP Request
//     const {data: xml} = await axios.post(
//       `${config.resource}soap/services/TASAttendanceRegisterSvcGroup`,
//       soapEnvelope,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'text/xml;charset=utf-8',
//           SOAPAction:
//             'http://tempuri.org/TASAttendanceRegisterSvc/getRegisterDetailsByDate',
//         },
//         responseType: 'text',
//       },
//     );

//     // ✅ Parse XML (same config as sample)
//     const parser = new XMLParser({
//       ignoreAttributes: false,
//       ignoreNameSpace: false,
//       attributeNamePrefix: '',
//       isArray: () => false,
//       parseTagValue: true,
//     });

//     const parsed = parser.parse(xml);

//     // ✅ Navigate to result (handle both 'return' and 'result')
//     const body =
//       parsed?.['s:Envelope']?.['s:Body'] ??
//       parsed?.['Envelope']?.['Body'] ??
//       null;

//     const resp =
//       body?.['getRegisterDetailsByDateResponse'] ??
//       body?.['TASAttendanceRegisterSvc_getRegisterDetailsByDate_Response'] ??
//       null;

//     const container =
//       resp?.return ?? // matches X++ AifCollectionTypeAttribute('return', ...)
//       resp?.result ?? // some environments serialize as 'result'
//       null;

//     const raw =
//       container?.['a:TASAttendanceRegisterSvcContract'] ??
//       container?.['TASAttendanceRegisterSvcContract'] ??
//       null;

//     if (!raw) {
//       console.log('⚠️ No register details found in SOAP response');
//       return [];
//     }

//     // ✅ Clean namespaces like "a:" and normalize fields
//     const rows = Array.isArray(raw) ? raw : [raw];
//     const cleaned = rows.map(cleanObject);

//     console.log('cleaned-0-0-0-0-0-', cleaned);
//     return cleaned.map(normalizeItem);
//   } catch (err) {
//     console.error(
//       '❌ getRegisterDetailsByDate SOAP error:',
//       err.response?.data || err.message,
//     );
//     throw err;
//   }
// };

// export {getRegisterDetailsByDate};

/* eslint-disable dot-notation */
import {resource} from '@env';
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../Token/getToken';
import {createSoapEnvelope} from '../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../Controller/secureConfig';

const getRegisterDetailsByDate = async ({employeeId, fromDate, toDate}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    const soapBody = `
          <getRegisterDetailsByDate xmlns="http://tempuri.org">
            <_employeeId>${employeeId}</_employeeId>
            <fromDate>${fromDate}</fromDate>
            <toDate>${toDate}</toDate>
          </getRegisterDetailsByDate>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/TASAttendanceRegisterSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/TASAttendanceRegisterSvc/getRegisterDetailsByDate',
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
    const generalContracts =
      parsed?.['s:Envelope']?.['s:Body']?.[
        'getRegisterDetailsByDateResponse'
      ]?.['result']?.['a:TASAttendanceRegisterSvcContract'];

    if (!generalContracts) {
      console.warn('No response data found');
      return [];
    }

    const cleanObject = obj =>
      Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/^a:/, ''),
          value,
        ]),
      );

    const cleanedData = Array.isArray(generalContracts)
      ? generalContracts.map(cleanObject)
      : [cleanObject(generalContracts)];

    return cleanedData;
  } catch (err) {
    console.error(
      'getRegisterDetailsByDate SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {getRegisterDetailsByDate};
