/* eslint-disable curly */
// services/LeaveService.js
import {RetrieveLeaveCodes} from '../API/Leaves/LeaveCodes';
import {createLeaveRequest} from '../API/Leaves/CreateLeaveRequest';
import SubmitLeaveRequest from '../API/Leaves/SubmitLeaveRequest';
import {GetLeaveBalance} from '../API/Leaves/LeaveBalance';
import {GetEmployeeQuota} from '../API/Leaves/GetEmployeeQuota';
import {GetLeaveDays} from '../API/Leaves/GetLeaveDays';
import {RetrieveAllLeaves} from '../API/Leaves/RetrieveAllLeaves';

/**
 * SMART LEAVE SERVICE
 * - Dynamic API parameter handling
 * - Intelligent error recovery
 * - Progressive parameter collection
 */
class LeaveService {
  constructor() {
    this.apiCache = new Map();
  }

  /**
   * Get comprehensive function definitions with flexible parameters
   */
  getFunctionDefinitions() {
    return [
      {
        name: 'get_available_leave_types',
        description:
          'Get all available leave types for the employee. Use when user asks about leaves, vacation types, time off options, or available leave categories.',
        parameters: {
          type: 'object',
          properties: {
            employeeId: {
              type: 'string',
              description: 'Employee ID - can be inferred from user context',
            },
          },
          required: [], // Make it optional - we'll fill from context
        },
      },
      {
        name: 'get_leave_balance',
        description:
          'Check remaining leave balance for a specific leave type. Use when user asks "how many days", "check balance", "remaining leaves", "balance query", etc. Handles variations: balance, remaining, available, left. Accepts either leave code (e.g., "ANNUAL") or description (e.g., "Annual Leave").',
        parameters: {
          type: 'object',
          properties: {
            employeeId: {
              type: 'string',
              description: 'Employee ID from context',
            },
            leaveCode: {
              type: 'string',
              description:
                'Leave type code or description (e.g., "ANNUAL" or "Annual Leave"). The system will automatically map to the correct code.',
            },
            startDate: {
              type: 'string',
              description:
                'Reference date for balance check. Defaults to today if not provided. Accepts natural language like "today", "tomorrow", or ISO format.',
            },
          },
          required: ['leaveCode'],
        },
      },
      {
        name: 'calculate_leave_days',
        description:
          'Calculate number of leave days between two dates. Handles business days calculation.',
        parameters: {
          type: 'object',
          properties: {
            employeeId: {type: 'string'},
            leaveCode: {type: 'string'},
            startDate: {
              type: 'string',
              description:
                'Start date - accepts natural language or YYYY-MM-DD',
            },
            endDate: {
              type: 'string',
              description:
                'End date - accepts natural language or YYYY-MM-DD. Defaults to startDate for single-day leaves.',
            },
          },
          required: ['leaveCode', 'startDate'],
        },
      },
      {
        name: 'create_leave_request',
        description:
          'Create a new leave request. Try calling with available parameters - the system will ask for missing required fields if needed.',
        parameters: {
          type: 'object',
          properties: {
            employeeId: {type: 'string'},
            leaveCode: {
              type: 'string',
              description: 'Leave type code',
            },
            startDate: {
              type: 'string',
              description: 'Leave start date',
            },
            endDate: {
              type: 'string',
              description:
                'Leave end date - defaults to startDate if not provided',
            },
            leaveCategory: {
              type: 'string',
              enum: ['FullLeave', 'HalfLeave'],
              description: 'Full day or half day leave. Defaults to FullLeave.',
            },
            reason: {
              type: 'string',
              description: 'Reason for leave (min 3 characters)',
            },
          },
          required: ['leaveCode', 'startDate'], // Minimal required fields
        },
      },
      {
        name: 'submit_leave_request',
        description:
          'Submit a leave request for approval. Can only be called after creating a request.',
        parameters: {
          type: 'object',
          properties: {
            requestId: {
              type: 'string',
              description: 'RecId of the created leave request',
            },
          },
          required: ['requestId'],
        },
      },
      {
        name: 'get_leave_requests',
        description:
          'Get list of leave requests with optional filters. Use when user asks about "my leaves", "leave history", "pending requests", etc.',
        parameters: {
          type: 'object',
          properties: {
            employeeId: {type: 'string'},
            status: {
              type: 'string',
              enum: ['all', 'draft', 'pending', 'approved', 'rejected'],
              description:
                'Filter by status. Defaults to "all" if not specified.',
            },
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: 50,
              description: 'Number of records to return. Defaults to 20.',
            },
          },
          required: [], // All optional - use defaults
        },
      },
      {
        name: 'validate_leave_request',
        description:
          'Validate if a leave request is valid before creating it. Checks dates, balance, overlaps, etc.',
        parameters: {
          type: 'object',
          properties: {
            employeeId: {type: 'string'},
            leaveCode: {type: 'string'},
            startDate: {type: 'string'},
            endDate: {type: 'string'},
            leaveCategory: {
              type: 'string',
              enum: ['FullLeave', 'HalfLeave'],
            },
          },
          required: ['leaveCode', 'startDate'],
        },
      },
      {
        name: 'navigate_to_screen',
        description:
          'Navigate to a specific screen in the app. Use when user explicitly wants to go to attendance screen or leaves screen.',
        parameters: {
          type: 'object',
          properties: {
            screenName: {
              type: 'string',
              enum: ['CreateAttendanceScreen', 'LeavesListPage', 'ApplyLeave'],
              description: 'The screen to navigate to',
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

  /**
   * Navigation function
   */
  async navigate_to_screen({screenName, message = ''}) {
    // This function doesn't actually execute navigation here
    // It returns a result that will trigger navigation in the chatbot
    return {
      success: true,
      action: 'navigate',
      screenName,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Smart parameter filling from context
   */
  fillParametersFromContext(parameters, userData) {
    const filled = {...parameters};

    // Auto-fill employee ID if missing
    if (!filled.employeeId && userData?.employeeId) {
      filled.employeeId = userData.employeeId;
    }

    // Auto-fill WorkerRecId if needed
    if (!filled.WorkerRecId && userData?.WorkerRecId) {
      filled.WorkerRecId = userData.WorkerRecId;
    }

    // Convert natural language dates to ISO format
    if (filled.startDate) {
      filled.startDate = this.parseFlexibleDate(filled.startDate);
    }

    if (filled.endDate) {
      filled.endDate = this.parseFlexibleDate(filled.endDate);
    } else if (filled.startDate) {
      // Default end date to start date for single-day leaves
      filled.endDate = filled.startDate;
    }

    // Default to today if no start date
    if (!filled.startDate && parameters.startDate !== undefined) {
      filled.startDate = this.todayISO();
    }

    // Default leave category
    if (!filled.leaveCategory && parameters.leaveCategory !== undefined) {
      filled.leaveCategory = 'FullLeave';
    }

    // Default status filter
    if (!filled.status && parameters.status !== undefined) {
      filled.status = 'all';
    }

    // Default limit
    if (!filled.limit && parameters.limit !== undefined) {
      filled.limit = 20;
    }

    return filled;
  }

  /**
   * Parse flexible date formats
   */
  parseFlexibleDate(input) {
    if (!input) return null;

    // Already in ISO format
    if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
      return input.includes('T') ? input : `${input}T12:00:00`;
    }

    const today = new Date();
    const lowerInput = input.toLowerCase().trim();

    // Natural language dates
    if (lowerInput === 'today') {
      return this.formatDateISO(today);
    }

    if (lowerInput === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return this.formatDateISO(tomorrow);
    }

    if (lowerInput === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return this.formatDateISO(yesterday);
    }

    // Handle "next Monday", "next Friday", etc.
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

    // Try standard date parsing
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

  /**
   * 1. Get available leave types with caching
   */
  async get_available_leave_types({employeeId}) {
    try {
      // Check cache first
      const cacheKey = `leave_types_${employeeId}`;
      if (this.apiCache.has(cacheKey)) {
        const cached = this.apiCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) {
          // 5 min cache
          console.log('✅ Using cached leave types');
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
          code: leave.LeaveCode, // e.g., "ANNUAL"
          name: leave.LeaveDescription, // e.g., "Annual Leave"
          description: leave.LeaveDescription, // Alias for compatibility
          id: leave.RecId,
        })),
        // Add mapping for easier lookup
        leaveMap: data.reduce((map, leave) => {
          map[leave.LeaveDescription.toLowerCase()] = leave.LeaveCode;
          map[leave.LeaveCode.toLowerCase()] = leave.LeaveCode;
          return map;
        }, {}),
      };

      // Cache the result
      this.apiCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: 'API_ERROR',
        message: error.message,
        details: 'Failed to fetch leave types from server',
      };
    }
  }

  /**
   * 2. Get leave balance with smart defaults
   */
  async get_leave_balance({employeeId, leaveCode, startDate}) {
    try {
      // Use today if no start date provided
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
        requiredParameters: {
          employeeId: 'Employee ID is required',
          leaveCode: 'Leave type code is required',
        },
      };
    }
  }

  /**
   * 3. Calculate leave days
   */
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
        requiredParameters: {
          employeeId: 'Employee ID is required',
          leaveCode: 'Leave type code is required',
          startDate: 'Start date is required',
        },
      };
    }
  }

  /**
   * 4. Create leave request with progressive parameter collection
   */
  async create_leave_request({
    employeeId,
    leaveCode,
    startDate,
    endDate,
    leaveCategory,
    reason,
  }) {
    try {
      // Validate minimum required parameters
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
          requiredParameters: {
            employeeId: 'Employee ID',
            leaveCode: 'Leave type (e.g., Annual, Sick)',
            startDate: 'Start date (e.g., 2025-01-27 or "tomorrow")',
          },
        };
      }

      // Apply defaults
      const effectiveEndDate = endDate || startDate;
      const effectiveCategory = leaveCategory || 'FullLeave';
      const effectiveReason = reason || 'Leave request';

      // Get leave days and balance
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
          details: {
            daysError: daysResult.error,
            balanceError: balanceResult.error,
          },
        };
      }

      // Create the leave request
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
        RecId: '0',
      };

      const created = await createLeaveRequest({leaveData});

      if (!created?.RecId) {
        return {
          success: false,
          error: 'CREATE_FAILED',
          message: created?.Message || 'Failed to create leave request',
          apiResponse: created,
        };
      }

      return {
        success: true,
        requestId: created.RecId,
        status: 'draft',
        leaveDetails: {
          leaveCode,
          days: daysResult.days,
          balance: balanceResult.balance,
          startDate,
          endDate: effectiveEndDate,
          category: effectiveCategory,
        },
        message: `Leave request created successfully with ID: ${created.RecId}`,
        nextActions: [
          'You can now submit this request for approval',
          'Or you can modify it before submitting',
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: 'API_ERROR',
        message: error.message,
        stack: error.stack,
      };
    }
  }

  /**
   * 5. Submit leave request
   */
  async submit_leave_request({requestId}) {
    try {
      if (!requestId) {
        return {
          success: false,
          error: 'MISSING_PARAMETER',
          message: 'Request ID is required to submit',
          requiredParameters: {
            requestId: 'The RecId of the leave request to submit',
          },
        };
      }

      const result = await SubmitLeaveRequest({recId: requestId});

      const isSuccess =
        result?.IsSuccess === true || result?.IsSuccess === 'true';

      if (!isSuccess) {
        return {
          success: false,
          error: 'SUBMIT_FAILED',
          message: result?.Message || 'Failed to submit leave request',
          apiResponse: result,
        };
      }

      return {
        success: true,
        requestId,
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

  /**
   * 6. Get leave requests with smart filtering
   */
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

      // Status mapping
      const statusMap = {
        draft: ['NotSubmitted', 'Draft'],
        pending: ['Pending', 'Submitted', 'PendingApproval'],
        approved: ['Approved'],
        rejected: ['Rejected'],
      };

      // Filter by status
      let filtered = data;
      if (status !== 'all' && statusMap[status]) {
        filtered = data.filter(leave =>
          statusMap[status].includes(leave.WFStatus),
        );
      }

      // Apply limit
      const limited = filtered.slice(0, limit);

      return {
        success: true,
        requests: limited.map(leave => ({
          id: leave.RecId,
          type: leave.LeaveCode,
          typeName: leave.LeaveDescription,
          status: leave.WFStatus,
          startDate: leave.LeaveStartDate,
          endDate: leave.LeaveEndDate,
          days: leave.LeaveDays,
          reason: leave.Reason,
          requestDate: leave.LeaveReqDate,
        })),
        total: filtered.length,
        showing: limited.length,
        hasMore: filtered.length > limit,
      };
    } catch (error) {
      return {
        success: false,
        error: 'API_ERROR',
        message: error.message,
      };
    }
  }

  /**
   * 7. Validate leave request
   */
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

      // Date validation
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

      // Check balance
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

  /**
   * Resolve leave code from user input
   * This handles fuzzy matching between description and code
   */
  resolveLeaveCode(input, leaveTypesResult) {
    if (!input || !leaveTypesResult) return input;

    // If input is already a code, return as-is
    const leaves = leaveTypesResult.leaves || [];
    const exactCodeMatch = leaves.find(
      leave => leave.code.toLowerCase() === input.toLowerCase(),
    );
    if (exactCodeMatch) return exactCodeMatch.code;

    // Try to match by name/description
    const nameMatch = leaves.find(
      leave =>
        leave.name.toLowerCase().includes(input.toLowerCase()) ||
        input.toLowerCase().includes(leave.name.toLowerCase()),
    );

    if (nameMatch) return nameMatch.code;

    // Use the leaveMap if available
    if (leaveTypesResult.leaveMap) {
      const mappedCode = leaveTypesResult.leaveMap[input.toLowerCase()];
      if (mappedCode) return mappedCode;
    }

    return input; // Return original if no match
  }

  /**
   * Execute function by name with smart parameter handling
   */
  async execute(functionName, parameters, userData = {}) {
    if (typeof this[functionName] !== 'function') {
      return {
        success: false,
        error: 'FUNCTION_NOT_FOUND',
        message: `Function ${functionName} not found`,
        availableFunctions: this.getFunctionDefinitions().map(f => f.name),
      };
    }

    try {
      // Fill parameters from context
      const filledParams = this.fillParametersFromContext(parameters, userData);

      // Special handling for leaveCode parameter
      if (
        filledParams.leaveCode &&
        functionName !== 'get_available_leave_types'
      ) {
        // Get leave types to resolve code
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
      console.log('📥 Original params:', parameters);
      console.log('📤 Filled params:', filledParams);

      return await this[functionName](filledParams);
    } catch (error) {
      console.error(`Error executing ${functionName}:`, error);
      return {
        success: false,
        error: 'EXECUTION_ERROR',
        message: error.message,
        stack: error.stack,
      };
    }
  }
}

export default LeaveService;
