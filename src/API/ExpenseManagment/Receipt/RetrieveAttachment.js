/* eslint-disable quotes */
/* eslint-disable curly */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../Token/getToken';
import {createSoapEnvelope} from '../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../Controller/secureConfig';

const RetrieveAttachment = async ({docuRefRecId}) => {
  try {
    const config = await getActiveConfigData();

    if (!config?.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    if (!docuRefRecId) {
      throw new Error('Missing required parameter: docuRefRecId');
    }

    const token = await getToken();

    const soapBody = `
      <retrieveAttachmentBase64 xmlns="http://tempuri.org">
        <_docuRefRecId>${docuRefRecId}</_docuRefRecId>
      </retrieveAttachmentBase64>
    `;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const response = await axios.post(
      `${config.resource}soap/services/DocumentAttachmentSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction:
            'http://tempuri.org/DocumentAttachmentSvc/retrieveAttachmentBase64',
        },
        responseType: 'text',
        timeout: 60000, // Increased timeout for larger files
        validateStatus: () => true,
      },
    );

    const xml = response.data;

    // DEBUG: Log the first 500 characters of the response
    console.log('=== SOAP Response Preview ===');
    console.log('Response length:', xml?.length);
    console.log('First 500 chars:', xml?.substring(0, 500));
    console.log('Last 200 chars:', xml?.substring(xml.length - 200));
    console.log('===========================');

    if (!xml || xml.trim() === '') {
      return {
        success: false,
        message: 'Empty response received from server',
      };
    }

    if (
      xml.includes('s:Fault') ||
      xml.includes('faultstring') ||
      xml.includes('Fault')
    ) {
      return parseSoapFault(xml);
    }

    let base64Content = null;
    let fileType = null;
    let fileName = null;

    // Strategy 1: Try multiple regex patterns for buffer content
    const bufferPatterns = [
      /<a:_buffer>([\s\S]*?)<\/a:_buffer>/,
      /<_buffer>([\s\S]*?)<\/_buffer>/,
      /<buffer>([\s\S]*?)<\/buffer>/,
      /<a:buffer>([\s\S]*?)<\/a:buffer>/,
      /<ns\d+:_buffer>([\s\S]*?)<\/ns\d+:_buffer>/,
      /<ns\d+:buffer>([\s\S]*?)<\/ns\d+:buffer>/,
    ];

    for (const pattern of bufferPatterns) {
      const match = xml.match(pattern);
      if (match && match[1] && match[1].trim().length > 100) {
        base64Content = match[1].trim();
        console.log(`✓ Buffer found with pattern: ${pattern}`);
        break;
      }
    }

    // Extract file type and name if available
    const fileTypePatterns = [
      /<a:FileType>([\s\S]*?)<\/a:FileType>/,
      /<FileType>([\s\S]*?)<\/FileType>/,
      /<ns\d+:FileType>([\s\S]*?)<\/ns\d+:FileType>/,
    ];

    for (const pattern of fileTypePatterns) {
      const match = xml.match(pattern);
      if (match && match[1]) {
        fileType = match[1].trim();
        console.log(`✓ FileType found: ${fileType}`);
        break;
      }
    }

    const fileNamePatterns = [
      /<a:(?:Name|OriginalFileName)>([\s\S]*?)<\/a:(?:Name|OriginalFileName)>/,
      /<(?:Name|OriginalFileName)>([\s\S]*?)<\/(?:Name|OriginalFileName)>/,
      /<ns\d+:(?:Name|OriginalFileName)>([\s\S]*?)<\/ns\d+:(?:Name|OriginalFileName)>/,
    ];

    for (const pattern of fileNamePatterns) {
      const match = xml.match(pattern);
      if (match && match[1]) {
        fileName = match[1].trim();
        console.log(`✓ FileName found: ${fileName}`);
        break;
      }
    }

    // Strategy 2: XML parsing with multiple attempts
    if (!base64Content) {
      try {
        console.log('Attempting XML parsing...');
        const parser = new XMLParser({
          ignoreAttributes: false,
          ignoreNameSpace: false, // Keep namespaces for debugging
          attributeNamePrefix: '@_',
          parseTagValue: false, // Don't parse values to preserve base64
          trimValues: true,
          textNodeName: '#text',
        });

        const parsed = parser.parse(xml);
        console.log('Parsed XML structure keys:', Object.keys(parsed));

        // Log the full parsed structure (first level)
        if (parsed.Envelope?.Body) {
          console.log('Body keys:', Object.keys(parsed.Envelope.Body));
        }

        // Try multiple possible paths with different namespace variations
        const possiblePaths = [
          // With namespace prefix 'a:'
          parsed?.Envelope?.Body?.retrieveAttachmentBase64Response?.result?.[
            'a:_buffer'
          ],
          parsed?.Envelope?.Body?.retrieveAttachmentResponse?.result?.[
            'a:_buffer'
          ],
          parsed?.Envelope?.Body?.['a:retrieveAttachmentBase64Response']?.[
            'a:result'
          ]?.['a:_buffer'],
          // Without namespace prefix
          parsed?.Envelope?.Body?.retrieveAttachmentBase64Response?.result
            ?._buffer,
          parsed?.Envelope?.Body?.retrieveAttachmentResponse?.result?._buffer,
          parsed?.Envelope?.Body?.retrieveAttachmentBase64Response?.result
            ?.buffer,
          parsed?.Envelope?.Body?.retrieveAttachmentResponse?.result?.buffer,
          // Direct on response
          parsed?.Envelope?.Body?.retrieveAttachmentBase64Response?._buffer,
          parsed?.Envelope?.Body?.retrieveAttachmentResponse?._buffer,
          // Inside return/response objects
          parsed?.Envelope?.Body?.retrieveAttachmentBase64Response?.return
            ?._buffer,
          parsed?.Envelope?.Body?.retrieveAttachmentResponse?.return?._buffer,
          // Text node variations
          parsed?.Envelope?.Body?.retrieveAttachmentBase64Response?.result?.[
            'a:_buffer'
          ]?.['#text'],
          parsed?.Envelope?.Body?.retrieveAttachmentResponse?.result?._buffer?.[
            '#text'
          ],
        ];

        for (let i = 0; i < possiblePaths.length; i++) {
          const path = possiblePaths[i];
          if (path && typeof path === 'string' && path.length > 100) {
            base64Content = path;
            console.log(`✓ Buffer found via XML parsing (path ${i})`);
            break;
          }
        }

        // Try to extract file metadata from parsed XML
        const result =
          parsed?.Envelope?.Body?.retrieveAttachmentBase64Response?.result ||
          parsed?.Envelope?.Body?.retrieveAttachmentResponse?.result;

        if (result) {
          if (!fileType) {
            fileType =
              result['a:FileType'] || result.FileType || result['ns2:FileType'];
          }
          if (!fileName) {
            fileName =
              result['a:Name'] ||
              result.Name ||
              result['a:OriginalFileName'] ||
              result.OriginalFileName;
          }
        }
      } catch (parseError) {
        console.log('XML parsing failed:', parseError.message);
      }
    }

    // Strategy 3: Look for large base64 blocks in the raw XML
    if (!base64Content) {
      console.log('Attempting base64 pattern matching...');
      // Look for continuous base64 strings (at least 1000 chars for real files)
      const base64Pattern = /[A-Za-z0-9+/]{1000,}={0,2}/g;
      const matches = xml.match(base64Pattern);

      if (matches && matches.length > 0) {
        // Get the longest match (likely the actual file content)
        const longestMatch = matches.reduce(
          (a, b) => (a.length > b.length ? a : b),
          '',
        );

        if (longestMatch.length > 1000) {
          base64Content = longestMatch;
          console.log(
            `✓ Buffer found via pattern matching (${longestMatch.length} chars)`,
          );
        }
      }
    }

    // Strategy 4: Try to find any CDATA sections
    if (!base64Content) {
      console.log('Checking for CDATA sections...');
      const cdataMatch = xml.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
      if (cdataMatch && cdataMatch[1] && cdataMatch[1].length > 1000) {
        const cdataContent = cdataMatch[1].trim();
        if (/^[A-Za-z0-9+/=]+$/.test(cdataContent)) {
          base64Content = cdataContent;
          console.log(`✓ Buffer found in CDATA section`);
        }
      }
    }

    console.log('=== Extraction Results ===');
    console.log('Base64 content found:', !!base64Content);
    console.log('Base64 length:', base64Content?.length || 0);
    console.log('File type:', fileType || 'not found');
    console.log('File name:', fileName || 'not found');
    console.log('========================');

    if (base64Content) {
      // Clean the base64 string
      let cleanBase64 = base64Content.trim();

      // Remove any whitespace or newlines that might be in the middle
      cleanBase64 = cleanBase64.replace(/\s/g, '');

      // Validate it's proper base64
      if (cleanBase64 && /^[A-Za-z0-9+/=]+$/.test(cleanBase64)) {
        // Ensure proper padding
        const paddingNeeded = (4 - (cleanBase64.length % 4)) % 4;
        if (paddingNeeded > 0) {
          cleanBase64 = cleanBase64 + '='.repeat(paddingNeeded);
          console.log(`Added ${paddingNeeded} padding characters`);
        }

        console.log('✓ Valid base64 string prepared for download');
        return {
          success: true,
          base64: cleanBase64,
          fileType: fileType,
          fileName: fileName,
          message: 'Attachment retrieved successfully',
        };
      } else {
        console.log('✗ Base64 validation failed');
      }
    }

    // If we got here, we couldn't extract the content
    console.log('✗ Could not extract attachment content');
    console.log('Full response sample:', xml.substring(0, 1000));

    return {
      success: false,
      message: 'Could not extract attachment content from response',
      debugInfo: {
        responseLength: xml.length,
        hasBuffer: xml.includes('buffer'),
        hasBase64Pattern: /[A-Za-z0-9+/]{100,}/.test(xml),
        sampleResponse: xml.substring(0, 500),
      },
    };
  } catch (err) {
    let errorMessage = 'Failed to retrieve attachment';

    if (err.response?.status === 500) {
      errorMessage = 'Server error occurred while retrieving attachment';
    } else if (err.response?.status === 401) {
      errorMessage = 'Authentication failed. Please check credentials';
    } else if (err.response?.status === 403) {
      errorMessage = 'You do not have permission to retrieve attachments';
    } else if (err.message) {
      errorMessage = err.message;
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
};

const parseSoapFault = xml => {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      ignoreNameSpace: true,
      attributeNamePrefix: '@_',
    });

    const parsed = parser.parse(xml);
    const fault = parsed?.Envelope?.Body?.Fault || parsed?.Body?.Fault;

    let errorMessage = 'SOAP Fault Occurred';
    if (fault?.faultstring) {
      errorMessage = fault.faultstring;
    } else if (fault?.Reason?.Text) {
      errorMessage = fault.Reason.Text;
    }

    return {
      success: false,
      message: errorMessage,
      faultDetails: fault,
    };
  } catch (error) {
    let errorMessage = 'SOAP Fault Occurred';
    const faultMatch = xml.match(/<faultstring[^>]*>([^<]+)</);
    if (faultMatch) errorMessage = faultMatch[1];

    return {
      success: false,
      message: errorMessage,
    };
  }
};

export {RetrieveAttachment};
