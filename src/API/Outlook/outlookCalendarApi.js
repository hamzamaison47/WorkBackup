import axios from 'axios';
import {getGraphApiToken} from '../Token/getGraphApiToken';

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

// ─── Axios instance scoped to Graph API ───────────────────────────────────────

const graphClient = axios.create({
  baseURL: GRAPH_BASE_URL,
  headers: {'Content-Type': 'application/json'},
});

// Attach a fresh token before every request
graphClient.interceptors.request.use(async config => {
  const token = await getGraphApiToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Calendar Events ──────────────────────────────────────────────────────────

/**
 * Fetch calendar events within a date range.
 * @param {string} startDateTime  ISO 8601, e.g. '2025-04-13T00:00:00'
 * @param {string} endDateTime    ISO 8601, e.g. '2025-04-20T23:59:59'
 * @param {number} top            Max results (default 50)
 */
export const GetCalendarEvents = async (
  startDateTime,
  endDateTime,
  top = 50,
) => {
  try {
    const {data} = await graphClient.get('/me/calendarView', {
      params: {
        startDateTime,
        endDateTime,
        $top: top,
        $select:
          'id,subject,start,end,location,bodyPreview,isAllDay,organizer,attendees,onlineMeetingUrl',
        $orderby: 'start/dateTime asc',
      },
    });

    return data.value ?? [];
  } catch (err) {
    console.error('GetCalendarEvents error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};

/**
 * Get a single event by ID.
 */
export const GetCalendarEventById = async eventId => {
  try {
    const {data} = await graphClient.get(`/me/events/${eventId}`);
    return data;
  } catch (err) {
    console.error('GetCalendarEventById error:', err.response?.data);
    throw err;
  }
};

/**
 * Create a new calendar event.
 * @param {object} eventData - See shape below
 */
export const CreateCalendarEvent = async eventData => {
  try {
    /*
      eventData shape:
      {
        subject: 'Team Meeting',
        start: { dateTime: '2025-04-14T10:00:00', timeZone: 'Asia/Karachi' },
        end:   { dateTime: '2025-04-14T11:00:00', timeZone: 'Asia/Karachi' },
        location: { displayName: 'Conference Room A' },
        body: { contentType: 'HTML', content: '<p>Agenda...</p>' },
        attendees: [
          { emailAddress: { address: 'someone@example.com', name: 'Someone' }, type: 'required' }
        ],
        isOnlineMeeting: false,
      }
    */
    const {data} = await graphClient.post('/me/events', eventData);
    return data;
  } catch (err) {
    console.error('CreateCalendarEvent error:', err.response?.data);
    throw err;
  }
};

/**
 * Update an existing calendar event.
 * @param {string} eventId
 * @param {object} updates - Partial event fields to update
 */
export const UpdateCalendarEvent = async (eventId, updates) => {
  try {
    const {data} = await graphClient.patch(`/me/events/${eventId}`, updates);
    return data;
  } catch (err) {
    console.error('UpdateCalendarEvent error:', err.response?.data);
    throw err;
  }
};

/**
 * Delete a calendar event.
 * @param {string} eventId
 */
export const DeleteCalendarEvent = async eventId => {
  try {
    await graphClient.delete(`/me/events/${eventId}`);
    return true;
  } catch (err) {
    console.error('DeleteCalendarEvent error:', err.response?.data);
    throw err;
  }
};

/**
 * Get the signed-in user's available calendars.
 */
export const GetCalendarList = async () => {
  try {
    const {data} = await graphClient.get('/me/calendars', {
      params: {$select: 'id,name,color,isDefaultCalendar,canEdit'},
    });
    return data.value ?? [];
  } catch (err) {
    console.error('GetCalendarList error:', err.response?.data);
    throw err;
  }
};
