// services/LeaveService.js
/* eslint-disable curly */
/* eslint-disable radix */
/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
/* eslint-disable no-catch-shadow */
/* eslint-disable react-hooks/exhaustive-deps */
import {useState, useCallback, useRef} from 'react';
import {RetrieveLeaveCodes} from '../API/Leaves/LeaveCodes';
import {createLeaveRequest} from '../API/Leaves/CreateLeaveRequest';
import SubmitLeaveRequest from '../API/Leaves/SubmitLeaveRequest';
import DeleteLeaveRequest from '../API/Leaves/deleteLeaveRequest';
import {GetLeaveBalance} from '../API/Leaves/LeaveBalance';
import {GetEmployeeQuota} from '../API/Leaves/GetEmployeeQuota';
import {GetLeaveDays} from '../API/Leaves/GetLeaveDays';
import {RetrieveAllLeaves} from '../API/Leaves/RetrieveAllLeaves';
import {isLeaveWorkflowConfigured} from '../API/Leaves/isLeaveWorkflowEnabled';
import {UpdateLeaveRequest} from '../API/Leaves/UpdateLeaveRequest';

const LeaveService = () => {
  // Refs for data that doesn't need re-renders
  const userContextRef = useRef(null);
  const apiCacheRef = useRef(new Map());
  const workflowConfigRef = useRef(null);

  // State for things that trigger re-renders
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper functions
  const todayISO = useCallback(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00`;
  }, []);

  const formatDateISO = useCallback(date => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00`;
  }, []);

  const parseFlexibleDate = useCallback(
    input => {
      if (!input) return null;

      // Already in ISO format
      if (/^\d{4}-\d{2}-\d{2}T/.test(input)) {
        return input;
      }

      // Date only format
      if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
        return `${input}T12:00:00`;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lowerInput = input.toLowerCase().trim();

      // Handle "today"
      if (lowerInput === 'today') {
        return formatDateISO(today);
      }

      // Handle "tomorrow"
      if (lowerInput === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return formatDateISO(tomorrow);
      }

      // Handle "fortnight" (14 days)
      if (lowerInput === 'fortnight' || lowerInput === 'in a fortnight') {
        const fortnight = new Date(today);
        fortnight.setDate(fortnight.getDate() + 14);
        return formatDateISO(fortnight);
      }

      // Handle "in X days/weeks"
      const inDaysMatch = lowerInput.match(/in\s+(\d+)\s+days?/);
      if (inDaysMatch) {
        const days = parseInt(inDaysMatch[1]);
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + days);
        return formatDateISO(futureDate);
      }

      const inWeeksMatch = lowerInput.match(/in\s+(\d+)\s+weeks?/);
      if (inWeeksMatch) {
        const weeks = parseInt(inWeeksMatch[1]);
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + weeks * 7);
        return formatDateISO(futureDate);
      }

      // Handle "next Monday", "next week", etc.
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
          return formatDateISO(nextDate);
        }

        // Handle "next week"
        if (dayName === 'week') {
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          return formatDateISO(nextWeek);
        }
      }

      // Try standard date parsing
      try {
        const parsed = new Date(input);
        if (!isNaN(parsed.getTime())) {
          return formatDateISO(parsed);
        }
      } catch (e) {
        console.error('Date parsing error:', e);
      }

      return null;
    },
    [formatDateISO],
  );

  const getStatusLabel = useCallback(status => {
    const statusMap = {
      NotSubmitted: 'Draft',
      Draft: 'Draft',
      Approved: 'Approved',
      Cancelled: 'Cancelled',
      Rejected: 'Rejected',
      Submitted: 'Submitted',
      ChangeRequest: 'Change Request',
      PendingCancellation: 'Pending Cancellation',
      Returned: 'Returned',
      PendingApproval: 'Pending Approval',
      PendingComplete: 'Pending Complete',
      WorkflowCompleted: 'Workflow Completed',
      Completed: 'Completed',
      Failed: 'Failed',
    };
    return statusMap[status] || status || 'Draft';
  }, []);

  const isEditableStatus = useCallback(
    status => {
      const statusLabel = getStatusLabel(status);
      return statusLabel === 'Draft';
    },
    [getStatusLabel],
  );

  const isDeletableStatus = useCallback(
    status => {
      return isEditableStatus(status);
    },
    [isEditableStatus],
  );

  const isSubmittableStatus = useCallback(
    status => {
      return isEditableStatus(status);
    },
    [isEditableStatus],
  );

  const getLeaveCategoryCode = useCallback(categoryName => {
    if (!categoryName) return 'FullLeave';

    const normalized = categoryName.toLowerCase().trim();
    if (['fullleave', 'full leave', 'full day leave'].includes(normalized)) {
      return 'FullLeave';
    }
    if (['halfleave', 'half leave', 'half day leave'].includes(normalized)) {
      return 'HalfLeave';
    }
    return 'FullLeave';
  }, []);

  const getLeaveCategoryDisplay = useCallback(categoryCode => {
    return categoryCode === 'FullLeave'
      ? 'Full Day Leave'
      : categoryCode === 'HalfLeave'
      ? 'Half Day Leave'
      : 'Full Day Leave';
  }, []);

  const validateInitialized = useCallback(() => {
    if (!isInitialized || !userContextRef.current) {
      throw new Error('SECURITY_ERROR: Service not initialized');
    }
    return true;
  }, [isInitialized]);

  const validateRecordOwnership = useCallback(record => {
    if (!record || !userContextRef.current) return false;
    const recordEmployeeId = String(
      record.EmployeeId || record.employeeId || '',
    ).trim();
    return recordEmployeeId === userContextRef.current.employeeId;
  }, []);

  const initialize = useCallback(userData => {
    if (!userData) {
      throw new Error('SECURITY_ERROR: User data required');
    }

    const requiredFields = ['employeeId', 'WorkerRecId', 'employeeName'];
    const missingFields = requiredFields.filter(field => !userData[field]);

    if (missingFields.length > 0) {
      throw new Error(
        `SECURITY_ERROR: Missing fields: ${missingFields.join(', ')}`,
      );
    }

    userContextRef.current = {
      employeeId: String(userData.employeeId).trim(),
      WorkerRecId: String(userData.WorkerRecId).trim(),
      employeeName: String(userData.employeeName).trim(),
      legalEntity: userData.legalEntity
        ? String(userData.legalEntity).trim()
        : null,
      company: userData.company ? String(userData.company).trim() : null,
      initializedAt: Date.now(),
    };

    setIsInitialized(true);
    setError(null);
    // console.log(
    //   '✅ LeaveService initialized:',
    //   userContextRef.current.employeeId,
    // );
  }, []);

  const enforceUserContext = useCallback(
    (parameters = {}) => {
      validateInitialized();

      const userContext = userContextRef.current;
      const securedParams = {
        employeeId: userContext.employeeId,
        WorkerRecId: userContext.WorkerRecId,
        employeeName: userContext.employeeName,
      };

      if (userContext.legalEntity) {
        securedParams.legalEntity = userContext.legalEntity;
      }
      if (userContext.company) {
        securedParams.company = userContext.company;
      }

      const identityFields = [
        'employeeId',
        'WorkerRecId',
        'employeeName',
        'legalEntity',
        'company',
      ];
      Object.keys(parameters).forEach(key => {
        if (!identityFields.includes(key)) {
          securedParams[key] = parameters[key];
        }
      });

      // Date parsing with flexible input
      if (securedParams.startDate) {
        securedParams.startDate = parseFlexibleDate(securedParams.startDate);
      }
      if (securedParams.endDate) {
        securedParams.endDate = parseFlexibleDate(securedParams.endDate);
      } else if (securedParams.startDate) {
        securedParams.endDate = securedParams.startDate;
      }

      // Smart defaults
      if (!securedParams.startDate && parameters.startDate === undefined) {
        securedParams.startDate = todayISO();
      }
      if (
        !securedParams.leaveCategory &&
        parameters.leaveCategory === undefined
      ) {
        securedParams.leaveCategory = 'FullLeave';
      }
      if (!securedParams.status && parameters.status === undefined) {
        securedParams.status = 'all';
      }
      if (!securedParams.limit && parameters.limit === undefined) {
        securedParams.limit = 20;
      }

      return securedParams;
    },
    [validateInitialized, parseFlexibleDate, todayISO],
  );

  const validateLeaveRequestData = useCallback(
    (params, options = {}) => {
      const {skipBalanceCheck = false, isUpdate = false} = options;
      const errors = [];
      const warnings = [];

      // 1. REQUIRED FIELDS VALIDATION
      if (!params.leaveCode) {
        errors.push({
          field: 'leaveCode',
          code: 'REQUIRED',
          message: 'Leave Code is required',
        });
      }

      if (!params.startDate) {
        errors.push({
          field: 'startDate',
          code: 'REQUIRED',
          message: 'Leave Start Date is required',
        });
      }

      if (!params.endDate) {
        errors.push({
          field: 'endDate',
          code: 'REQUIRED',
          message: 'Leave End Date is required',
        });
      }

      // Stop if required fields missing
      if (errors.length > 0) {
        return {valid: false, errors, warnings, canProceed: false};
      }

      // 2. DATE VALIDATION AND PARSING
      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);

      if (isNaN(startDate.getTime())) {
        errors.push({
          field: 'startDate',
          code: 'INVALID_DATE',
          message: 'Invalid start date format',
        });
      }

      if (isNaN(endDate.getTime())) {
        errors.push({
          field: 'endDate',
          code: 'INVALID_DATE',
          message: 'Invalid end date format',
        });
      }

      // Stop if dates are invalid
      if (errors.some(e => e.code === 'INVALID_DATE')) {
        return {valid: false, errors, warnings, canProceed: false};
      }

      // 3. DATE RANGE VALIDATION (Start <= End)
      if (startDate > endDate) {
        errors.push({
          field: 'dates',
          code: 'START_AFTER_END',
          message: 'Start date cannot be after end date',
        });
      }

      // 4. HALF-DAY VALIDATION (Critical Business Rule)
      const leaveCategory = params.leaveCategory || 'FullLeave';
      const categoryCode = getLeaveCategoryCode(leaveCategory);

      if (
        categoryCode === 'HalfLeave' &&
        startDate.toDateString() !== endDate.toDateString()
      ) {
        errors.push({
          field: 'leaveCategory',
          code: 'HALF_DAY_MULTIPLE_DATES',
          message: 'Half day leave must be for a single day only',
        });
      }

      // 5. PAST DATE WARNING (Business Policy)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        warnings.push({
          field: 'startDate',
          code: 'PAST_DATE',
          message: 'Leave start date is in the past',
          severity: 'medium',
        });
      }

      // 6. LEAVE DAYS VALIDATION
      if (
        params.leaveDays !== undefined &&
        params.leaveDays !== null &&
        params.leaveDays !== ''
      ) {
        const days = parseFloat(params.leaveDays);
        if (isNaN(days) || days <= 0) {
          errors.push({
            field: 'leaveDays',
            code: 'INVALID_DAYS',
            message: 'Leave days must be greater than 0',
          });
        }

        // Half day should be exactly 0.5
        if (categoryCode === 'HalfLeave' && days !== 0.5) {
          warnings.push({
            field: 'leaveDays',
            code: 'HALF_DAY_MISMATCH',
            message: `Half day leave should be 0.5 days, but calculated as ${days}`,
            severity: 'high',
          });
        }
      }

      // 7. REASON VALIDATION (Optional but recommended for long leaves)
      if (!params.reason || params.reason.trim() === '') {
        const dayDiff =
          Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        if (dayDiff > 3) {
          warnings.push({
            field: 'reason',
            code: 'REASON_RECOMMENDED',
            message: 'Reason is recommended for leaves longer than 3 days',
            severity: 'low',
          });
        }
      }

      const isValid = errors.length === 0;

      return {
        valid: isValid,
        errors,
        warnings,
        canProceed: isValid,
        details: {
          categoryCode,
          startDate: params.startDate,
          endDate: params.endDate,
        },
      };
    },
    [getLeaveCategoryCode],
  );

  const validateLeaveBalance = useCallback(
    async (leaveCode, startDate, endDate, days) => {
      try {
        const balanceResult = await get_leave_balance({
          leaveCode,
          startDate,
        });

        if (!balanceResult.success) {
          return {
            sufficient: false,
            message: 'Could not fetch leave balance',
            available: 0,
            requested: days || 0,
          };
        }

        const daysRequired = parseFloat(days) || 0;
        const availableBalance = parseFloat(balanceResult.balance) || 0;
        const availableQuota = parseFloat(balanceResult.quota) || 0;
        const eligibility = Math.max(availableBalance, availableQuota);

        if (eligibility < daysRequired) {
          return {
            sufficient: false,
            message: `Insufficient balance. Available: ${eligibility}, Requested: ${daysRequired}`,
            available: eligibility,
            requested: daysRequired,
            balance: availableBalance,
            quota: availableQuota,
          };
        }

        return {
          sufficient: true,
          message: 'Balance is sufficient',
          available: eligibility,
          requested: daysRequired,
          balance: availableBalance,
          quota: availableQuota,
        };
      } catch (error) {
        console.error('❌ validateLeaveBalance error:', error);
        return {
          sufficient: false,
          message: 'Error validating balance: ' + error.message,
          available: 0,
          requested: days || 0,
          error: error.message,
        };
      }
    },
    [],
  );

  const validateLeaveAction = useCallback(
    (leaveRequest, action) => {
      // 1. OWNERSHIP VALIDATION (Security)
      if (!validateRecordOwnership(leaveRequest)) {
        return {
          canPerform: false,
          reason: `You can only ${action} your own leave requests`,
          actionAllowed: false,
        };
      }

      const status = leaveRequest.WFStatus || leaveRequest.status || '';
      const statusLabel = getStatusLabel(status);

      // 2. ACTION-SPECIFIC VALIDATIONS
      switch (action.toLowerCase()) {
        case 'edit':
          if (!isEditableStatus(status)) {
            return {
              canPerform: false,
              reason: `You can only edit draft leave requests. Current status: ${statusLabel}`,
              actionAllowed: false,
              currentStatus: statusLabel,
            };
          }
          break;

        case 'delete':
          if (!isDeletableStatus(status)) {
            return {
              canPerform: false,
              reason: `You can only delete draft leave requests. Current status: ${statusLabel}`,
              actionAllowed: false,
              currentStatus: statusLabel,
            };
          }
          break;

        case 'submit':
          if (!isSubmittableStatus(status)) {
            return {
              canPerform: false,
              reason: `Only draft requests can be submitted. Current status: ${statusLabel}`,
              actionAllowed: false,
              currentStatus: statusLabel,
            };
          }
          break;

        case 'view':
          return {
            canPerform: true,
            reason: 'View allowed',
            actionAllowed: true,
          };

        default:
          return {
            canPerform: false,
            reason: `Unknown action: ${action}`,
            actionAllowed: false,
          };
      }

      return {
        canPerform: true,
        reason: 'Action allowed',
        actionAllowed: true,
        currentStatus: statusLabel,
      };
    },
    [
      validateRecordOwnership,
      getStatusLabel,
      isEditableStatus,
      isDeletableStatus,
      isSubmittableStatus,
    ],
  );

  const getAvailableActions = useCallback(
    leaveRequest => {
      const status = leaveRequest.WFStatus || leaveRequest.status || '';
      const isDraft = isEditableStatus(status);
      const actions = [];

      if (isDraft) {
        actions.push('edit', 'delete', 'submit');
      }

      actions.push('view');

      return {
        actions,
        isDraft,
        status: getStatusLabel(status),
        canEdit: isDraft,
        canDelete: isDraft,
        canSubmit: isDraft,
      };
    },
    [isEditableStatus, getStatusLabel],
  );

  const checkWorkflowConfiguration = useCallback(async () => {
    validateInitialized();

    try {
      const cacheKey = 'workflow_config';
      if (apiCacheRef.current.has(cacheKey)) {
        const cached = apiCacheRef.current.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) {
          return cached.data;
        }
      }

      const result = await isLeaveWorkflowConfigured();
      const isConfigured = result === true || result === 'true' || result === 1;

      workflowConfigRef.current = {
        enabled: isConfigured,
        checkedAt: new Date().toISOString(),
      };

      const configData = {
        success: true,
        isWorkflowConfigured: isConfigured,
        timestamp: new Date().toISOString(),
      };

      apiCacheRef.current.set(cacheKey, {
        data: configData,
        timestamp: Date.now(),
      });
      return configData;
    } catch (error) {
      console.error('❌ checkWorkflowConfiguration error:', error);
      return {
        success: false,
        isWorkflowConfigured: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }, [validateInitialized]);

  const validateLeaveRequestComplete = useCallback(
    async (params, options = {}) => {
      const basicValidation = validateLeaveRequestData(params, options);

      if (!basicValidation.valid) {
        return {
          ...basicValidation,
          success: false,
          error: 'VALIDATION_FAILED',
        };
      }

      if (options.skipBalanceCheck) {
        return {
          ...basicValidation,
          success: true,
          balanceCheck: null,
        };
      }

      try {
        const effectiveEndDate = params.endDate || params.startDate;

        const daysResult = await calculate_leave_days({
          leaveCode: params.leaveCode,
          startDate: params.startDate,
          endDate: effectiveEndDate,
        });

        if (!daysResult.success) {
          return {
            ...basicValidation,
            success: false,
            error: 'CALCULATION_ERROR',
            message: 'Failed to calculate leave days',
          };
        }

        const balanceCheck = await validateLeaveBalance(
          params.leaveCode,
          params.startDate,
          effectiveEndDate,
          daysResult.days,
        );

        if (!balanceCheck.sufficient) {
          basicValidation.warnings.push({
            field: 'balance',
            code: 'INSUFFICIENT_BALANCE',
            message: balanceCheck.message,
            severity: 'high',
            data: {
              available: balanceCheck.available,
              requested: balanceCheck.requested,
            },
          });

          if (options.strictBalance) {
            basicValidation.errors.push({
              field: 'balance',
              code: 'INSUFFICIENT_BALANCE',
              message: balanceCheck.message,
            });
            basicValidation.valid = false;
            basicValidation.canProceed = false;
          }
        }

        return {
          ...basicValidation,
          success: basicValidation.valid,
          balanceCheck,
          calculatedDays: daysResult.days,
        };
      } catch (error) {
        console.error('❌ validateLeaveRequestComplete error:', error);
        return {
          ...basicValidation,
          success: false,
          error: 'VALIDATION_ERROR',
          message: error.message,
        };
      }
    },
    [validateLeaveRequestData, validateLeaveBalance],
  );

  // API Functions
  const get_available_leave_types = useCallback(
    async (params = {}) => {
      validateInitialized();

      try {
        const cacheKey = `leave_types_${userContextRef.current.employeeId}`;

        if (apiCacheRef.current.has(cacheKey)) {
          const cached = apiCacheRef.current.get(cacheKey);
          if (Date.now() - cached.timestamp < 300000) {
            return cached.data;
          }
        }

        const data = await RetrieveLeaveCodes({
          employeeId: userContextRef.current.employeeId,
        });

        if (!Array.isArray(data) || data.length === 0) {
          return {
            success: false,
            error: 'NO_LEAVE_TYPES',
            message: 'No leave types available',
          };
        }

        const result = {
          success: true,
          employeeId: userContextRef.current.employeeId,
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
          timestamp: new Date().toISOString(),
        };

        apiCacheRef.current.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });
        return result;
      } catch (error) {
        console.error('❌ get_available_leave_types error:', error);
        return {
          success: false,
          error: 'API_ERROR',
          message: error.message,
        };
      }
    },
    [validateInitialized],
  );

  const get_leave_balance = useCallback(
    async params => {
      validateInitialized();

      try {
        const secured = enforceUserContext(params);
        const effectiveStartDate = secured.startDate || todayISO();

        const [balance, quota] = await Promise.all([
          GetLeaveBalance({
            employeeId: userContextRef.current.employeeId,
            leaveCode: secured.leaveCode,
            leaveStartDate: effectiveStartDate,
            leaveRequestId: '0',
          }),
          GetEmployeeQuota({
            employeeId: userContextRef.current.employeeId,
            leaveCode: secured.leaveCode,
            leaveStartDate: effectiveStartDate,
            leaveRecId: '0',
          }),
        ]);

        const balanceNum = parseFloat(balance || 0);
        const quotaNum = parseFloat(quota || 0);

        return {
          success: true,
          employeeId: userContextRef.current.employeeId,
          leaveCode: secured.leaveCode,
          balance: balanceNum,
          quota: quotaNum,
          eligibility: Math.max(balanceNum, quotaNum),
          asOfDate: effectiveStartDate,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('❌ get_leave_balance error:', error);
        return {
          success: false,
          error: 'API_ERROR',
          message: error.message,
        };
      }
    },
    [validateInitialized, enforceUserContext, todayISO],
  );

  const calculate_leave_days = useCallback(
    async params => {
      validateInitialized();

      try {
        const secured = enforceUserContext(params);
        const effectiveEndDate = secured.endDate || secured.startDate;

        const days = await GetLeaveDays({
          employeeId: userContextRef.current.employeeId,
          leaveCode: secured.leaveCode,
          leaveStartDate: secured.startDate,
          leaveEndDate: effectiveEndDate,
        });

        return {
          success: true,
          employeeId: userContextRef.current.employeeId,
          days: parseFloat(days || 0),
          startDate: secured.startDate,
          endDate: effectiveEndDate,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('❌ calculate_leave_days error:', error);
        return {
          success: false,
          error: 'API_ERROR',
          message: error.message,
        };
      }
    },
    [validateInitialized, enforceUserContext],
  );

  // MISSING FUNCTIONS FROM PREVIOUS VERSION
  const validate_leave_request = useCallback(
    async params => {
      return await validateLeaveRequestComplete(params, {
        skipBalanceCheck: params.skipBalanceCheck,
      });
    },
    [validateLeaveRequestComplete],
  );

  const create_leave_request = useCallback(
    async params => {
      validateInitialized();
      setLoading(true);
      setError(null);

      try {
        const secured = enforceUserContext(params);

        const validation = await validateLeaveRequestComplete(secured, {
          skipBalanceCheck: params.skipBalanceCheck,
        });

        if (!validation.valid) {
          return {
            success: false,
            error: 'VALIDATION_ERROR',
            message: validation.errors.map(e => e.message).join('; '),
            errors: validation.errors,
            warnings: validation.warnings,
            validationDetails: validation,
          };
        }

        const effectiveEndDate = secured.endDate || secured.startDate;
        const effectiveCategory = getLeaveCategoryCode(secured.leaveCategory);
        const effectiveReason = secured.reason || 'Leave request';
        const days = validation.calculatedDays || 0;
        const balanceInfo = validation.balanceCheck || {
          balance: 0,
          quota: 0,
          eligibility: 0,
        };

        const leaveData = {
          LeaveCode: secured.leaveCode,
          LeaveDays: days.toString(),
          LeaveCategory: effectiveCategory,
          Balance: balanceInfo.balance.toString(),
          Eligibility: balanceInfo.eligibility.toString(),
          Quota: balanceInfo.quota.toString(),
          LeaveStartDate: secured.startDate,
          LeaveEndDate: effectiveEndDate,
          LeaveReqDate: todayISO(),
          Reason: effectiveReason,
          EmployeeId: userContextRef.current.employeeId,
          EmployeeName: userContextRef.current.employeeName,
          WorkerRecId: userContextRef.current.WorkerRecId,
          RecId: '0',
          ...(userContextRef.current.legalEntity && {
            LegalEntity: userContextRef.current.legalEntity,
          }),
          ...(userContextRef.current.company && {
            Company: userContextRef.current.company,
          }),
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
          recId: created.RecId,
          employeeId: userContextRef.current.employeeId,
          status: 'Draft',
          leaveDetails: {
            leaveCode: secured.leaveCode,
            days: days,
            balance: balanceInfo.balance,
            quota: balanceInfo.quota,
            eligibility: balanceInfo.eligibility,
            startDate: secured.startDate,
            endDate: effectiveEndDate,
            category: effectiveCategory,
            categoryDisplay: getLeaveCategoryDisplay(effectiveCategory),
          },
          warnings: validation.warnings,
          balanceWarning: balanceInfo.sufficient ? null : balanceInfo.message,
          message: `Leave request created successfully (ID: ${created.RecId})`,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('❌ create_leave_request error:', error);
        setError(error.message);
        return {
          success: false,
          error: 'API_ERROR',
          message: error.message,
        };
      } finally {
        setLoading(false);
      }
    },
    [
      validateInitialized,
      enforceUserContext,
      validateLeaveRequestComplete,
      getLeaveCategoryCode,
      getLeaveCategoryDisplay,
      todayISO,
    ],
  );

  const update_leave_request = useCallback(
    async params => {
      validateInitialized();
      setLoading(true);
      setError(null);

      try {
        if (!params.requestId) {
          return {
            success: false,
            error: 'MISSING_PARAMETER',
            message: 'Request ID (recId) is required for update',
          };
        }

        // Check if request exists and is editable
        const existingRequest = await get_leave_details({
          requestId: params.requestId,
        });

        if (!existingRequest.success) {
          return existingRequest;
        }

        const actionValidation = validateLeaveAction(
          existingRequest.request,
          'edit',
        );
        if (!actionValidation.canPerform) {
          return {
            success: false,
            error: 'ACTION_NOT_ALLOWED',
            message: actionValidation.reason,
          };
        }

        const secured = enforceUserContext(params);

        // Validate the new data
        const validation = await validateLeaveRequestComplete(secured, {
          isUpdate: true,
          skipBalanceCheck: params.skipBalanceCheck,
        });

        if (!validation.valid) {
          return {
            success: false,
            error: 'VALIDATION_ERROR',
            message: validation.errors.map(e => e.message).join('; '),
            errors: validation.errors,
            warnings: validation.warnings,
          };
        }

        const effectiveEndDate = secured.endDate || secured.startDate;
        const effectiveCategory = getLeaveCategoryCode(secured.leaveCategory);
        const days = validation.calculatedDays || 0;
        const balanceInfo =
          validation.balanceCheck || existingRequest.request.balanceInfo;

        const leaveData = {
          LeaveCode: secured.leaveCode,
          LeaveDays: days.toString(),
          LeaveCategory: effectiveCategory,
          Balance: balanceInfo.balance.toString(),
          Eligibility: balanceInfo.eligibility.toString(),
          Quota: balanceInfo.quota.toString(),
          LeaveStartDate: secured.startDate,
          LeaveEndDate: effectiveEndDate,
          LeaveReqDate: existingRequest.request.requestDate || todayISO(),
          Reason: secured.reason || existingRequest.request.reason || '',
          EmployeeId: userContextRef.current.employeeId,
          EmployeeName: userContextRef.current.employeeName,
          WorkerRecId: userContextRef.current.WorkerRecId,
          RecId: params.requestId,
          LeaveRequestId: existingRequest.request.leaveRequestId || '',
        };

        const updated = await UpdateLeaveRequest({leaveData});

        const isSuccess =
          updated?.IsSuccess === true || updated?.IsSuccess === 'true';

        if (!isSuccess) {
          return {
            success: false,
            error: 'UPDATE_FAILED',
            message: updated?.Message || 'Failed to update leave request',
            apiResponse: updated,
          };
        }

        return {
          success: true,
          requestId: params.requestId,
          recId: params.requestId,
          employeeId: userContextRef.current.employeeId,
          status: 'Draft',
          message: `Leave request updated successfully (ID: ${params.requestId})`,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('❌ update_leave_request error:', error);
        setError(error.message);
        return {
          success: false,
          error: 'API_ERROR',
          message: error.message,
        };
      } finally {
        setLoading(false);
      }
    },
    [
      validateInitialized,
      validateLeaveAction,
      enforceUserContext,
      validateLeaveRequestComplete,
      getLeaveCategoryCode,
      todayISO,
    ],
  );

  const submit_leave_request = useCallback(
    async params => {
      validateInitialized();
      setLoading(true);
      setError(null);

      try {
        if (!params.requestId) {
          return {
            success: false,
            error: 'MISSING_PARAMETER',
            message: 'Request ID required',
          };
        }

        const leaveDetails = await get_leave_details({
          requestId: params.requestId,
        });

        if (!leaveDetails.success) {
          return leaveDetails;
        }

        const actionValidation = validateLeaveAction(
          leaveDetails.request,
          'submit',
        );
        if (!actionValidation.canPerform) {
          return {
            success: false,
            error: 'ACTION_NOT_ALLOWED',
            message: actionValidation.reason,
            currentStatus: actionValidation.currentStatus,
          };
        }

        const result = await SubmitLeaveRequest({
          recId: String(params.requestId),
        });

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
          requestId: String(params.requestId),
          employeeId: userContextRef.current.employeeId,
          previousStatus: 'Draft',
          status: 'Submitted',
          message: 'Leave request submitted successfully',
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('❌ submit_leave_request error:', error);
        setError(error.message);
        return {
          success: false,
          error: 'API_ERROR',
          message: error.message,
        };
      } finally {
        setLoading(false);
      }
    },
    [validateInitialized, validateLeaveAction],
  );

  const delete_leave_request = useCallback(
    async params => {
      validateInitialized();
      setLoading(true);
      setError(null);

      try {
        if (!params.requestId) {
          return {
            success: false,
            error: 'MISSING_PARAMETER',
            message: 'Request ID required',
          };
        }

        const leaveDetails = await get_leave_details({
          requestId: params.requestId,
        });

        if (!leaveDetails.success) {
          return leaveDetails;
        }

        const actionValidation = validateLeaveAction(
          leaveDetails.request,
          'delete',
        );
        if (!actionValidation.canPerform) {
          return {
            success: false,
            error: 'ACTION_NOT_ALLOWED',
            message: actionValidation.reason,
            currentStatus: actionValidation.currentStatus,
          };
        }

        const ids = Array.isArray(params.requestId)
          ? params.requestId.map(String)
          : [String(params.requestId)];

        await DeleteLeaveRequest({recordsRecId: ids});

        return {
          success: true,
          deletedRecIds: ids,
          employeeId: userContextRef.current.employeeId,
          message: 'Leave request deleted successfully',
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('❌ delete_leave_request error:', error);
        setError(error.message);
        return {
          success: false,
          error: 'DELETE_FAILED',
          message: error.message,
        };
      } finally {
        setLoading(false);
      }
    },
    [validateInitialized, validateLeaveAction],
  );

  const get_leave_requests = useCallback(
    async (params = {}) => {
      validateInitialized();
      setLoading(true);
      setError(null);

      try {
        const secured = enforceUserContext(params);
        const data = await RetrieveAllLeaves({
          employeeId: userContextRef.current.employeeId,
        });

        if (!Array.isArray(data)) {
          return {
            success: false,
            error: 'NO_DATA',
            message: 'No leave requests found',
          };
        }

        // Filter by ownership
        const userRecords = data.filter(leave =>
          validateRecordOwnership(leave),
        );

        // Status mapping for filtering
        const statusMap = {
          draft: ['NotSubmitted', 'Draft', 'Not Submitted'],
          pending: [
            'Pending',
            'Submitted',
            'PendingApproval',
            'Pending Approval',
            'ChangeRequest',
            'PendingCancellation',
          ],
          approved: ['Approved'],
          rejected: ['Rejected', 'Returned'],
          submitted: ['Submitted', 'PendingApproval'],
        };

        let filtered = userRecords;
        if (secured.status !== 'all' && statusMap[secured.status]) {
          filtered = userRecords.filter(leave =>
            statusMap[secured.status].includes(leave.WFStatus),
          );
        }

        const limited = filtered.slice(0, secured.limit);

        return {
          success: true,
          employeeId: userContextRef.current.employeeId,
          requests: limited.map(leave => {
            const statusLabel = getStatusLabel(leave.WFStatus);
            const actions = getAvailableActions(leave);

            return {
              recId: leave.RecId,
              requestId: leave.RecId,
              displayId: leave.LeaveReqId,
              type: leave.LeaveCode,
              typeName: leave.LeaveDescription,
              status: leave.WFStatus,
              statusLabel: statusLabel,
              isDraft: actions.isDraft,
              canEdit: actions.canEdit,
              canDelete: actions.canDelete,
              canSubmit: actions.canSubmit,
              startDate: leave.LeaveStartDate,
              endDate: leave.LeaveEndDate,
              requestDate: leave.LeaveReqDate,
              days: leave.LeaveDays,
              category: leave.LeaveCategory,
              categoryDisplay: getLeaveCategoryDisplay(leave.LeaveCategory),
              reason: leave.Reason,
              balance: leave.Balance,
              quota: leave.Quota,
              eligibility: leave.Eligibility,
              employeeId: leave.EmployeeId,
              employeeName: leave.EmployeeName,
              WorkerRecId: leave.WorkerRecId,
              rawData: leave,
            };
          }),
          total: filtered.length,
          showing: limited.length,
          hasMore: filtered.length > secured.limit,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('❌ get_leave_requests error:', error);
        setError(error.message);
        return {
          success: false,
          error: 'API_ERROR',
          message: error.message,
        };
      } finally {
        setLoading(false);
      }
    },
    [
      validateInitialized,
      enforceUserContext,
      validateRecordOwnership,
      getStatusLabel,
      getAvailableActions,
      getLeaveCategoryDisplay,
    ],
  );

  const get_leave_details = useCallback(
    async params => {
      validateInitialized();
      setLoading(true);
      setError(null);

      try {
        if (!params.requestId) {
          return {
            success: false,
            error: 'MISSING_PARAMETER',
            message: 'Request ID required',
          };
        }

        const allRequests = await get_leave_requests({
          status: 'all',
          limit: 1000,
        });

        if (!allRequests.success) {
          return allRequests;
        }

        const request = allRequests.requests.find(
          r => String(r.recId) === String(params.requestId),
        );

        if (!request) {
          return {
            success: false,
            error: 'NOT_FOUND',
            message: `Leave request with ID ${params.requestId} not found`,
          };
        }

        // Verify ownership
        if (!validateRecordOwnership(request.rawData)) {
          return {
            success: false,
            error: 'ACCESS_DENIED',
            message: 'You do not have permission to view this leave request',
          };
        }

        const actions = getAvailableActions(request.rawData);

        return {
          success: true,
          request: {
            ...request,
            availableActions: actions,
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error('❌ get_leave_details error:', error);
        setError(error.message);
        return {
          success: false,
          error: 'API_ERROR',
          message: error.message,
        };
      } finally {
        setLoading(false);
      }
    },
    [validateInitialized, validateRecordOwnership, getAvailableActions],
  );

  const check_workflow_status = useCallback(async () => {
    return await checkWorkflowConfiguration();
  }, [checkWorkflowConfiguration]);

  const get_leave_summary = useCallback(async () => {
    validateInitialized();
    setLoading(true);
    setError(null);

    try {
      const allRequests = await get_leave_requests({
        status: 'all',
        limit: 1000,
      });

      if (!allRequests.success) {
        return allRequests;
      }

      const summary = {
        total: allRequests.requests.length,
        draft: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        byType: {},
      };

      allRequests.requests.forEach(req => {
        const status = req.statusLabel.toLowerCase();
        if (status === 'draft') summary.draft++;
        else if (
          [
            'submitted',
            'pending approval',
            'pending',
            'change request',
          ].includes(status)
        )
          summary.pending++;
        else if (status === 'approved') summary.approved++;
        else if (status === 'rejected') summary.rejected++;

        // Count by type
        if (!summary.byType[req.type]) {
          summary.byType[req.type] = {count: 0, totalDays: 0};
        }
        summary.byType[req.type].count++;
        summary.byType[req.type].totalDays += parseFloat(req.days) || 0;
      });

      return {
        success: true,
        employeeId: userContextRef.current.employeeId,
        summary,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ get_leave_summary error:', error);
      setError(error.message);
      return {
        success: false,
        error: 'API_ERROR',
        message: error.message,
      };
    } finally {
      setLoading(false);
    }
  }, [validateInitialized]);

  const resolveLeaveCode = useCallback((input, leaveTypesResult) => {
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
  }, []);

  // Main execute function
  const execute = useCallback(
    async (functionName, parameters = {}) => {
      setLoading(true);
      setError(null);

      try {
        // Define all available functions
        const availableFunctions = {
          get_available_leave_types,
          get_leave_balance,
          calculate_leave_days,
          validate_leave_request,
          create_leave_request,
          update_leave_request,
          submit_leave_request,
          delete_leave_request,
          get_leave_requests,
          get_leave_details,
          check_workflow_status,
          get_leave_summary,
        };

        if (typeof availableFunctions[functionName] !== 'function') {
          return {
            success: false,
            error: 'FUNCTION_NOT_FOUND',
            message: `Function ${functionName} not found`,
          };
        }

        let processedParams = {...parameters};

        // Resolve leave code if provided (except for get_available_leave_types)
        if (
          processedParams.leaveCode &&
          functionName !== 'get_available_leave_types'
        ) {
          const leaveTypesResult = await get_available_leave_types();
          if (leaveTypesResult.success) {
            const resolvedCode = resolveLeaveCode(
              processedParams.leaveCode,
              leaveTypesResult,
            );
            processedParams.leaveCode = resolvedCode;
          }
        }

        // console.log('🔧 Executing:', functionName);
        // console.log('👤 User:', userContextRef.current?.employeeId);

        const result = await availableFunctions[functionName](processedParams);
        return result;
      } catch (error) {
        console.error(`Error executing ${functionName}:`, error);
        setError(error.message);
        return {
          success: false,
          error: 'EXECUTION_ERROR',
          message: error.message,
        };
      } finally {
        setLoading(false);
      }
    },
    [get_available_leave_types, resolveLeaveCode],
  );

  // Get function definitions for AI
  const getFunctionDefinitions = useCallback(() => {
    return [
      {
        name: 'get_available_leave_types',
        description: 'Get all available leave types for the user',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_leave_balance',
        description:
          'Check remaining balance, quota, and eligibility for a specific leave type',
        parameters: {
          type: 'object',
          properties: {
            leaveCode: {
              type: 'string',
              description: 'Leave type code (e.g., "AL" for Annual Leave)',
            },
            startDate: {
              type: 'string',
              description:
                'Optional date in format YYYY-MM-DD or natural language like "today", "tomorrow", "next monday". Defaults to today.',
            },
          },
          required: ['leaveCode'],
        },
      },
      {
        name: 'calculate_leave_days',
        description:
          'Calculate number of leave days between start and end dates. Automatically considers weekends and holidays based on leave code.',
        parameters: {
          type: 'object',
          properties: {
            leaveCode: {
              type: 'string',
              description: 'Leave type code',
            },
            startDate: {
              type: 'string',
              description: 'Start date (YYYY-MM-DD or natural language)',
            },
            endDate: {
              type: 'string',
              description:
                'End date (YYYY-MM-DD or natural language). Defaults to start date if not provided.',
            },
          },
          required: ['leaveCode', 'startDate'],
        },
      },
      {
        name: 'validate_leave_request',
        description:
          'Comprehensive validation of leave request data including dates, balance, half-day rules, and business policies. Use this before creating a leave request.',
        parameters: {
          type: 'object',
          properties: {
            leaveCode: {
              type: 'string',
              description: 'Leave type code',
            },
            startDate: {
              type: 'string',
              description:
                'Start date (YYYY-MM-DD or natural language like "today", "tomorrow")',
            },
            endDate: {
              type: 'string',
              description: 'End date (optional, defaults to start date)',
            },
            leaveCategory: {
              type: 'string',
              enum: [
                'FullLeave',
                'HalfLeave',
                'Full Day Leave',
                'Half Day Leave',
              ],
              description: 'Leave category. Half day must be single day only.',
            },
            reason: {
              type: 'string',
              description: 'Reason for leave (recommended for leaves > 3 days)',
            },
          },
          required: ['leaveCode', 'startDate'],
        },
      },
      {
        name: 'create_leave_request',
        description:
          'Create a new leave request. Automatically validates data and checks balance. Returns the created request ID.',
        parameters: {
          type: 'object',
          properties: {
            leaveCode: {type: 'string'},
            startDate: {type: 'string'},
            endDate: {type: 'string'},
            leaveCategory: {
              type: 'string',
              enum: [
                'FullLeave',
                'HalfLeave',
                'Full Day Leave',
                'Half Day Leave',
              ],
            },
            reason: {type: 'string'},
            skipBalanceCheck: {
              type: 'boolean',
              description:
                'Set to true to skip balance validation (not recommended)',
              default: false,
            },
          },
          required: ['leaveCode', 'startDate'],
        },
      },
      {
        name: 'update_leave_request',
        description:
          'Update an existing draft leave request. Cannot update submitted or approved requests.',
        parameters: {
          type: 'object',
          properties: {
            requestId: {
              type: 'string',
              description: 'The RecId of the leave request to update',
            },
            leaveCode: {type: 'string'},
            startDate: {type: 'string'},
            endDate: {type: 'string'},
            leaveCategory: {type: 'string'},
            reason: {type: 'string'},
          },
          required: ['requestId', 'leaveCode', 'startDate'],
        },
      },
      {
        name: 'submit_leave_request',
        description:
          'Submit a draft leave request for approval. Only draft requests can be submitted.',
        parameters: {
          type: 'object',
          properties: {
            requestId: {
              type: 'string',
              description: 'The RecId of the leave request',
            },
          },
          required: ['requestId'],
        },
      },
      {
        name: 'delete_leave_request',
        description:
          'Delete/cancel a leave request. Only draft requests can be deleted.',
        parameters: {
          type: 'object',
          properties: {
            requestId: {type: 'string'},
          },
          required: ['requestId'],
        },
      },
      {
        name: 'get_leave_requests',
        description: 'Get list of leave requests with optional filtering',
        parameters: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: [
                'all',
                'draft',
                'pending',
                'approved',
                'rejected',
                'submitted',
              ],
              default: 'all',
            },
            limit: {type: 'integer', default: 20},
          },
          required: [],
        },
      },
      {
        name: 'get_leave_details',
        description:
          'Get detailed information about a specific leave request including available actions',
        parameters: {
          type: 'object',
          properties: {
            requestId: {type: 'string'},
          },
          required: ['requestId'],
        },
      },
      {
        name: 'check_workflow_status',
        description: 'Check if leave workflow is configured in the system',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_leave_summary',
        description: 'Get summary of leaves including counts by status',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ];
  }, []);

  // Export all functions and state
  return {
    // State
    isInitialized,
    loading,
    error,

    // Core functions
    initialize,
    validateInitialized,

    // API Functions
    get_available_leave_types,
    get_leave_balance,
    calculate_leave_days,
    validate_leave_request,
    create_leave_request,
    update_leave_request,
    submit_leave_request,
    delete_leave_request,
    get_leave_requests,
    get_leave_details,
    check_workflow_status,
    get_leave_summary,

    // Helper functions
    validateLeaveRequestData,
    validateLeaveRequestComplete,
    validateLeaveAction,
    getAvailableActions,
    checkWorkflowConfiguration,

    // Main execute
    execute,
    getFunctionDefinitions,

    // Constants and helpers
    getStatusLabel,
    getLeaveCategoryCode,
    getLeaveCategoryDisplay,
  };
};

export default LeaveService;
