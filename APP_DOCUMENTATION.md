# Dynaface App Documentation

## 1. Overview

Dynaface is a React Native employee self-service application that combines HR, attendance, workflow, profile, payroll, help desk, procurement, and AI-assisted capabilities in a single mobile app.

At a high level, the app provides:

- Authentication and registration setup flows
- Dynamic menu-based navigation driven by backend-provided menu items
- Employee self-service features such as leaves, profile updates, salary/tax documents, and advances
- Attendance and attendance management with geofence, QR, network, and face-verification support
- Workflow and task-based screens for approvals and assigned work
- HR content modules such as policies, news, help desk, and open courses
- Notification handling through Firebase Cloud Messaging
- Theme, language, RTL, biometric, and date/time preferences stored locally

This document reflects the repository structure and implementation currently present in `c:\Dynaface`.

## 2. Tech Stack

### Core platform

- React Native `0.74.5`
- React `18.2.0`
- Android and iOS native projects included in the repo

### Navigation

- `@react-navigation/native`
- `@react-navigation/stack`
- `@react-navigation/drawer`
- `@react-navigation/bottom-tabs`

### State management

- Redux Toolkit
- React Redux
- Redux Persist

### Device and platform integrations

- Firebase App and Messaging
- Geolocation and location permission libraries
- Biometrics and secure storage
- Camera, QR, file viewer, image picker, notifications

### AI and external service integrations

- Azure OpenAI style configuration through env variables
- OpenAI SDK dependency present
- SOAP-style backend API organization under `src/API`

## 3. Application Entry Flow

### Root entry

The main application entry is [App.js](/c:/Dynaface/App.js:1).

Responsibilities:

- Wraps the app with Redux `Provider`
- Delays UI boot until persisted state is restored via `PersistGate`
- Creates the navigation container
- Applies theme values from the custom theme system
- Handles RTL switching through `I18nManager` and app restart
- Registers Firebase notification handlers
- Configures geolocation defaults globally
- Disables font scaling for `Text` and `TextInput`

### Initial route flow

The stack navigator is defined in [src/Navigation/AppNavigator.js](/c:/Dynaface/src/Navigation/AppNavigator.js:1).

Primary stack screens:

- `SplashScreen`
- `Login`
- `DrawerNavigator`
- `RequestForRegistration`
- `CreateAttendanceScreen`
- `ConfigSelectionScreen`
- `QRSetupScreen`
- `OutlookCalendarScreen`
- `AttendanceManagement`
- `SettingsScreen`
- `WorkflowHistoryScreen`
- `PurchaseOrderListPage`

The app wraps most authenticated screens with a session-timeout container that displays an alert modal when the session expires.

## 4. Navigation Architecture

### 4.1 Stack navigation

The stack navigator is the top-level navigation layer. It controls:

- unauthenticated flows
- setup/configuration flows
- drawer-based authenticated experience
- several feature screens opened directly from the stack

### 4.2 Drawer navigation

The drawer navigator is defined in [src/Navigation/DrawerNavigator.js](/c:/Dynaface/src/Navigation/DrawerNavigator.js:1).

Key behavior:

- Uses backend/menu-state driven screen registration
- Shows a custom branded drawer header
- Loads the employee profile image dynamically
- Groups menu items into `Main Menu` and `Settings`
- Supports logout through a confirmation modal
- Registers all valid drawer screens from `screenMapping`

Important implementation detail:

- Available screens are filtered from Redux `menuItems`
- Only items with `Visible === '1'` and `DisplayOnSideNavigation === 'Yes'` are shown in the side drawer

### 4.3 Tab navigation

The bottom tab navigator exists in [src/Navigation/TabNavigator.js](/c:/Dynaface/src/Navigation/TabNavigator.js:1).

Key behavior:

- Uses a custom tab bar component
- Builds footer tabs dynamically from Redux `menuItems`
- Includes animated tab icons
- Falls back to `MainDashboard` if no footer-configured tabs are available

Important implementation detail:

- Footer tabs are only shown when `DisplayOnFooter === 'Yes'`

### 4.4 Screen registry

The mapping between backend menu IDs and React screen components is centralized in [src/Controller/screenMapping.js](/c:/Dynaface/src/Controller/screenMapping.js:1).

This file is one of the most important extension points in the app because it:

- maps API menu identifiers to screen components
- maps icons for drawer and dashboard use
- acts as the link between dynamic menus and actual UI screens

If a new feature must appear through backend-driven navigation, this is one of the primary files that must be updated.

## 5. State Management

Redux store setup lives in [src/store/index.ts](/c:/Dynaface/src/store/index.ts:1).

### Persisted slices

The following slices are currently persisted:

- `language`
- `biometric`
- `firebase`
- `auth`
- `user`
- `company`
- `menuItem`
- `chatbot`
- `dateFormat`
- `theme`

### Store characteristics

- Built with Redux Toolkit `configureStore`
- Uses a custom file-based persistence layer backed by `react-native-fs`
- Stores persisted JSON under the device document directory
- Ignores redux-persist serialization warnings for rehydration-related actions

### Available slices

Under `src/store/slices` the app currently includes:

- `authSlice.js`
- `biometricSlice.js`
- `chatbotSlice.js`
- `companySlice.js`
- `dateFormatSlice.js`
- `firebaseSlice.js`
- `languageSlice.js`
- `menuItemSlice.js`
- `themeSlice.js`
- `userSlice.js`

### Selectors

[src/store/selectors.js](/c:/Dynaface/src/store/selectors.js:1) contains memoized selectors for:

- user identity and profile details
- Firebase identity state
- login status
- current language and RTL state
- company selection
- auth token state
- grouped menu items
- chatbot message/loading state
- date, time, and timezone preferences

## 6. Theming, Language, and UX Preferences

### Theme

Theme utilities live under `src/theme`:

- [colors.js](/c:/Dynaface/src/theme/colors.js:1)
- [useTheme.js](/c:/Dynaface/src/theme/useTheme.js:1)

There is also a component-level token system in places such as:

- `src/components/AppComponentsDesign`
- `src/components/AttendanceManagement/theme.js`

The app currently appears to use both:

- global theme state via Redux
- local design-token hooks for component styling

### Language and RTL

Internationalization files exist under `src/i18n`:

- [index.js](/c:/Dynaface/src/i18n/index.js:1)
- [dynamicTranslations.js](/c:/Dynaface/src/i18n/dynamicTranslations.js:1)

Language state is stored in Redux and the app can force RTL layout changes at runtime, restarting the app when required.

### User preference domains

The app stores several user-facing preferences:

- language
- RTL mode
- biometric settings
- date format
- time format
- timezone
- visual theme

## 7. Project Structure

The `src` folder is organized into the following high-level domains:

- `API`: backend calls grouped by business domain
- `assets`: static media and icons
- `components`: reusable UI and feature-specific components
- `Controller`: navigation helpers, mappings, and shared orchestration helpers
- `hooks`: custom hooks
- `i18n`: translations and internationalization setup
- `Navigation`: stack, drawer, and tab navigators
- `screens`: screen-level feature modules
- `services`: business services and orchestrators
- `shared`: shared utilities or abstractions
- `store`: Redux store, slices, selectors, and app-level helpers
- `styles`: legacy/global style definitions
- `theme`: theme definitions and hooks
- `utils`: general helpers

## 8. Functional Modules

The app contains many business modules. Based on the current `src/screens` and `src/API` structure, the major feature areas are:

### Employee and ESS

- Profile
- Personal information
- Contact details
- Family contacts
- Identification
- Education
- Bank accounts
- Profile image updates
- Employee tasks
- My request status

### Attendance

- Standard attendance creation
- Attendance details
- Attendance calendar
- Employee adjustment
- Roster details
- Full attendance management module

### Leave and entitlement

- Leave request listing
- Leave request save/submit flow
- Entitlement balance

### Payroll and certificates

- Salary slip
- Tax certificate
- Employment certificate

### Finance and employee advances

- Employee advance request
- Employee advances
- Outstanding advances

### Procurement

- Purchase order
- Purchase requisition
- Purchase requisition lines
- Expense management

### HR support and information

- HR help desk
- HR policies
- HR news updates
- Open courses
- Exit interview

### Workflow and tasks

- Workflow history
- Workflow detail
- Work assigned to me
- Items assigned to me

### EOS and clearance

- Employee EOS request
- EOS save flow
- EOS clearance items

### Setup and settings

- Request for registration
- QR setup
- config selection
- biometric settings
- date settings
- settings screen
- Outlook calendar integration screen

## 9. Attendance Management Module

Attendance Management is one of the most advanced parts of the application.

### Main implementation areas

Screens:

- [src/screens/AttendanceManagement/AttendanceManagement.js](/c:/Dynaface/src/screens/AttendanceManagement/AttendanceManagement.js:1)
- [src/components/AttendanceManagement/Screen/HomeScreen.js](/c:/Dynaface/src/components/AttendanceManagement/Screen/HomeScreen.js:1)
- [src/components/AttendanceManagement/Screen/TimeClockScreen.js](/c:/Dynaface/src/components/AttendanceManagement/Screen/TimeClockScreen.js:1)
- `ConfirmClockInScreen`
- `ConfirmClockOutScreen`
- `ConfirmBreakScreen`
- `AttendanceRecordsScreen`

Components:

- `GeofenceContext`
- `LocationValidator`
- `LocationPickerModal`
- `QRScannerModal`
- `FaceVerificationModal`
- `ConfirmSheet`
- `ProcessingOverlay`
- `ActionButtons`
- `NavigationFAB`

Services:

- [AttendanceOrchestrator.js](/c:/Dynaface/src/services/AttendanceManagement/AttendanceOrchestrator.js:1)
- `SyncManager.js`
- `AttendanceHeadlessTask.js`
- `AttendanceForegroundService.js`

### What this module does

Based on the current implementation, the module supports:

- geofence-based location validation
- attendance action orchestration
- QR code validation
- network matching checks
- online/offline or sync-aware attendance processing
- foreground/headless attendance support
- break and clock state transitions
- tokenized validation before final attendance submission

### Architectural note

`AttendanceOrchestrator` is designed as a coordination layer that performs multiple validation steps in parallel and reduces unnecessary repeated server calls before submitting attendance.

## 10. Service Layer

The `src/services` folder holds application services that sit above raw API calls.

Current services include:

- `VoiceRecordingService.js`
- `SecureConfigService.js`
- `MasterService.js`
- `LeaveService.js`
- `AzureAIService.js`
- `AttendanceManagement/SyncManager.js`
- `AttendanceManagement/AttendanceOrchestrator.js`
- `AttendanceManagement/AttendanceHeadlessTask.js`
- `AttendanceManagement/AttendanceForegroundService.js`

### 10.1 Secure configuration

[src/services/SecureConfigService.js](/c:/Dynaface/src/services/SecureConfigService.js:1) manages secure configuration concerns.

Current behavior:

- Reads Azure AI config from environment variables
- Can store config to encrypted storage as backup
- Can retrieve fallback config from encrypted storage
- Provides connection test utilities

Environment variables referenced in code:

- `AZURE_API_KEY`
- `AZURE_ENDPOINT`
- `AZURE_DEPLOYMENT`
- `AZURE_API_VERSION`

### 10.2 AI service

`AzureAIService.js` contains logic for AI-assisted flows. From the current implementation snapshot, the service includes:

- secure initialization
- prompt sanitization
- user data validation
- leave entity extraction from natural language
- natural date interpretation for leave workflows

This suggests the app includes or is preparing chatbot/AI-assisted HR use cases, especially around leave handling.

## 11. API Layer

The backend access layer is grouped under `src/API` by domain.

Current top-level API domains include:

- Attendance
- AttendanceManagement
- Auth
- EmployeeAdvanceRequest
- EmployeeAdvances
- EmployeeEOSClearanceItems
- EmployeeEOSRequest
- EmploymentCertificate
- EmploymentInformation
- EntitlementBalance
- ESSEmployeeOpenCourse
- ESSEmployeeTask
- ESSMyRequestStatus
- Exit Interview
- ExpenseManagment
- HRHelpDeskRequest
- HRNewsUpdates
- HRPolicies
- Leaves
- Notification
- Outlook
- OutstandingAdvances
- PayGroupPayPeriod
- PersonalInformation
- PurchaseOrder
- PurchaseRequisition
- PurchaseRequisitionLines
- RequestForRegistration
- SalarySlip
- TaxCertificate
- Token
- WorkerAssignedToMe
- WorkflowHistory
- WorkflowTrackingStatusTable

This structure indicates the app follows a domain-based API layout rather than a single centralized client file.

## 12. Authentication and Session Handling

Authentication is distributed across:

- `src/API/Auth`
- Redux auth and user slices
- navigation gating through stack flow
- logout helpers in `src/Controller/authUtils`
- session timeout logic through `useSessionTimeout`

Known authentication-related behaviors:

- login flow starts from the stack navigator
- logout is available from the drawer
- many authenticated screens are wrapped with a session-expiry modal
- user state and auth-related state are persisted locally

## 13. Notifications and Firebase

Firebase integration is visible through:

- `@react-native-firebase/app`
- `@react-native-firebase/messaging`
- [src/store/FirebaseService.js](/c:/Dynaface/src/store/FirebaseService.js:1)
- `firebaseSlice`

At app startup, Firebase message handlers are registered and receive access to the navigation reference so notification taps can route users into the correct screen even outside the normal component tree.

## 14. Security Considerations

The app already includes several security-oriented components and dependencies:

- encrypted storage for secure config backup
- biometrics support
- secure state persistence patterns
- prompt sanitization in AI service code
- environment-based configuration for external AI credentials

Areas to treat carefully during future development:

- avoid logging sensitive keys or tokens
- minimize plain-text storage of personally identifiable information
- review debug logging in secure/config services before production release
- ensure notification payload handling is validated before navigation

## 15. Build and Run

### Requirements

- Node.js `18+`
- React Native development environment for Android and/or iOS
- Android Studio for Android builds
- Xcode for iOS builds

### Common scripts

Defined in [package.json](/c:/Dynaface/package.json:1):

- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run lint`
- `npm run test`

### Install dependencies

```bash
npm install
```

### Start Metro

```bash
npm run start
```

### Run Android

```bash
npm run android
```

### Run iOS

```bash
npm run ios
```

## 16. Configuration Checklist

Before running the app successfully, confirm the following are available in your local environment:

- React Native native build tooling
- Firebase project configuration files
- any backend endpoint or SOAP configuration required by the API layer
- `.env` values for Azure AI if AI features are enabled
- Android and iOS permission configuration for:
  - location
  - camera
  - notifications
  - biometrics
  - storage or file access where applicable

## 17. Testing and Quality

Testing infrastructure exists through:

- Jest
- React Test Renderer
- ESLint
- Prettier

Current repo indicators suggest:

- the project has the basic test/lint scaffolding in place
- this documentation does not assume broad automated coverage without reviewing each test file individually

Recommended quality workflow:

1. Run `npm run lint`
2. Run `npm run test`
3. Smoke test Android and iOS login/navigation flows
4. Verify feature modules that depend on device APIs on real hardware

## 18. How to Extend the App

### Add a new feature screen

1. Create the screen under the appropriate `src/screens/<Feature>` directory.
2. Add any domain API calls under `src/API/<Feature>`.
3. Register the screen in `src/Controller/screenMapping.js`.
4. Ensure the backend menu payload returns the correct `MenuId`.
5. If needed, expose it in drawer/footer navigation through menu configuration.

### Add a new persisted preference

1. Create a new Redux slice under `src/store/slices`.
2. Add it to `rootReducer` in `src/store/index.ts`.
3. Add it to the persist whitelist if it should survive app restarts.
4. Add selectors in `src/store/selectors.js`.

### Add a new service integration

1. Create a service in `src/services`.
2. Keep raw request logic in `src/API` and business orchestration in `src/services`.
3. Use secure configuration and environment variables for secrets.

## 19. Known Architectural Patterns

Patterns currently visible in the codebase:

- domain-driven folder organization
- dynamic menu/screen registration from backend data
- stack + drawer + bottom-tab hybrid navigation
- Redux-persisted app state
- service layer above domain API modules
- feature-heavy screen modules with reusable component clusters
- attendance orchestration with validation tokens and coordinated checks

## 20. Recommended Documentation Follow-Ups

This file is a strong app-level reference, but the project would benefit from a few additional focused documents:

- `README.md` for quick start only
- `docs/architecture.md` for navigation, state, and service design
- `docs/attendance-management.md` for the attendance subsystem
- `docs/api-domains.md` for backend/API contracts
- `docs/setup.md` for environment variables, Firebase, and native permissions

## 21. Summary

Dynaface is a large-scale React Native employee self-service application with dynamic backend-driven navigation, a Redux-persisted client state layer, many HR and procurement modules, and an advanced attendance subsystem built around geofence-aware validation and orchestration.

The most important technical anchors in the codebase are:

- `App.js` for app bootstrapping
- `src/Navigation` for routing
- `src/Controller/screenMapping.js` for dynamic screen registration
- `src/store` for app state and persistence
- `src/API` for domain-based backend integration
- `src/services` for orchestration and advanced business logic
- `src/screens` and `src/components` for feature implementation

