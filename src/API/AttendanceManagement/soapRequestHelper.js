// api/AttendanceManagement/soapRequestHelper.js
import axios from 'axios';

const isRealNetworkFailure = err =>
  err.code === 'ECONNABORTED' || (err.isAxiosError === true && !err.response);

export const postSoapWithRetry = async (
  url,
  envelope,
  headers,
  {timeout = 10000, retries = 2} = {},
) => {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await axios.post(url, envelope, {
        headers,
        responseType: 'text',
        timeout,
      });
    } catch (err) {
      lastErr = err;
      const netIssue = isRealNetworkFailure(err);
      if (__DEV__) {
        console.warn(`[SOAP] attempt ${attempt + 1} failed`, {
          url,
          netIssue,
          code: err.code,
          status: err.response?.status,
          message: err.message,
        });
      }
      if (!netIssue || attempt === retries) throw err;
      const delay = 1500 * (attempt + 1); // 1.5s after attempt 1, 3s after attempt 2
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
};
