/* eslint-disable curly */
/* eslint-disable no-unused-vars */

import {RetrieveLeaveCodes} from '../../API/Leaves/LeaveCodes';
import {createLeaveRequest} from '../../API/Leaves/CreateLeaveRequest';
import SubmitLeaveRequest from '../../API/Leaves/SubmitLeaveRequest';

/**
 * ==========================================
 * DYNAFACE APP INFORMATION & USAGE
 * ==========================================
 */
const DynafaceInfo = {
  description:
    'Dynaface is a comprehensive mobile application designed for employee ease and efficiency. It connects with Microsoft D365 to manage various HR operations smoothly and securely.',
  key_features: [
    '📋 Attendance Management - Mark attendance with GPS verification, view attendance history',
    '🎯 Leave Management - Request, approve, and track leaves with real-time balance updates',
    '💼 Employee Profile - View and manage personal information and employment details',
    '📊 Salary & Entitlements - Access salary slips, tax certificates, and leave entitlements',
    '🔄 Workflow Tracking - Track approval status of requests in real-time',
    '💰 Expense Management - Submit and track expense claims',
    '📑 Purchase Requisitions - Create and manage purchase requests',
    '🏢 Employee Certificates - Request and download employment certificates',
  ],
  supported_operations: [
    'Mark Attendance - "mark attendance", "punch in", "punch out"',
    'Request Leave - "request leave", "apply for leave", "leave request"',
    'Check Leave Balance - "check leave balance", "how many leaves do I have"',
    'View Salary Slip - "salary slip", "view salary"',
    'Track Request Status - "track request", "request status"',
    'Employee Info - "my profile", "employee information"',
  ],
  how_to_use: `1. Use natural language to interact
2. Ask for specific operations (e.g., "I want to request leave")
3. Provide information when prompted
4. Confirm actions before submission
5. Track your requests and approvals in real-time`,
};

/**
 * ==========================================
 * LEAVE REQUEST STATE MACHINE
 * ==========================================
 */
class LeaveRequestHandler {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = null;
    this.leaveData = {};
  }

  async askForLeaveType(userData) {
    this.state = 'awaiting_leave_type';
    try {
      const leaveCodes = await RetrieveLeaveCodes({
        employeeId: userData.employeeId,
      });

      if (!leaveCodes || leaveCodes.length === 0) {
        return {
          response:
            'Sorry, no leave types are available for your profile. Please contact HR.',
          next_state: null,
        };
      }

      this.leaveData.availableLeaveCodes = leaveCodes;
      const codesList = leaveCodes
        .map(
          (code, idx) =>
            `${idx + 1}. ${code.LeaveDescription} (${code.LeaveCode})`,
        )
        .join('\n');

      return {
        response: `Great! Let me help you request a leave. Here are the available leave types:\n\n${codesList}\n\nWhich leave type would you like to request? (Reply with the number or name)`,
        next_state: 'awaiting_leave_type',
      };
    } catch (error) {
      console.error('Error fetching leave codes:', error);
      return {
        response: 'Unable to fetch leave types. Please try again later.',
        next_state: null,
      };
    }
  }

  parseLeaveTypeSelection(userInput, availableLeaveCodes) {
    const input = userInput.toLowerCase().trim();

    // Match by number
    const numMatch = userInput.match(/^(\d+)$/);
    if (numMatch) {
      const idx = parseInt(numMatch[1], 10) - 1;
      if (idx >= 0 && idx < availableLeaveCodes.length) {
        const selected = availableLeaveCodes[idx];
        this.leaveData.leaveCode = selected.LeaveCode;
        this.leaveData.leaveName = selected.LeaveDescription;
        return {success: true, selected};
      }
    }

    // Match by name
    const found = availableLeaveCodes.find(
      code =>
        code.LeaveCode.toLowerCase() === input ||
        code.LeaveDescription.toLowerCase().includes(input),
    );

    if (found) {
      this.leaveData.leaveCode = found.LeaveCode;
      this.leaveData.leaveName = found.LeaveDescription;
      return {success: true, selected: found};
    }

    return {success: false};
  }

  askForLeaveCategory() {
    this.state = 'awaiting_leave_category';
    return {
      response:
        'Perfect! Is this a:\n\n1. Full Day Leave\n2. Half Day Leave\n\nPlease reply with 1 or 2.',
      next_state: 'awaiting_leave_category',
    };
  }

  parseLeaveCategory(userInput) {
    const input = userInput.trim();

    if (input === '1' || input.toLowerCase().includes('full')) {
      this.leaveData.leaveCategoryLabel = 'Full Day Leave';
      this.leaveData.leaveCategory = 'FullLeave';
      this.state = 'awaiting_start_date';
      return {success: true};
    }

    if (input === '2' || input.toLowerCase().includes('half')) {
      this.leaveData.leaveCategoryLabel = 'Half Day Leave';
      this.leaveData.leaveCategory = 'HalfLeave';
      this.state = 'awaiting_start_date';
      return {success: true};
    }

    return {success: false};
  }

  askForStartDate() {
    this.state = 'awaiting_start_date';
    return {
      response: `When would you like to start your ${this.leaveData.leaveCategory}? Please provide the date in YYYY-MM-DD format (e.g., 2025-12-20).`,
      next_state: 'awaiting_start_date',
    };
  }

  parseStartDate(userInput) {
    const dateMatch = userInput.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      const date = new Date(dateMatch[0]);
      if (!isNaN(date.getTime())) {
        this.leaveData.leaveStartDate = `${dateMatch[0]}T12:00:00`;
        return {success: true, date: dateMatch[0]};
      }
    }
    return {success: false};
  }

  askForNumberOfDays() {
    if (this.leaveData.leaveCategory === 'HalfLeave') {
      this.leaveData.leaveDays = '0.5';
      this.state = 'awaiting_reason';
      const startDate = this.leaveData.leaveStartDate.split('T')[0];
      return {
        response: `Great! Your half-day leave is set for ${startDate}.\n\nNow, please provide a reason for your leave.`,
        next_state: 'awaiting_reason',
      };
    }

    this.state = 'awaiting_days';
    return {
      response:
        'How many days of leave would you like to request? (Please enter a number, e.g., 1, 2, 5, etc.)',
      next_state: 'awaiting_days',
    };
  }

  parseLeaveDays(userInput) {
    const daysMatch = userInput.match(/(\d+(?:\.\d+)?)/);
    if (daysMatch) {
      const days = parseFloat(daysMatch[1]);
      if (days > 0 && days <= 30) {
        this.leaveData.leaveDays = days.toString();
        return {success: true, days};
      }
      return {success: false, error: 'Leave days cannot exceed 30 days'};
    }
    return {success: false, error: 'Invalid number of days'};
  }

  askForReason() {
    this.state = 'awaiting_reason';
    const startDate = this.leaveData.leaveStartDate.split('T')[0];
    return {
      response: `Now, please provide a reason for your ${this.leaveData.leaveCategoryLabel.toLowerCase()} on ${startDate} for ${
        this.leaveData.leaveDays
      } day(s).`,
      next_state: 'awaiting_reason',
    };
  }

  parseReason(userInput) {
    const reason = userInput.trim();
    if (reason.length >= 3 && reason.length <= 500) {
      this.leaveData.reason = reason;
      return {success: true};
    }
    return {success: false, error: 'Reason must be 3-500 characters'};
  }

  askForConfirmation() {
    this.state = 'awaiting_confirmation';
    const summary = `
📋 Leave Request Summary:
- Leave Type: ${this.leaveData.leaveName}
- Category: ${this.leaveData.leaveCategoryLabel}
- Start Date: ${this.leaveData.leaveStartDate.split('T')[0]}
- Number of Days: ${this.leaveData.leaveDays}
- Reason: ${this.leaveData.reason}

Is this correct? (Reply with "yes" to submit or "no" to cancel)
    `;
    return {
      response: summary,
      next_state: 'awaiting_confirmation',
    };
  }

  async submitLeave(userData) {
    try {
      // Ensure LeaveEndDate is always set
      let leaveEndDate = this.leaveData.leaveEndDate;
      if (!leaveEndDate) {
        const start = new Date(this.leaveData.leaveStartDate);
        if (this.leaveData.leaveCategory === 'HalfLeave') {
          leaveEndDate = `${
            this.leaveData.leaveStartDate.split('T')[0]
          }T12:00:00`;
        } else {
          const days = parseFloat(this.leaveData.leaveDays || 1);
          const endDate = new Date(start);
          endDate.setDate(start.getDate() + days - 1);
          const yyyy = endDate.getFullYear();
          const mm = String(endDate.getMonth() + 1).padStart(2, '0');
          const dd = String(endDate.getDate()).padStart(2, '0');
          leaveEndDate = `${yyyy}-${mm}-${dd}T12:00:00`;
        }
        this.leaveData.leaveEndDate = leaveEndDate;
      }

      const payload = {
        leaveData: {
          employeeId: userData.employeeId,
          LeaveCode: this.leaveData.leaveCode,
          LeaveCategory: this.leaveData.leaveCategory,
          LeaveStartDate: this.leaveData.leaveStartDate,
          LeaveEndDate: leaveEndDate,
          LeaveDays: this.leaveData.leaveDays,
          Reason: this.leaveData.reason,
          Balance: '0',
          WorkerRecId: userData.WorkerRecId || '',
        },
      };

      // Call D365 API to create leave
      const result = await createLeaveRequest(payload);

      if (result && result.RecId) {
        this.leaveData.recordId = result.RecId;

        try {
          await SubmitLeaveRequest({recordId: result.RecId});
          this.reset();
          return {
            success: true,
            message: `✅ Leave request submitted successfully!\n\nYour request ID: ${result.RecId}\nStatus: Submitted for approval`,
          };
        } catch {
          this.reset();
          return {
            success: true,
            message: `✅ Leave request created successfully!\n\nYour request ID: ${result.RecId}\nStatus: Draft (Ready to submit)`,
          };
        }
      }

      return {
        success: false,
        message: 'Failed to create leave request. Please try again.',
      };
    } catch (error) {
      console.error('Error submitting leave:', error);
      return {
        success: false,
        message: `Error: ${error.message || 'Failed to submit leave request'}`,
      };
    }
  }
}

/**
 * ==========================================
 * INTENT DETECTION & ROUTING
 * ==========================================
 */
const normalize = text =>
  text
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const fuzzyIncludes = (text, keyword) => {
  if (text.includes(keyword)) return true;
  const simplify = s => s.replace(/[aeiou]/gi, '');
  return simplify(text).includes(simplify(keyword));
};

const ATTENDANCE_KEYWORDS = [
  'attendance',
  'attendence',
  'attandance',
  'mark attendance',
  'punch',
  'punch in',
  'punch out',
  'punchin',
  'punchout',
  'clock',
  'clock in',
  'clock out',
  'clockin',
  'clockout',
  'clokin',
  'clokout',
  'clok in',
  'clok out',
  'check in',
  'check out',
  'time in',
  'time out',
  'present',
  'mark present',
  'attendance laga do',
  'attendance lagao',
  'attendans lagao',
  'hazri',
  'hazri lagao',
  'hazri laga do',
  'hazri mark',
  'haziri',
  'office punch',
  'office hazri',
  'punch time',
  'time punch',
  'حاضری',
  'حاضری لگاؤ',
  'حاضری لگا دو',
  'حاضری مارک',
  'حضری',
];

const LEAVE_KEYWORDS = [
  'leave',
  'leav',
  'apply leave',
  'request leave',
  'time off',
  'vacation',
  'vaction',
  'day off',
  'days off',
  'apply for leave',
  'leave request',
  'chutti',
  'chuti',
  'leave chahiye',
  'chutti chahiye',
  'chuti chahiye',
  'leave apply',
  'off chahiye',
  'rukhsat',
  'rukhset',
  'چھٹی',
  'چھٹی چاہیے',
  'رخصت',
  'رخصت چاہیے',
];

const INFO_KEYWORDS = [
  'about dynaface',
  'what is dynaface',
  'dynaface info',
  'app features',
  'how to use',
  'guide',
  'app guide',
  'dynaface',
  'dynaface kya hai',
  'dynaface ke bare mein',
  'app ki malumat',
  'ڈائنافیس کیا ہے',
  'ڈائنافیس کے بارے میں',
  'ایپ کی معلومات',
];

const detectIntent = userInput => {
  if (!userInput) return 'unknown';
  const text = normalize(userInput);

  const scores = {
    mark_attendance: ATTENDANCE_KEYWORDS.filter(k =>
      fuzzyIncludes(text, normalize(k)),
    ).length,
    request_leave: LEAVE_KEYWORDS.filter(k => fuzzyIncludes(text, normalize(k)))
      .length,
    info_dynaface: INFO_KEYWORDS.filter(k => fuzzyIncludes(text, normalize(k)))
      .length,
  };

  const maxScore = Math.max(
    scores.mark_attendance,
    scores.request_leave,
    scores.info_dynaface,
  );
  if (maxScore === 0) return 'unknown';

  if (scores.mark_attendance === maxScore) return 'mark_attendance';
  if (scores.request_leave === maxScore) return 'request_leave';
  if (scores.info_dynaface === maxScore) return 'info_dynaface';

  return 'unknown';
};

/**
 * ==========================================
 * INTELLIGENT RESPONSE GENERATOR
 * ==========================================
 */
const generateIntelligentResponse = intent => {
  const responses = {
    info_dynaface: `📱 About Dynaface\n\n${
      DynafaceInfo.description
    }\n\nKey Features:\n${DynafaceInfo.key_features.join(
      '\n',
    )}\n\nHow to Use:\n${DynafaceInfo.how_to_use}`,
    request_leave:
      "Let me help you request a leave. I'll guide you through the process step by step.",
    mark_attendance:
      'I can help you mark your attendance. This requires location access to verify your office location.',
    unknown:
      'Please ask me about:\n\n1️⃣ Mark Attendance\n2️⃣ Request Leave\n3️⃣ About Dynaface',
  };

  return responses[intent] || responses.unknown;
};

export {
  LeaveRequestHandler,
  DynafaceInfo,
  detectIntent,
  generateIntelligentResponse,
};
