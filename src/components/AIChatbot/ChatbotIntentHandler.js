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
    this.state = null;
    this.leaveData = {};
  }

  reset() {
    this.state = null;
    this.leaveData = {};
  }

  // State: Awaiting leave type selection
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
            `${idx + 1}. ${code.LeaveName || code.leaveCode} (${
              code.leaveCode
            })`,
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

  // Parse leave type selection
  parseLeaveTypeSelection(userInput, availableLeaveCodes) {
    const input = userInput.toLowerCase().trim();

    // Try to match by number
    const numMatch = userInput.match(/^(\d+)$/);
    if (numMatch) {
      const idx = parseInt(numMatch[1], 10) - 1;
      if (idx >= 0 && idx < availableLeaveCodes.length) {
        const selected = availableLeaveCodes[idx];
        this.leaveData.leaveCode = selected.leaveCode;
        this.leaveData.leaveName = selected.LeaveName || selected.leaveCode;
        return {success: true, selected};
      }
    }

    // Try to match by name
    const found = availableLeaveCodes.find(
      code =>
        code.leaveCode.toLowerCase() === input ||
        (code.LeaveName && code.LeaveName.toLowerCase().includes(input)),
    );

    if (found) {
      this.leaveData.leaveCode = found.leaveCode;
      this.leaveData.leaveName = found.LeaveName || found.leaveCode;
      return {success: true, selected: found};
    }

    return {success: false};
  }

  // State: Awaiting leave category (Full Day / Half Day)
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
      this.leaveData.leaveCategory = 'Full Day Leave';
      return {success: true, category: 'Full Day Leave'};
    } else if (input === '2' || input.toLowerCase().includes('half')) {
      this.leaveData.leaveCategory = 'Half Day Leave';
      return {success: true, category: 'Half Day Leave'};
    }
    return {success: false};
  }

  // State: Awaiting start date
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

  // State: Awaiting number of days (skip for half day)
  askForNumberOfDays() {
    if (this.leaveData.leaveCategory === 'Half Day Leave') {
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
      } else if (days > 30) {
        return {success: false, error: 'Leave days cannot exceed 30 days'};
      }
    }
    return {success: false, error: 'Invalid number of days'};
  }

  // State: Awaiting reason
  askForReason() {
    this.state = 'awaiting_reason';
    const startDate = this.leaveData.leaveStartDate.split('T')[0];
    return {
      response: `Now, please provide a reason for your ${this.leaveData.leaveCategory.toLowerCase()} on ${startDate} for ${
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

  // State: Confirmation
  askForConfirmation() {
    this.state = 'awaiting_confirmation';
    const summary = `
📋 **Leave Request Summary:**
- Leave Type: ${this.leaveData.leaveName}
- Category: ${this.leaveData.leaveCategory}
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
      const payload = {
        leaveData: {
          employeeId: userData.employeeId,
          LeaveCode: this.leaveData.leaveCode,
          LeaveCategory: this.leaveData.leaveCategory,
          LeaveStartDate: this.leaveData.leaveStartDate,
          LeaveDays: this.leaveData.leaveDays,
          Reason: this.leaveData.reason,
          Balance: '0',
          WorkerRecId: userData.WorkerRecId || '',
        },
      };

      const result = await createLeaveRequest(payload);

      if (result && result.RecId) {
        this.leaveData.recordId = result.RecId;

        // Try to submit
        try {
          const submitResult = await SubmitLeaveRequest({
            recordId: result.RecId,
          });

          this.reset();
          return {
            success: true,
            message: `✅ Leave request submitted successfully!\n\nYour request ID: ${result.RecId}\nStatus: Submitted for approval`,
          };
        } catch (submitErr) {
          this.reset();
          return {
            success: true,
            message: `✅ Leave request created successfully!\n\nYour request ID: ${result.RecId}\nStatus: Draft (Ready to submit)`,
          };
        }
      } else {
        return {
          success: false,
          message: 'Failed to create leave request. Please try again.',
        };
      }
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
 * INTENT DETECTION & ROUTING (INTELLIGENT)
 * ==========================================
 */
const detectIntent = userInput => {
  const input = userInput.toLowerCase();

  // Leave-related intents
  if (/leave|request|apply|vacation|time off|days off/i.test(input)) {
    return 'request_leave';
  }

  // Attendance-related intents
  if (/attendance|punch|clock|mark|check in|in|out/i.test(input)) {
    return 'mark_attendance';
  }

  // ONLY Dynaface info if specifically asking about Dynaface app itself
  if (
    /(dynaface|about.*app|how.*dynaface|what.*dynaface|app.*features|guide.*app)/i.test(
      input,
    )
  ) {
    return 'info_dynaface';
  }

  // Default: use AI for ALL other questions (salary, profile, weather, etc.)
  return 'ai_response';
};

/**
 * ==========================================
 * INTELLIGENT RESPONSE GENERATOR (SIMPLIFIED)
 * ==========================================
 */
const generateIntelligentResponse = intent => {
  const responses = {
    info_dynaface: `📱 **About Dynaface**\n\n${
      DynafaceInfo.description
    }\n\n**Key Features:**\n${DynafaceInfo.key_features.join('\n')}`,

    request_leave:
      "Let me help you request a leave. I'll guide you through the process step by step.",

    mark_attendance:
      'I can help you mark your attendance. This requires location access to verify your office location.',
  };

  if (responses[intent]) {
    return responses[intent];
  }

  return 'Please ask me about:\n\n1️⃣ Mark Attendance\n2️⃣ Request Leave\n3️⃣ About Dynaface';
};

export {
  LeaveRequestHandler,
  DynafaceInfo,
  detectIntent,
  generateIntelligentResponse,
};
