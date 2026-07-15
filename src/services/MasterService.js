// services/MasterService.js

/**
 * MasterService - Central hub for all AI intents
 *
 * PURPOSE:
 * - Combines all screen-specific services (Leave, Advance, SalarySlip, etc.)
 * - Routes AI function calls to the correct service
 * - Provides unified interface for AIChatbot
 *
 * HOW TO ADD NEW SERVICE:
 * 1. Import the new service (e.g., import AdvanceService from './AdvanceService')
 * 2. Add to constructor (e.g., this.advanceService = new AdvanceService())
 * 3. Add to initialize() method
 * 4. Add to getFunctionDefinitions() - merge its functions
 * 5. Add routing logic in execute() method
 */

import {useState, useCallback, useRef} from 'react';
// TODO: Import AdvanceService when ready
// import useAdvanceService from './AdvanceService';
// TODO: Import SalarySlipService when ready
// import useSalarySlipService from './SalarySlipService';

const MasterService = () => {
  // ========================================
  // STEP 1: Initialize all service instances
  // ========================================

  // TODO: Uncomment when AdvanceService is ready
  // const advanceService = useAdvanceService();

  // TODO: Uncomment when SalarySlipService is ready
  // const salarySlipService = useSalarySlipService();

  // Add more services here as needed...

  const [initialized, setInitialized] = useState(false);
  const servicesInitializedRef = useRef({
    leave: false,
    // advance: false, // TODO: Uncomment when ready
    // salarySlip: false, // TODO: Uncomment when ready
  });

  /**
   * Initialize all services with user context
   * MUST be called before using any service
   *
   * @param {Object} userData - User context from Redux
   * @param {string} userData.employeeId - Employee ID
   * @param {string} userData.employeeName - Employee Name
   * @param {string} userData.WorkerRecId - Worker Record ID
   */
  const initialize = useCallback(userData => {
    if (!userData) {
      throw new Error(
        'SECURITY_ERROR: User data required for MasterService initialization',
      );
    }

    // console.log('🚀 MasterService: Initializing all services...');

    // ========================================
    // STEP 2: Initialize each service
    // ========================================
    try {
      // Initialize LeaveService

      // console.log('  ✅ LeaveService initialized');

      // TODO: Uncomment when AdvanceService is ready
      // advanceService.initialize(userData);
      // servicesInitializedRef.current.advance = true;
      // console.log('  ✅ AdvanceService initialized');

      // TODO: Uncomment when SalarySlipService is ready
      // salarySlipService.initialize(userData);
      // servicesInitializedRef.current.salarySlip = true;
      // console.log('  ✅ SalarySlipService initialized');

      // Add more service initializations here...

      setInitialized(true);
      console.log('✅ MasterService: All services initialized successfully');
    } catch (error) {
      console.error('❌ MasterService initialization failed:', error);
      throw error;
    }
  }, []);

  /**
   * Validate that MasterService is initialized
   */
  const validateInitialized = useCallback(() => {
    if (!initialized) {
      throw new Error(
        'SECURITY_ERROR: MasterService not initialized. Call initialize(userData) first.',
      );
    }
    return true;
  }, [initialized]);

  /**
   * Get all function definitions from all services
   * AI uses this to know what functions it can call
   *
   * STEP 3: When adding new service, merge its functions here
   *
   * @returns {Array} Combined array of all function definitions
   */
  const getFunctionDefinitions = useCallback(() => {
    validateInitialized();

    // ========================================
    // STEP 3: Merge function definitions from all services
    // ========================================
    // const allFunctions = [
    //   // Get all Leave functions
    //   ...(leaveService.getFunctionDefinitions
    //     ? leaveService.getFunctionDefinitions()
    //     : []),

    // TODO: Uncomment when AdvanceService is ready
    // ...advanceService.getFunctionDefinitions(),

    // TODO: Uncomment when SalarySlipService is ready
    // ...salarySlipService.getFunctionDefinitions(),

    // Add more service functions here...
    // ];

    // console.log(
    //   `📋 MasterService: Providing ${allFunctions.length} functions to AI`,
    // );
    return [];
  }, [validateInitialized]);

  /**
   * Execute a function by routing to the correct service
   *
   * ROUTING STRATEGY:
   * - Uses function name patterns to determine which service handles it
   * - Each service should use consistent naming (e.g., all leave functions start with "leave_" or contain "leave")
   *
   * STEP 4: When adding new service, add routing logic here
   *
   * @param {string} functionName - Name of the function to execute
   * @param {Object} parameters - Parameters for the function
   * @returns {Object} Result from the appropriate service
   */
  const execute = useCallback(
    async (functionName, parameters = {}) => {
      validateInitialized();

      console.log('🔧 MasterService: Routing function:', functionName);

      // ========================================
      // STEP 4: Route to appropriate service based on function name
      // ========================================

      // ----------------
      // LEAVE SERVICE ROUTING
      // ----------------
      // Handle all leave-related functions
      // if (
      //   functionName.includes('leave') ||
      //   functionName === 'get_available_leave_types' ||
      //   functionName === 'calculate_leave_days' ||
      //   functionName === 'get_leave_balance' ||
      //   functionName === 'create_leave_request' ||
      //   functionName === 'submit_leave_request' ||
      //   functionName === 'delete_leave_request' ||
      //   functionName === 'get_leave_requests' ||
      //   functionName === 'validate_leave_request' ||
      //   functionName === 'get_leave_options_for_request'
      // ) {
      //   console.log('  ➡️  Routing to LeaveService');
      //   return await leaveService.execute(functionName, parameters);
      // }

      // ----------------
      // ADVANCE SERVICE ROUTING
      // ----------------
      // TODO: Uncomment when AdvanceService is ready
      /*
    if (
      functionName.includes('advance') ||
      functionName === 'get_available_advance_types' ||
      functionName === 'get_advance_balance' ||
      functionName === 'create_advance_request' ||
      functionName === 'submit_advance_request' ||
      functionName === 'delete_advance_request' ||
      functionName === 'get_advance_requests'
    ) {
      console.log('  ➡️  Routing to AdvanceService');
      return await advanceService.execute(functionName, parameters);
    }
    */

      // ----------------
      // SALARY SLIP SERVICE ROUTING
      // ----------------
      // TODO: Uncomment when SalarySlipService is ready
      /*
    if (
      functionName.includes('salary') ||
      functionName.includes('slip') ||
      functionName === 'get_salary_slips' ||
      functionName === 'download_salary_slip' ||
      functionName === 'get_salary_slip_details'
    ) {
      console.log('  ➡️  Routing to SalarySlipService');
      return await salarySlipService.execute(functionName, parameters);
    }
    */

      // ----------------
      // NAVIGATION ROUTING
      // ----------------
      // Handle navigation functions (these can be cross-service)
      if (functionName === 'navigate_to_screen') {
        console.log('  ➡️  Handling navigation');

        const {screenName} = parameters;

        // Route to appropriate service based on screen name
        // if (
        //   screenName === 'LeaveRequestSaveRecord' ||
        //   screenName === 'LeavesListPage'
        // ) {
        //   return await leaveService.execute(functionName, parameters);
        // }

        // TODO: Add navigation routing for other services
        /*
      if (screenName === 'AdvanceRequestSaveRecord' || screenName === 'AdvanceRequestListPage') {
        return await this.advanceService.execute(functionName, parameters);
      }

      if (screenName === 'SalarySlipListPage' || screenName === 'SalarySlipDetails') {
        return await this.salarySlipService.execute(functionName, parameters);
      }
      */

        // If no specific service handles this navigation, return generic response
        return {
          success: true,
          action: 'navigate',
          screenName: parameters.screenName,
          message: parameters.message,
        };
      }

      // ========================================
      // FUNCTION NOT FOUND
      // ========================================
      console.error('❌ MasterService: Unknown function:', functionName);
      return {
        success: false,
        error: 'FUNCTION_NOT_FOUND',
        message: `Function "${functionName}" not found in any service`,
        availableServices: [
          'LeaveService',
          // 'AdvanceService', // TODO: Uncomment when ready
          // 'SalarySlipService', // TODO: Uncomment when ready
        ],
      };
    },
    [validateInitialized],
  );

  /**
   * Get service statistics (useful for debugging)
   *
   * @returns {Object} Statistics about loaded services and functions
   */
  // const getServiceStats = useCallback(() => {
  //   validateInitialized();

  //   const stats = {
  //     totalServices: 1, // Update this as you add services
  //     totalFunctions: getFunctionDefinitions().length,
  //     services: {
  //       leave: {
  //         initialized: servicesInitializedRef.current.leave,
  //         functions: leaveService.getFunctionDefinitions
  //           ? leaveService.getFunctionDefinitions().length
  //           : 0,
  //       },
  //       // TODO: Add stats for other services
  //       /*
  //       advance: {
  //         initialized: servicesInitializedRef.current.advance,
  //         functions: advanceService.getFunctionDefinitions().length,
  //       },
  //       salarySlip: {
  //         initialized: servicesInitializedRef.current.salarySlip,
  //         functions: salarySlipService.getFunctionDefinitions().length,
  //       },
  //       */
  //     },
  //   };

  //   return stats;
  // }, [validateInitialized, getFunctionDefinitions, leaveService]);

  // Return all functions and state
  return {
    // State
    initialized,

    // Core functions
    initialize,
    validateInitialized,

    // Main functions
    getFunctionDefinitions,
    execute,

    // Service instances (for direct access if needed)
    // advanceService, // TODO: Uncomment when ready
    // salarySlipService, // TODO: Uncomment when ready
  };
};

export default MasterService;

/**
 * ========================================
 * QUICK GUIDE: How to Add a New Service
 * ========================================
 *
 * Example: Adding AdvanceService
 *
 * 1. CREATE THE SERVICE FILE:
 *    - Create services/AdvanceService.js
 *    - Follow same pattern as useLeaveService.js
 *    - Implement: useAdvanceService hook
 *
 * 2. IMPORT IN MASTERSERVICE:
 *    Line 19: import useAdvanceService from './AdvanceService';
 *
 * 3. ADD TO HOOK:
 *    Line 29: const advanceService = useAdvanceService();
 *
 * 4. ADD TO INITIALIZE():
 *    Line 62: advanceService.initialize(userData);
 *    Line 63: servicesInitializedRef.current.advance = true;
 *    Line 64: console.log('  ✅ AdvanceService initialized');
 *
 * 5. ADD TO GETFUNCTIONDEFINITIONS():
 *    Line 99: ...advanceService.getFunctionDefinitions(),
 *
 * 6. ADD ROUTING IN EXECUTE():
 *    Lines 146-160: Uncomment the advance routing block
 *
 * 7. UPDATE NAVIGATION ROUTING:
 *    Lines 185-188: Uncomment advance navigation
 *
 * 8. UPDATE STATS:
 *    Line 213: totalServices: 2
 *    Lines 225-229: Uncomment advance stats
 *
 * 9. RETURN IN HOOK:
 *    Line 248: advanceService,
 *
 * That's it! Your new service is integrated.
 */
