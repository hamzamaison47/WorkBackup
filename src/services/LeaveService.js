// services/LeaveService.js
/* eslint-disable curly */
/* eslint-disable no-unused-vars */
import {RetrieveLeaveCodes} from '../API/Leaves/LeaveCodes';
import {createLeaveRequest} from '../API/Leaves/CreateLeaveRequest';
import SubmitLeaveRequest from '../API/Leaves/SubmitLeaveRequest';
import DeleteLeaveRequest from '../API/Leaves/deleteLeaveRequest';
import {GetLeaveBalance} from '../API/Leaves/LeaveBalance';
import {GetEmployeeQuota} from '../API/Leaves/GetEmployeeQuota';
import {GetLeaveDays} from '../API/Leaves/GetLeaveDays';
import {RetrieveAllLeaves} from '../API/Leaves/RetrieveAllLeaves';

class LeaveService {
  constructor() {
    this.apiCache = new Map();
  }

  getFunctionDefinitions() {
    return [
      {
        name: 'get_available_leave_types',
        description: 'Get all available leave types for the employee.',
        parameters: {
          type: 'object',
          properties: {
            employeeId: {type: 'string'},
          },
          required: [],
        },
      },
      {
        name: 'get_leave_balance',
        description: 'Check remaining leave balance for a specific leave type.',
        parameters: {
          type: 'object',
          properties: {
            employeeId: {type: 'string'},
            leaveCode: {type: 'string'},
            startDate: {type: 'string'},
          },
          required: ['leaveCode'],
        },
      },
      {
        name: 'calculate_leave_days',
        description: 'Calculate number of leave days between two dates.',
        parameters: {
          type: 'object',
          properties: {
            employeeId: {type: 'string'},
            leaveCode: {type: 'string'},
            startDate: {type: 'string'},
            endDate: {type: 'string'},
          },
          required: ['leaveCode', 'startDate'],
        },
      },
      {
        name: 'create_leave_request',
        description:
          'Create a NEW leave request via API. No navigation needed. Returns the Leave RecId which can be used to submit or edit later.',
        parameters: {
          type: 'object',
          properties: {
            employeeId: {type: 'string'},
            leaveCode: {type: 'string'},
            startDate: {type: 'string'},
            endDate: {type: 'string'},
            leaveCategory: {type: 'string', enum: ['FullLeave', 'HalfLeave']},
            reason: {type: 'string'},
          },
          required: ['leaveCode', 'startDate'],
        },
      },
      {
        name: 'submit_leave_request',
        description:
          'Submit a leave request for approval. Uses the Leave Record RecId (the RecId field from the leave data, e.g., "5637237577").',
        parameters: {
          type: 'object',
          properties: {
            requestId: {
              type: 'string',
              description:
                'The RecId of the leave request (e.g., "5637237577")',
            },
          },
          required: ['requestId'],
        },
      },
      {
        name: 'delete_leave_request',
        description:
          'Delete/cancel a leave request using the Leave Record RecId (the RecId field from the leave data, e.g., "5637237577"). Only works on NotSubmitted/Draft status.',
        parameters: {
          type: 'object',
          properties: {
            requestId: {
              type: 'string',
              description:
                'The RecId of the leave request to delete (e.g., "5637237577")',
            },
          },
          required: ['requestId'],
        },
      },
      {
        name: 'get_leave_requests',
        description:
          'Get list of leave requests to display in chatbot. Returns leave records with their RecIds for use in submit/delete/edit operations.',
        parameters: {
          type: 'object',
          properties: {
            employeeId: {type: 'string'},
            status: {
              type: 'string',
              enum: ['all', 'draft', 'pending', 'approved', 'rejected'],
              default: 'all',
            },
            limit: {type: 'integer', default: 20},
          },
          required: [],
        },
      },
      {
        name: 'validate_leave_request',
        description: 'Validate if a leave request is valid before creating it.',
        parameters: {
          type: 'object',
          properties: {
            employeeId: {type: 'string'},
            leaveCode: {type: 'string'},
            startDate: {type: 'string'},
            endDate: {type: 'string'},
            leaveCategory: {type: 'string', enum: ['FullLeave', 'HalfLeave']},
          },
          required: ['leaveCode', 'startDate'],
        },
      },
      {
        name: 'navigate_to_screen',
        description:
          'Navigate to specific screens. ATTENDANCE: Use CreateAttendanceScreen. LEAVES: ONLY for EDITING existing leave requests (mode=edit). NEVER for creating leaves - use create_leave_request API instead. Must provide leaveData with all fields including RecId.',
        parameters: {
          type: 'object',
          properties: {
            screenName: {
              type: 'string',
              enum: ['CreateAttendanceScreen', 'LeaveRequestSaveRecord'],
              description:
                'CreateAttendanceScreen for attendance marking. LeaveRequestSaveRecord for editing existing leaves ONLY.',
            },
            mode: {
              type: 'string',
              enum: ['edit'],
              description:
                'MUST be "edit" when navigating to LeaveRequestSaveRecord. Never "create".',
            },
            leaveData: {
              type: 'object',
              description:
                'Complete leave record data for editing. Must include: recId (the RecId field), employeeId, employeeName, WorkerRecId, leaveCode, leaveStartDate, leaveEndDate, leaveDays, leaveCategory, reason, balance, quota, eligibility.',
            },
            message: {
              type: 'string',
              description: 'Message to show user before navigating',
            },
          },
          required: ['screenName'],
        },
      },
    ];
  }

  async navigate_to_screen({screenName, mode, leaveData, message = ''}) {
    // Only allow Edit mode for Leave screen
    if (screenName === 'LeaveRequestSaveRecord' && mode !== 'edit') {
      return {
        success: false,
        error: 'INVALID_MODE',
        message:
          'LeaveRequestSaveRecord only supports "edit" mode via navigation. For creating leaves, use create_leave_request function instead.',
      };
    }

    // Validate required fields for edit navigation
    if (screenName === 'LeaveRequestSaveRecord' && mode === 'edit') {
      if (!leaveData || !leaveData.recId) {
        return {
          success: false,
          error: 'MISSING_RECID',
          message:
            'Navigation to edit requires leaveData with recId (the RecId field from the leave record).',
        };
      }
    }

    return {
      success: true,
      action: 'navigate',
      screenName,
      mode, // 'edit' for leaves
      leaveData, // full record data for edit
      message,
      timestamp: new Date().toISOString(),
    };
  }

  async delete_leave_request({requestId}) {
    try {
      if (!requestId) {
        return {
          success: false,
          error: 'MISSING_PARAMETER',
          message: 'Leave Record RecId is required for deletion',
        };
      }

      // Support both single string and array
      const ids = Array.isArray(requestId) ? requestId : [String(requestId)];

      const result = await DeleteLeaveRequest({recordsRecId: ids});

      return {
        success: true,
        message: 'Leave request deleted successfully',
        deletedRecIds: ids,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'DELETE_FAILED',
        message: error.message || 'Failed to delete leave request',
      };
    }
  }

  fillParametersFromContext(parameters, userData) {
    const filled = {...parameters};

    if (!filled.employeeId && userData?.employeeId) {
      filled.employeeId = userData.employeeId;
    }

    if (!filled.WorkerRecId && userData?.WorkerRecId) {
      filled.WorkerRecId = userData.WorkerRecId;
    }

    if (!filled.employeeName && userData?.employeeName) {
      filled.employeeName = userData.employeeName;
    }

    if (filled.startDate) {
      filled.startDate = this.parseFlexibleDate(filled.startDate);
    }

    if (filled.endDate) {
      filled.endDate = this.parseFlexibleDate(filled.endDate);
    } else if (filled.startDate) {
      filled.endDate = filled.startDate;
    }

    if (!filled.startDate && parameters.startDate !== undefined) {
      filled.startDate = this.todayISO();
    }

    if (!filled.leaveCategory && parameters.leaveCategory !== undefined) {
      filled.leaveCategory = 'FullLeave';
    }

    if (!filled.status && parameters.status !== undefined) {
      filled.status = 'all';
    }

    if (!filled.limit && parameters.limit !== undefined) {
      filled.limit = 20;
    }

    return filled;
  }

  parseFlexibleDate(input) {
    if (!input) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
      return input.includes('T') ? input : `${input}T12:00:00`;
    }

    const today = new Date();
    const lowerInput = input.toLowerCase().trim();

    if (lowerInput === 'today') {
      return this.formatDateISO(today);
    }

    if (lowerInput === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return this.formatDateISO(tomorrow);
    }

    const nextDayMatch = lowerInput.match(/next\s+(\w+)/);
    if (nextDayMatch) {
      const dayName = nextDayMatch[1];
      const daysOfWeek = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      const targetDay = daysOfWeek.indexOf(dayName.toLowerCase());
      if (targetDay !== -1) {
        const currentDay = today.getDay();
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7;
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + daysToAdd);
        return this.formatDateISO(nextDate);
      }
    }

    try {
      const parsed = new Date(input);
      if (!isNaN(parsed.getTime())) {
        return this.formatDateISO(parsed);
      }
    } catch (e) {
      console.error('Date parse error:', e);
    }

    return null;
  }

  formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00`;
  }

  todayISO() {
    return this.formatDateISO(new Date());
  }

  async get_available_leave_types({employeeId}) {
    try {
      const cacheKey = `leave_types_${employeeId}`;
      if (this.apiCache.has(cacheKey)) {
        const cached = this.apiCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) {
          return cached.data;
        }
      }

      const data = await RetrieveLeaveCodes({employeeId});

      if (!Array.isArray(data) || data.length === 0) {
        return {
          success: false,
          error: 'NO_LEAVE_TYPES',
          message: 'No leave types available for this employee',
        };
      }

      const result = {
        success: true,
        leaves: data.map(leave => ({
          code: leave.LeaveCode,
          name: leave.LeaveDescription,
          description: leave.LeaveDescription,
          id: leave.RecId,
        })),
        leaveMap: data.reduce((map, leave) => {
          map[leave.LeaveDescription.toLowerCase()] = leave.LeaveCode;
          map[leave.LeaveCode.toLowerCase()] = leave.LeaveCode;
          return map;
        }, {}),
      };

      this.apiCache.set(cacheKey, {data: result, timestamp: Date.now()});
      return result;
    } catch (error) {
      return {
        success: false,
        error: 'API_ERROR',
        message: error.message,
      };
    }
  }

  async get_leave_balance({employeeId, leaveCode, startDate}) {
    try {
      const effectiveStartDate = startDate || this.todayISO();

      const [balance, quota] = await Promise.all([
        GetLeaveBalance({
          employeeId,
          leaveCode,
          leaveStartDate: effectiveStartDate,
          leaveRequestId: '0',
        }),
        GetEmployeeQuota({
          employeeId,
          leaveCode,
          leaveStartDate: effectiveStartDate,
          leaveRecId: '0',
        }),
      ]);

      const balanceNum = parseFloat(balance || 0);
      const quotaNum = parseFloat(quota || 0);

      return {
        success: true,
        leaveCode,
        balance: balanceNum,
        quota: quotaNum,
        eligibility: Math.max(balanceNum, quotaNum),
        asOfDate: effectiveStartDate,
      };
    } catch (error) {
      return {
        success: false,
        error: 'API_ERROR',
        message: error.message,
      };
    }
  }

  async calculate_leave_days({employeeId, leaveCode, startDate, endDate}) {
    try {
      const effectiveEndDate = endDate || startDate;

      const days = await GetLeaveDays({
        employeeId,
        leaveCode,
        leaveStartDate: startDate,
        leaveEndDate: effectiveEndDate,
      });

      return {
        success: true,
        days: parseFloat(days || 0),
        startDate,
        endDate: effectiveEndDate,
      };
    } catch (error) {
      return {
        success: false,
        error: 'API_ERROR',
        message: error.message,
      };
    }
  }

  async create_leave_request({
    employeeId,
    employeeName,
    leaveCode,
    startDate,
    endDate,
    leaveCategory,
    reason,
  }) {
    try {
      const missingParams = [];
      if (!employeeId) missingParams.push('employeeId');
      if (!leaveCode) missingParams.push('leaveCode');
      if (!startDate) missingParams.push('startDate');

      if (missingParams.length > 0) {
        return {
          success: false,
          error: 'MISSING_PARAMETERS',
          message: 'Required parameters are missing',
          missingParameters: missingParams,
        };
      }

      const effectiveEndDate = endDate || startDate;
      const effectiveCategory = leaveCategory || 'FullLeave';
      const effectiveReason = reason || 'Leave request';

      const [daysResult, balanceResult] = await Promise.all([
        this.calculate_leave_days({
          employeeId,
          leaveCode,
          startDate,
          endDate: effectiveEndDate,
        }),
        this.get_leave_balance({employeeId, leaveCode, startDate}),
      ]);

      if (!daysResult.success || !balanceResult.success) {
        return {
          success: false,
          error: 'CALCULATION_ERROR',
          message: 'Failed to calculate leave details',
        };
      }

      const leaveData = {
        LeaveCode: leaveCode,
        LeaveDays: daysResult.days.toString(),
        LeaveCategory: effectiveCategory,
        Balance: balanceResult.balance.toString(),
        Eligibility: balanceResult.eligibility.toString(),
        Quota: balanceResult.quota.toString(),
        LeaveStartDate: startDate,
        LeaveEndDate: effectiveEndDate,
        LeaveReqDate: this.todayISO(),
        Reason: effectiveReason,
        EmployeeId: employeeId,
        EmployeeName: employeeName || '',
        RecId: '0',
      };

      const created = await createLeaveRequest({leaveData});

      if (!created?.RecId) {
        return {
          success: false,
          error: 'CREATE_FAILED',
          message: created?.Message || 'Failed to create leave request',
        };
      }

      // Return the RecId clearly so AI can use it for submit or edit
      return {
        success: true,
        requestId: created.RecId, // This is the RecId for submit/delete/edit
        recId: created.RecId, // Explicitly provide recId for navigation
        status: 'draft',
        leaveDetails: {
          leaveCode,
          days: daysResult.days,
          balance: balanceResult.balance,
          startDate,
          endDate: effectiveEndDate,
          category: effectiveCategory,
        },
        message: `Leave request created successfully with Record ID: ${created.RecId}`,
        nextActions: [
          `Submit: Use submit_leave_request with requestId: "${created.RecId}"`,
          `Edit: Use navigate_to_screen with mode="edit" and leaveData.recId="${created.RecId}"`,
          `Delete: Use delete_leave_request with requestId: "${created.RecId}"`,
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: 'API_ERROR',
        message: error.message,
      };
    }
  }

  async submit_leave_request({requestId}) {
    try {
      if (!requestId) {
        return {
          success: false,
          error: 'MISSING_PARAMETER',
          message: 'Leave Record RecId is required for submission',
        };
      }

      const result = await SubmitLeaveRequest({recId: String(requestId)});

      const isSuccess =
        result?.IsSuccess === true || result?.IsSuccess === 'true';

      if (!isSuccess) {
        return {
          success: false,
          error: 'SUBMIT_FAILED',
          message: result?.Message || 'Failed to submit leave request',
        };
      }

      return {
        success: true,
        requestId: String(requestId),
        status: 'submitted',
        message: 'Leave request submitted successfully for approval',
      };
    } catch (error) {
      return {
        success: false,
        error: 'API_ERROR',
        message: error.message,
      };
    }
  }

  async get_leave_requests({employeeId, status = 'all', limit = 20}) {
    try {
      if (!employeeId) {
        return {
          success: false,
          error: 'MISSING_PARAMETER',
          message: 'Employee ID is required',
        };
      }

      const data = await RetrieveAllLeaves({employeeId});

      if (!Array.isArray(data)) {
        return {
          success: false,
          error: 'NO_DATA',
          message: 'No leave requests found',
        };
      }

      const statusMap = {
        draft: ['NotSubmitted', 'Draft'],
        pending: ['Pending', 'Submitted', 'PendingApproval'],
        approved: ['Approved'],
        rejected: ['Rejected'],
      };

      let filtered = data;
      if (status !== 'all' && statusMap[status]) {
        filtered = data.filter(leave =>
          statusMap[status].includes(leave.WFStatus),
        );
      }

      const limited = filtered.slice(0, limit);

      return {
        success: true,
        requests: limited.map(leave => ({
          // Primary identifier for all operations
          recId: leave.RecId,
          requestId: leave.RecId, // Same as recId for consistency
          displayId: leave.LeaveReqId, // The human-readable ID like "USMF-000299"

          // Basic info
          type: leave.LeaveCode,
          typeName: leave.LeaveDescription,
          status: leave.WFStatus,
          statusLabel: leave.LeaveRequestStatus,

          // Dates
          startDate: leave.LeaveStartDate,
          endDate: leave.LeaveEndDate,
          requestDate: leave.LeaveReqDate,
          days: leave.LeaveDays,

          // Category and reason
          category: leave.LeaveCategory,
          reason: leave.Reason,

          // Balance info
          balance: leave.Balance,
          quota: leave.Quota,
          eligibility: leave.Eligibility,

          // Employee info
          employeeId: leave.EmployeeId,
          employeeName: leave.EmployeeName,
          WorkerRecId: leave.WorkerRecId,

          // Include raw data for navigation if needed
          rawData: leave,
        })),
        total: filtered.length,
        showing: limited.length,
        hasMore: filtered.length > limit,
        note: 'Use the recId field for submit, delete, or edit operations',
      };
    } catch (error) {
      return {
        success: false,
        error: 'API_ERROR',
        message: error.message,
      };
    }
  }

  async validate_leave_request({
    employeeId,
    leaveCode,
    startDate,
    endDate,
    leaveCategory = 'FullLeave',
  }) {
    try {
      const errors = [];
      const warnings = [];
      const effectiveEndDate = endDate || startDate;

      const start = new Date(startDate);
      const end = new Date(effectiveEndDate);

      if (start > end) {
        errors.push({
          field: 'dates',
          code: 'START_AFTER_END',
          message: 'Start date cannot be after end date',
        });
      }

      if (
        leaveCategory === 'HalfLeave' &&
        start.toDateString() !== end.toDateString()
      ) {
        errors.push({
          field: 'dates',
          code: 'HALF_DAY_MULTIPLE_DATES',
          message: 'Half day leave must be for a single day',
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (start < today) {
        warnings.push({
          field: 'startDate',
          code: 'PAST_DATE',
          message: 'Leave start date is in the past',
        });
      }

      const [balanceResult, daysResult] = await Promise.all([
        this.get_leave_balance({employeeId, leaveCode, startDate}),
        this.calculate_leave_days({
          employeeId,
          leaveCode,
          startDate,
          endDate: effectiveEndDate,
        }),
      ]);

      if (balanceResult.success && daysResult.success) {
        if (balanceResult.balance < daysResult.days) {
          warnings.push({
            field: 'balance',
            code: 'INSUFFICIENT_BALANCE',
            message: `Insufficient leave balance. Available: ${balanceResult.balance}, Requested: ${daysResult.days}`,
          });
        }
      }

      return {
        success: true,
        valid: errors.length === 0,
        errors,
        warnings,
        details: {
          balance: balanceResult.balance || 0,
          days: daysResult.days || 0,
          startDate,
          endDate: effectiveEndDate,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message,
      };
    }
  }

  resolveLeaveCode(input, leaveTypesResult) {
    if (!input || !leaveTypesResult) return input;

    const leaves = leaveTypesResult.leaves || [];
    const exactCodeMatch = leaves.find(
      leave => leave.code.toLowerCase() === input.toLowerCase(),
    );
    if (exactCodeMatch) return exactCodeMatch.code;

    const nameMatch = leaves.find(
      leave =>
        leave.name.toLowerCase().includes(input.toLowerCase()) ||
        input.toLowerCase().includes(leave.name.toLowerCase()),
    );

    if (nameMatch) return nameMatch.code;

    if (leaveTypesResult.leaveMap) {
      const mappedCode = leaveTypesResult.leaveMap[input.toLowerCase()];
      if (mappedCode) return mappedCode;
    }

    return input;
  }

  async execute(functionName, parameters, userData = {}) {
    if (typeof this[functionName] !== 'function') {
      return {
        success: false,
        error: 'FUNCTION_NOT_FOUND',
        message: `Function ${functionName} not found`,
      };
    }

    try {
      const filledParams = this.fillParametersFromContext(parameters, userData);

      if (
        filledParams.leaveCode &&
        functionName !== 'get_available_leave_types'
      ) {
        const leaveTypesResult = await this.get_available_leave_types({
          employeeId: filledParams.employeeId || userData.employeeId,
        });

        if (leaveTypesResult.success) {
          const resolvedCode = this.resolveLeaveCode(
            filledParams.leaveCode,
            leaveTypesResult,
          );
          filledParams.leaveCode = resolvedCode;
        }
      }

      console.log('🔧 Executing:', functionName);
      console.log('📤 Filled params:', filledParams);

      return await this[functionName](filledParams);
    } catch (error) {
      console.error(`Error executing ${functionName}:`, error);
      return {
        success: false,
        error: 'EXECUTION_ERROR',
        message: error.message,
      };
    }
  }
}

export default LeaveService;
