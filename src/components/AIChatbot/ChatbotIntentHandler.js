/* eslint-disable no-useless-escape */
/* eslint-disable curly */

import {RetrieveLeaveCodes} from '../../API/Leaves/LeaveCodes';
import {createLeaveRequest} from '../../API/Leaves/CreateLeaveRequest';
import SubmitLeaveRequest from '../../API/Leaves/SubmitLeaveRequest';

import {GetLeaveBalance} from '../../API/Leaves/LeaveBalance';
import {GetEmployeeQuota} from '../../API/Leaves/GetEmployeeQuota';
import {GetLeaveDays} from '../../API/Leaves/GetLeaveDays';

/**
 * ==========================================
 * DYNAFACE APP INFORMATION & USAGE
 * ==========================================
 */
const DynafaceInfo = {
  description:
    'Dynaface is a comprehensive mobile application designed for employee ease and efficiency. It connects with Microsoft D365 to manage various HR operations smoothly and securely.',
  key_features: [
    'Attendance Management - Mark attendance with GPS verification, view attendance history',
    'Leave Management - Request, approve, and track leaves with real-time balance updates',
    'Employee Profile - View and manage personal information and employment details',
    'Salary & Entitlements - Access salary slips, tax certificates, and leave entitlements',
    'Workflow Tracking - Track approval status of requests in real-time',
    'Expense Management - Submit and track expense claims',
    'Purchase Requisitions - Create and manage purchase requests',
    'Employee Certificates - Request and download employment certificates',
  ],
  supported_operations: [
    'Mark Attendance - "mark attendance", "punch in", "punch out"',
    'Request Leave - "request leave", "apply for leave", "leave request"',
    'Check Leave Balance - "check leave balance", "how many leaves do I have"',
  ],
  how_to_use: `1. Use natural language to interact
2. Ask for specific operations (e.g., "I want to request leave")
3. Provide information when prompted
4. Confirm actions before submission
5. Track your requests and approvals in real-time`,
};

/**
 * ==========================================
 * HELPERS
 * ==========================================
 */
const formatToISOWithTime = date => {
  const baseDate = new Date(date);
  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const day = String(baseDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T12:00:00`;
};

const todayISOWithTime = () => formatToISOWithTime(new Date());

const parseAnyDateToISO = input => {
  const raw = String(input || '').trim();

  // YYYY-M-D or YYYY-MM-DD
  let m = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const yyyy = m[1];
    const mm = String(m[2]).padStart(2, '0');
    const dd = String(m[3]).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T12:00:00`;
  }

  // D/M/YYYY or DD/MM/YYYY (slash or dash)
  m = raw.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (m) {
    const dd = String(m[1]).padStart(2, '0');
    const mm = String(m[2]).padStart(2, '0');
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}T12:00:00`;
  }

  // Try Date constructor fallback
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return formatToISOWithTime(d);

  return null;
};

const toNumberSafe = v => {
  const n = parseFloat(String(v ?? '').trim());
  return Number.isFinite(n) ? n : 0;
};

const computeFallbackLeaveDays = (startDate, endDate, leaveCategory) => {
  if (!startDate) return '0';
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : start;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '0';

  if (leaveCategory === 'HalfLeave') return '0.5';

  const diffMs = end.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return String(Math.max(days, 1));
};

const formatDisplayDate = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const y = d.getFullYear();
  return `${y}-${m}-${day}`;
};

const getLeaveCategoryCode = categoryLabel =>
  categoryLabel === 'Full Day Leave'
    ? 'FullLeave'
    : categoryLabel === 'Half Day Leave'
    ? 'HalfLeave'
    : 'FullLeave';

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
    this.leaveData = {
      mode: 'leave_request', // 'leave_request' | 'leave_balance'
      availableLeaveCodes: [],
      leaveCode: '',
      leaveName: '',
      leaveCategoryLabel: 'Full Day Leave',
      leaveCategory: 'FullLeave',
      leaveStartDate: '',
      leaveEndDate: '',
      leaveDays: '',
      reason: '',
      balance: '0.00',
      quota: '0.00',
      eligibility: '0.00',
      recId: '',
    };
  }

  /**
   * Redux persistence helpers
   */
  toJSON() {
    return {state: this.state, leaveData: {...this.leaveData}};
  }

  fromJSON(obj) {
    if (!obj) return;
    this.state = obj.state ?? null;
    this.leaveData = {...this.leaveData, ...obj.leaveData};
  }

  async startLeaveRequestFlow(userData) {
    this.reset();
    this.leaveData.mode = 'leave_request';
    return this.askForLeaveType(userData);
  }

  async startLeaveBalanceFlow(userData) {
    this.reset();
    this.leaveData.mode = 'leave_balance';
    return this.askForLeaveType(userData);
  }

  async askForLeaveType(userData) {
    this.state = 'awaiting_leave_type';
    try {
      console.log('📡 Fetching leave codes for employee:', userData.employeeId);
      const leaveCodes = await RetrieveLeaveCodes({
        employeeId: userData.employeeId,
      });

      console.log('📋 Received leave codes:', leaveCodes);

      if (!leaveCodes || leaveCodes.length === 0) {
        this.reset();
        return {
          response:
            'Sorry, no leave types are available for your profile. Please contact HR.',
          next_state: null,
        };
      }

      this.leaveData.availableLeaveCodes = leaveCodes;

      // Create a user-friendly list with simplified names
      const codesList = leaveCodes
        .map((code, idx) => {
          const simpleName = this.simplifyLeaveName(code.LeaveDescription);
          return `${idx + 1}. ${simpleName}`;
        })
        .join('\n');

      const intro =
        this.leaveData.mode === 'leave_balance'
          ? "Sure! Let's check your leave balance."
          : 'Great! Let me help you request a leave.';

      const instructions =
        this.leaveData.mode === 'leave_balance'
          ? 'Reply with the number or name (e.g., "1" or "annual"). Type "cancel" to stop.'
          : 'Reply with the number or name (e.g., "1" or "annual"). Type "cancel" to stop.';

      return {
        response: `${intro}\n\n**Available leave types:**\n\n${codesList}\n\n${instructions}`,
        next_state: 'awaiting_leave_type',
      };
    } catch (error) {
      console.error('❌ Error fetching leave codes:', error);
      this.reset();
      return {
        response: 'Unable to fetch leave types. Please try again later.',
        next_state: null,
      };
    }
  }

  simplifyLeaveName(fullName) {
    if (!fullName) return '';

    // Common leave type simplifications
    const simplifications = {
      'annual leave': 'Annual Leave',
      'casual leave': 'Casual Leave',
      'sick leave': 'Sick Leave',
      'maternity leave': 'Maternity Leave',
      'paternity leave': 'Paternity Leave',
      'earned leave': 'Earned Leave',
      'privilege leave': 'Privilege Leave',
      'compensatory leave': 'Compensatory Leave',
      'leave without pay': 'Leave Without Pay',
    };

    const lowerName = fullName.toLowerCase();

    // Check for matches in simplifications
    for (const [key, value] of Object.entries(simplifications)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }

    // If no match, return the original but cleaned up
    return fullName.replace(/\s+/g, ' ').trim();
  }

  parseLeaveTypeSelection(userInput) {
    const availableLeaveCodes = this.leaveData.availableLeaveCodes || [];
    const input = String(userInput || '')
      .toLowerCase()
      .trim();

    console.log('🔍 Parsing leave type:', input);
    console.log('📊 Available codes:', availableLeaveCodes);

    if (!availableLeaveCodes.length) {
      console.log('❌ No available leave codes');
      return {success: false};
    }

    // 1. First try exact number match (e.g., "1", "2", "3")
    const numMatch = String(userInput).match(/^(\d+)$/);
    if (numMatch) {
      const idx = parseInt(numMatch[1], 10) - 1;
      console.log('🔢 Number match, idx:', idx);
      if (idx >= 0 && idx < availableLeaveCodes.length) {
        const selected = availableLeaveCodes[idx];
        console.log('✅ Selected by number:', selected);
        this.leaveData.leaveCode = selected.LeaveCode || '';
        this.leaveData.leaveName = selected.LeaveDescription || '';
        console.log('💾 Updated leaveData:', this.leaveData);
        return {success: true, selected};
      }
    }

    // 2. Try simplified name matching
    for (const code of availableLeaveCodes) {
      const simpleName = this.simplifyLeaveName(
        code.LeaveDescription,
      ).toLowerCase();
      const codeLower = (code.LeaveCode || '').toLowerCase();
      const descLower = (code.LeaveDescription || '').toLowerCase();

      // Check if input matches simplified name, code, or description
      if (
        simpleName.includes(input) ||
        input.includes(simpleName) ||
        codeLower === input ||
        descLower.includes(input) ||
        input.includes(codeLower)
      ) {
        console.log('✅ Matched by name:', code);
        this.leaveData.leaveCode = code.LeaveCode || '';
        this.leaveData.leaveName = code.LeaveDescription || '';
        console.log('💾 Updated leaveData:', this.leaveData);
        return {success: true, selected: code};
      }
    }

    // 3. Try partial matching for common leave types
    const commonMatches = {
      annual: 'annual',
      casual: 'casual',
      sick: 'sick',
      maternity: 'maternity',
      paternity: 'paternity',
      earned: 'earned',
      privilege: 'privilege',
      compensatory: 'compensatory',
      lwp: 'leave without pay',
      'without pay': 'leave without pay',
    };

    for (const [key, value] of Object.entries(commonMatches)) {
      if (input.includes(key)) {
        for (const code of availableLeaveCodes) {
          const descLower = (code.LeaveDescription || '').toLowerCase();
          if (descLower.includes(value)) {
            console.log('✅ Common match found:', code);
            this.leaveData.leaveCode = code.LeaveCode || '';
            this.leaveData.leaveName = code.LeaveDescription || '';
            console.log('💾 Updated leaveData:', this.leaveData);
            return {success: true, selected: code};
          }
        }
      }
    }

    console.log('❌ No match found for input:', input);
    return {success: false};
  }

  askForLeaveCategory() {
    this.state = 'awaiting_leave_category';
    return {
      response:
        '**Select leave category:**\n\n1) Full Day Leave\n2) Half Day Leave\n\nReply 1 or 2.',
      next_state: 'awaiting_leave_category',
    };
  }

  parseLeaveCategory(userInput) {
    const input = String(userInput || '')
      .trim()
      .toLowerCase();

    if (input === '1' || input.includes('full') || input === 'full day') {
      this.leaveData.leaveCategoryLabel = 'Full Day Leave';
      this.leaveData.leaveCategory = 'FullLeave';
      this.state = 'awaiting_start_date';
      return {success: true};
    }

    if (input === '2' || input.includes('half') || input === 'half day') {
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
      response:
        '**Please provide Start Date**\n\nFormat: YYYY-MM-DD or DD/MM/YYYY\n\nExample: 2025-12-30 or 30/12/2025',
      next_state: 'awaiting_start_date',
    };
  }

  parseStartDate(userInput) {
    const iso = parseAnyDateToISO(userInput);
    if (!iso) return {success: false};

    this.leaveData.leaveStartDate = iso;
    console.log('📅 Start date set:', iso);

    // half leave: end date same day
    if (this.leaveData.leaveCategory === 'HalfLeave') {
      this.leaveData.leaveEndDate = iso;
      this.state = 'awaiting_reason';
      return {success: true, autoEndDate: true};
    }

    this.state = 'awaiting_end_date';
    return {success: true, autoEndDate: false};
  }

  askForEndDate() {
    this.state = 'awaiting_end_date';
    return {
      response:
        '**Now provide End Date**\n\nFormat: YYYY-MM-DD or DD/MM/YYYY\n\nExample: 2025-12-31 or 31/12/2025',
      next_state: 'awaiting_end_date',
    };
  }

  parseEndDate(userInput) {
    const iso = parseAnyDateToISO(userInput);
    if (!iso) return {success: false};

    const start = new Date(this.leaveData.leaveStartDate);
    const end = new Date(iso);
    if (end < start)
      return {success: false, error: 'End date cannot be before start date.'};

    this.leaveData.leaveEndDate = iso;
    console.log('📅 End date set:', iso);
    this.state = 'awaiting_reason';
    return {success: true};
  }

  async fetchLeaveDaysBalanceQuotaEligibility(userData) {
    console.log('🔄 Fetching leave details...');
    console.log('📋 Current leaveData:', this.leaveData);
    console.log('👤 User data:', {
      workerId: userData?.WorkerRecId,
      empId: userData?.employeeId,
    });

    const startDate = this.leaveData.leaveStartDate;
    const endDate =
      this.leaveData.leaveEndDate || this.leaveData.leaveStartDate;

    // 1) Leave Days
    let leaveDays = computeFallbackLeaveDays(
      startDate,
      endDate,
      this.leaveData.leaveCategory,
    );

    if (
      this.leaveData.leaveCode &&
      startDate &&
      endDate &&
      userData?.WorkerRecId
    ) {
      try {
        console.log('📡 Calling GetLeaveDays API...');
        const leaveDaysResult = await GetLeaveDays({
          employeeId: userData.WorkerRecId,
          leaveCode: this.leaveData.leaveCode,
          leaveStartDate: startDate,
          leaveEndDate: endDate,
        });

        console.log('📡 GetLeaveDays result:', leaveDaysResult);
        if (leaveDaysResult !== null && leaveDaysResult !== undefined) {
          leaveDays = String(leaveDaysResult);
        }
      } catch (e) {
        console.error('❌ GetLeaveDays error:', e);
      }
    }

    this.leaveData.leaveDays = leaveDays;
    console.log('✅ Final leave days:', leaveDays);

    // 2) Balance & Quota
    const effectiveStartDate = startDate || todayISOWithTime();
    const leaveRequestId = this.leaveData.recId || '';

    let balance = '0.00';
    let quota = '0.00';

    if (this.leaveData.leaveCode && userData?.employeeId) {
      try {
        console.log('📡 Calling GetLeaveBalance API...');
        const balanceResult = await GetLeaveBalance({
          employeeId: userData.employeeId,
          leaveCode: this.leaveData.leaveCode,
          leaveStartDate: effectiveStartDate,
          leaveRequestId: leaveRequestId,
        });

        console.log('📡 Calling GetEmployeeQuota API...');
        const quotaResult = await GetEmployeeQuota({
          employeeId: userData.employeeId,
          leaveCode: this.leaveData.leaveCode,
          leaveStartDate: effectiveStartDate,
          leaveRecId: leaveRequestId || '0',
        });

        console.log(
          '📊 Balance result:',
          balanceResult,
          'Quota result:',
          quotaResult,
        );

        if (balanceResult !== null && balanceResult !== undefined) {
          balance = String(balanceResult);
        }
        if (quotaResult !== null && quotaResult !== undefined) {
          quota = String(quotaResult);
        }
      } catch (e) {
        console.error('❌ GetLeaveBalance/GetEmployeeQuota error:', e);
      }
    }

    const balanceNum = toNumberSafe(balance);
    const quotaNum = toNumberSafe(quota);
    const eligibility = String(Math.max(balanceNum, quotaNum));

    this.leaveData.balance = balance;
    this.leaveData.quota = quota;
    this.leaveData.eligibility = eligibility;

    console.log('✅ Final values:', {
      leaveDays: this.leaveData.leaveDays,
      balance: this.leaveData.balance,
      quota: this.leaveData.quota,
      eligibility: this.leaveData.eligibility,
    });
  }

  async buildBalanceOnly(userData) {
    this.leaveData.leaveStartDate = todayISOWithTime();
    this.leaveData.leaveEndDate = todayISOWithTime();
    this.leaveData.leaveDays = '0';
    await this.fetchLeaveDaysBalanceQuotaEligibility(userData);
  }

  askForReason() {
    this.state = 'awaiting_reason';
    const start = formatDisplayDate(this.leaveData.leaveStartDate);
    const end = formatDisplayDate(this.leaveData.leaveEndDate);
    return {
      response: `**Please provide a reason for your leave**\n\nLeave Period: ${start} to ${end}\n\nType your reason (3-500 characters):`,
      next_state: 'awaiting_reason',
    };
  }

  parseReason(userInput) {
    const reason = String(userInput || '').trim();
    if (reason.length >= 3 && reason.length <= 500) {
      this.leaveData.reason = reason;
      console.log('📝 Reason set:', reason);
      this.state = 'awaiting_confirmation';
      return {success: true};
    }
    return {success: false, error: 'Reason must be 3-500 characters.'};
  }

  validateRequiredFields() {
    console.log('🔍 Validating fields...');
    console.log('📋 Current leaveData for validation:', this.leaveData);

    const missing = [];

    if (!this.leaveData.leaveCode || !this.leaveData.leaveName) {
      console.log('❌ Missing leave type:', {
        code: this.leaveData.leaveCode,
        name: this.leaveData.leaveName,
      });
      missing.push('leave type');
    }

    if (!this.leaveData.leaveStartDate) {
      console.log('❌ Missing start date');
      missing.push('start date');
    }

    if (!this.leaveData.leaveEndDate) {
      console.log('❌ Missing end date');
      missing.push('end date');
    }

    if (!this.leaveData.leaveDays || Number(this.leaveData.leaveDays) === 0) {
      console.log('❌ Missing or zero leave days:', this.leaveData.leaveDays);
      missing.push('leave days');
    }

    if (!this.leaveData.reason) {
      console.log('❌ Missing reason');
      missing.push('reason');
    }

    console.log('📊 Missing fields:', missing);
    return missing;
  }

  askForConfirmation() {
    this.state = 'awaiting_confirmation';

    console.log('🎯 Asking for confirmation with data:', this.leaveData);

    if (this.leaveData.mode === 'leave_balance') {
      return {
        response: `📊 **Leave Balance**\n\n• **Leave Type:** ${this.leaveData.leaveName} (${this.leaveData.leaveCode})\n• **Balance:** ${this.leaveData.balance}\n• **Quota:** ${this.leaveData.quota}\n• **Eligibility:** ${this.leaveData.eligibility}\n\nType another leave type (number or name) to check again, or type "cancel".`,
        next_state: 'awaiting_confirmation',
      };
    }

    const missing = this.validateRequiredFields();
    if (missing.length > 0) {
      console.log('⚠️ Missing fields found:', missing);

      // Try to recover gracefully
      if (missing.includes('leave type')) {
        this.state = 'awaiting_leave_type';
        return {
          response:
            'I need to know which leave type you want. Please choose from the list above by number or name.',
          next_state: 'awaiting_leave_type',
        };
      }

      if (missing.includes('start date')) {
        this.state = 'awaiting_start_date';
        return {
          response:
            'I need your start date. Please enter YYYY-MM-DD or DD/MM/YYYY.',
          next_state: 'awaiting_start_date',
        };
      }

      if (missing.includes('end date')) {
        this.state = 'awaiting_end_date';
        return {
          response:
            'I need your end date. Please enter YYYY-MM-DD or DD/MM/YYYY.',
          next_state: 'awaiting_end_date',
        };
      }

      if (missing.includes('leave days')) {
        if (this.leaveData.leaveCategory === 'HalfLeave') {
          this.leaveData.leaveDays = '0.5';
          console.log('✅ Auto-set half day leave days to 0.5');
          return this.askForConfirmation();
        }
        this.state = 'awaiting_end_date';
        return {
          response: 'I need both start and end dates to calculate leave days.',
          next_state: 'awaiting_end_date',
        };
      }

      if (missing.includes('reason')) {
        this.state = 'awaiting_reason';
        return {
          response: 'Please provide a brief reason (3-500 characters).',
          next_state: 'awaiting_reason',
        };
      }
    }

    // All fields are present, show confirmation
    return {
      response: `📝 **Leave Request Summary**\n\n• **Leave Type:** ${
        this.leaveData.leaveName
      } (${this.leaveData.leaveCode})\n• **Category:** ${
        this.leaveData.leaveCategoryLabel
      }\n• **Start Date:** ${formatDisplayDate(
        this.leaveData.leaveStartDate,
      )}\n• **End Date:** ${formatDisplayDate(
        this.leaveData.leaveEndDate,
      )}\n• **Leave Days:** ${this.leaveData.leaveDays}\n• **Balance:** ${
        this.leaveData.balance
      }\n• **Quota:** ${this.leaveData.quota}\n• **Eligibility:** ${
        this.leaveData.eligibility
      }\n• **Reason:** ${
        this.leaveData.reason
      }\n\n**Please confirm:**\n1) **Save** (Save as Draft)\n2) **Submit** (Submit for Approval)\n3) **Cancel** (Cancel Request)`,
      next_state: 'awaiting_confirmation',
    };
  }

  async createOrSubmitLeave(userData, action /* 'save' | 'submit' */) {
    try {
      console.log('🚀 Creating/Submitting leave request...');
      console.log('📦 Final leaveData:', this.leaveData);
      console.log('👤 User data:', userData);

      const formattedLeaveReqDate = todayISOWithTime();
      const recId = this.leaveData.recId ? String(this.leaveData.recId) : '0';

      // Final safeguard for leave days
      let finalLeaveDays = this.leaveData.leaveDays;
      if (!finalLeaveDays || Number(finalLeaveDays) === 0) {
        finalLeaveDays = computeFallbackLeaveDays(
          this.leaveData.leaveStartDate,
          this.leaveData.leaveEndDate,
          this.leaveData.leaveCategory,
        );
        this.leaveData.leaveDays = finalLeaveDays;
        console.log('🔄 Using fallback leave days:', finalLeaveDays);
      }

      const leavesData = {
        LeaveCode: this.leaveData.leaveCode,
        LeaveDays: finalLeaveDays,
        LeaveCategory: getLeaveCategoryCode(this.leaveData.leaveCategoryLabel),
        Balance: this.leaveData.balance,
        Eligibility: this.leaveData.eligibility,
        Quota: this.leaveData.quota,
        LeaveStartDate: this.leaveData.leaveStartDate,
        LeaveEndDate: this.leaveData.leaveEndDate,
        LeaveReqDate: formattedLeaveReqDate,
        Reason: this.leaveData.reason,
        EmployeeId: userData.employeeId,
        RecId: recId,
      };

      console.log('📤 Sending to API:', leavesData);

      // Validate required fields
      if (
        !leavesData.LeaveCode ||
        !leavesData.LeaveStartDate ||
        !leavesData.LeaveEndDate
      ) {
        console.error('❌ Missing required fields:', leavesData);
        return {
          success: false,
          message: 'Missing required fields. Please try again.',
        };
      }

      if (!leavesData.LeaveDays || Number(leavesData.LeaveDays) === 0) {
        console.error('❌ Leave days is zero:', leavesData);
        return {
          success: false,
          message:
            'Leave Days cannot be zero. Please adjust dates and try again.',
        };
      }

      // Create the leave request
      console.log('📡 Calling createLeaveRequest API...');
      const created = await createLeaveRequest({leaveData: leavesData});
      console.log('✅ API response:', created);

      const isSuccess =
        created?.IsSuccess === true ||
        created?.IsSuccess === 'true' ||
        !!created?.RecId;

      if (!isSuccess) {
        return {
          success: false,
          message: created?.Message || 'Failed to create leave request.',
        };
      }

      const createdRecId = created?.RecId;

      if (action === 'submit') {
        console.log('📡 Submitting leave request...');
        await SubmitLeaveRequest({recId: createdRecId});
        return {
          success: true,
          message: `✅ Leave request submitted successfully!\nRequest ID: ${createdRecId}`,
        };
      }

      return {
        success: true,
        message: `✅ Leave request saved as Draft.\nRequest ID: ${createdRecId}`,
      };
    } catch (error) {
      console.error('❌ createOrSubmitLeave error:', error);
      return {
        success: false,
        message: error?.message || 'Network/server error while creating leave.',
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
  String(text || '')
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const fuzzyIncludes = (text, keyword) => {
  const normText = normalize(text);
  const normKeyword = normalize(keyword);
  if (normText.includes(normKeyword)) return true;

  // Also check for common variations
  const commonVariations = {
    attendance: ['attendence', 'attandance'],
    leave: ['leaves', 'leav', 'leve'],
    balance: ['bal', 'balanc'],
    dynaface: ['dyna face', 'dinaface'],
  };

  for (const [key, variations] of Object.entries(commonVariations)) {
    if (normKeyword.includes(key)) {
      for (const variation of variations) {
        if (normText.includes(variation)) return true;
      }
    }
  }

  return false;
};

const ATTENDANCE_KEYWORDS = [
  'attendance',
  'mark attendance',
  'punch in',
  'punch out',
  'check in',
  'check out',
  'mark my attendance',
];

const LEAVE_KEYWORDS = [
  'leave',
  'apply leave',
  'request leave',
  'leave request',
  'take leave',
  'need leave',
  'want leave',
  'apply for leave',
];

const LEAVE_BALANCE_KEYWORDS = [
  'leave balance',
  'balance',
  'remaining leave',
  'how many leaves',
  'how much leave',
  'leave remaining',
  'check balance',
  'my balance',
];

const INFO_KEYWORDS = [
  'about dynaface',
  'dynaface info',
  'app features',
  'how to use',
  'dynaface',
  'what is dynaface',
  'tell me about dynaface',
];

const detectIntent = userInput => {
  if (!userInput) return 'unknown';
  const text = normalize(userInput);
  console.log('🎯 Detecting intent for:', text);

  const scores = {
    mark_attendance: ATTENDANCE_KEYWORDS.filter(k => fuzzyIncludes(text, k))
      .length,
    request_leave: LEAVE_KEYWORDS.filter(k => fuzzyIncludes(text, k)).length,
    check_leave_balance: LEAVE_BALANCE_KEYWORDS.filter(k =>
      fuzzyIncludes(text, k),
    ).length,
    info_dynaface: INFO_KEYWORDS.filter(k => fuzzyIncludes(text, k)).length,
  };

  console.log('📊 Intent scores:', scores);

  const maxScore = Math.max(
    scores.mark_attendance,
    scores.request_leave,
    scores.check_leave_balance,
    scores.info_dynaface,
  );

  if (maxScore === 0) return 'unknown';

  if (scores.mark_attendance === maxScore) return 'mark_attendance';
  if (scores.check_leave_balance === maxScore) return 'check_leave_balance';
  if (scores.request_leave === maxScore) return 'request_leave';
  if (scores.info_dynaface === maxScore) return 'info_dynaface';

  return 'unknown';
};

const generateIntelligentResponse = intent => {
  const responses = {
    info_dynaface: `🤖 **About Dynaface**\n\n${
      DynafaceInfo.description
    }\n\n**Key Features:**\n${DynafaceInfo.key_features
      .map((f, i) => `${i + 1}. ${f}`)
      .join('\n')}\n\n**How to Use:**\n${
      DynafaceInfo.how_to_use
    }\n\n**Supported Operations:**\n${DynafaceInfo.supported_operations.join(
      '\n',
    )}`,
    request_leave:
      "Let me help you request a leave. I'll guide you step by step.",
    check_leave_balance:
      'Sure! I can check your leave balance. Please select a leave type.',
    mark_attendance:
      'I can help you mark your attendance. This requires location access to verify your office location.',
    unknown:
      'I can help you with:\n\n1) **Mark Attendance** - "mark attendance", "punch in"\n2) **Request Leave** - "apply for leave", "request leave"\n3) **Check Leave Balance** - "check my balance", "how many leaves"\n4) **About Dynaface** - "what is dynaface", "app features"\n\nWhat would you like to do?',
  };

  return responses[intent] || responses.unknown;
};

export {
  LeaveRequestHandler,
  DynafaceInfo,
  detectIntent,
  generateIntelligentResponse,
};
