/* eslint-disable dot-notation */
import axios from 'axios';
import {XMLParser} from 'fast-xml-parser';
import {getToken} from '../../../../API/Token/getToken';
import {createSoapEnvelope} from '../../../../store/utils/soapHeaderUtils';
import {getActiveConfigData} from '../../../../Controller/secureConfig';

// XML-escape any free-text field (Agenda, Reason, Description, etc.) —
// these are user-typed and can legally contain &, <, >, quotes.
const escapeXml = value => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Site Survey's SurveyDate is xs:dateTime on the contract — build a local
// (not UTC-shifted) ISO-ish string, same rationale as parseLocalDateTime /
// toLocalDateTimeString used elsewhere: never use .toISOString() here, it
// shifts to UTC and can flip the calendar day.
const toLocalDateTimeString = value => {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
};

const CreateSiteSurvey = async ({
  agendaOfMeeting,
  conclusions,
  contractorCompany,
  designation,
  expenseNumber,
  inspectionStatus,
  isOther,
  isOtherYesDescription,
  isProgressReview,
  isSafetyInspection,
  isSiteInspection,
  isSiteMeeting,
  isSiteSurvey,
  isSiteVisit,
  location,
  otherPurpose,
  pointsOfDiscussion,
  projectName,
  purposeOfVisit,
  reason,
  recId,
  representativeName,
  surveyDate,
  tableId,
  teamDesignation,
  travelRequisitionId,
}) => {
  try {
    const config = await getActiveConfigData();

    if (!config || !config.resource) {
      throw new Error('No configuration found. Please scan QR code first.');
    }

    const token = await getToken();

    // Field order below matches the WSDL's alphabetical xs:sequence for
    // DFTrvSiteSurveyFormContract — do not reorder, AIF deserializes by
    // position and will silently drop/misassign fields otherwise.
    const soapBody = `
      <create xmlns="http://tempuri.org">
        <contract xmlns:a="http://schemas.datacontract.org/2004/07/Dynamics.AX.Application" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
          <a:AgendaOfMeeting>${escapeXml(agendaOfMeeting)}</a:AgendaOfMeeting>
          <a:Conclusions>${escapeXml(conclusions)}</a:Conclusions>
          <a:ContractorCompany>${escapeXml(
            contractorCompany,
          )}</a:ContractorCompany>
          <a:Designation>${escapeXml(designation)}</a:Designation>
          <a:ExpenseNumber>${escapeXml(expenseNumber)}</a:ExpenseNumber>
          <a:InspectionStatus>${escapeXml(
            inspectionStatus,
          )}</a:InspectionStatus>
          <a:IsOther>${escapeXml(isOther)}</a:IsOther>
          <a:IsOtherYesDescription>${escapeXml(
            isOtherYesDescription,
          )}</a:IsOtherYesDescription>
          <a:IsProgressReview>${escapeXml(
            isProgressReview,
          )}</a:IsProgressReview>
          <a:IsSafetyInspection>${escapeXml(
            isSafetyInspection,
          )}</a:IsSafetyInspection>
          <a:IsSiteInspection>${escapeXml(
            isSiteInspection,
          )}</a:IsSiteInspection>
          <a:IsSiteMeeting>${escapeXml(isSiteMeeting)}</a:IsSiteMeeting>
          <a:IsSiteSurvey>${escapeXml(isSiteSurvey)}</a:IsSiteSurvey>
          <a:IsSiteVisit>${escapeXml(isSiteVisit)}</a:IsSiteVisit>
          <a:Location>${escapeXml(location)}</a:Location>
          <a:OtherPurpose>${escapeXml(otherPurpose)}</a:OtherPurpose>
          <a:PointsOfDiscussion>${escapeXml(
            pointsOfDiscussion,
          )}</a:PointsOfDiscussion>
          <a:ProjectName>${escapeXml(projectName)}</a:ProjectName>
          <a:PurposeOfVisit>${escapeXml(purposeOfVisit)}</a:PurposeOfVisit>
          <a:Reason>${escapeXml(reason)}</a:Reason>
          <a:RecId>${recId || 0}</a:RecId>
          <a:RepresentativeName>${escapeXml(
            representativeName,
          )}</a:RepresentativeName>
          <a:SurveyDate>${toLocalDateTimeString(surveyDate)}</a:SurveyDate>
          <a:TableId>${tableId || 0}</a:TableId>
          <a:TeamDesignation>${escapeXml(teamDesignation)}</a:TeamDesignation>
          <a:TravelRequisitionId>${escapeXml(
            travelRequisitionId,
          )}</a:TravelRequisitionId>
        </contract>
      </create>`;

    const soapEnvelope = createSoapEnvelope(soapBody);

    const {data: xml} = await axios.post(
      `${config.resource}soap/services/DFTrvSiteSurveyFormSvcGroup`,
      soapEnvelope,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/xml;charset=utf-8',
          SOAPAction: 'http://tempuri.org/DFTrvSiteSurveyFormSvc/create',
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

    // GeneralContract: { IsSuccess, Message, RecId }
    const rawResult =
      parsed?.['s:Envelope']?.['s:Body']?.['createResponse']?.['result'];

    if (!rawResult) {
      return {IsSuccess: false, Message: 'No response from server.', RecId: 0};
    }

    return {
      IsSuccess:
        rawResult['a:IsSuccess'] === true ||
        rawResult['a:IsSuccess'] === 'true',
      Message: rawResult['a:Message'] || '',
      RecId: rawResult['a:RecId'] || 0,
    };
  } catch (err) {
    console.error(
      'CreateSiteSurvey SOAP error:',
      err.response?.data || err.message,
    );
    throw err;
  }
};

export {CreateSiteSurvey};
