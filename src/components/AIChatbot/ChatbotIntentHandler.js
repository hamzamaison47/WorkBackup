/* eslint-disable quotes */
/* eslint-disable curly */

import {RetrieveLeaveCodes} from '../../API/Leaves/LeaveCodes';
import {createLeaveRequest} from '../../API/Leaves/CreateLeaveRequest';
import SubmitLeaveRequest from '../../API/Leaves/SubmitLeaveRequest';

import {GetLeaveBalance} from '../../API/Leaves/LeaveBalance';
import {GetEmployeeQuota} from '../../API/Leaves/GetEmployeeQuota';
import {GetLeaveDays} from '../../API/Leaves/GetLeaveDays';

/**
 * ==========================================
 * DYNAFACE APP INFORMATION & USAGE - MULTILINGUAL
 * ==========================================
 */
const DynafaceInfo = {
  description: {
    en: 'Dynaface is a comprehensive mobile application designed for employee ease and efficiency. It connects with Microsoft D365 to manage various HR operations smoothly and securely.',
    ur: 'Dynaface ایک جامع موبائل ایپلی کیشن ہے جو ملازمین کی آسانی اور کارکردگی کے لیے بنائی گئی ہے۔ یہ مختلف HR آپریشنز کو ہموار اور محفوظ طریقے سے منظم کرنے کے لیے Microsoft D365 سے جڑتی ہے۔',
    ar: 'Dynaface هو تطبيق جوال شامل مصمم لسهولة الموظفين وكفاءتهم. يتصل بـ Microsoft D365 لإدارة عمليات الموارد البشرية المختلفة بسلاسة وأمان.',
  },
  key_features: {
    en: [
      'Attendance Management - Mark attendance with GPS verification, view attendance history',
      'Leave Management - Request, approve, and track leaves with real-time balance updates',
      'Employee Profile - View and manage personal information and employment details',
      'Salary & Entitlements - Access salary slips, tax certificates, and leave entitlements',
      'Workflow Tracking - Track approval status of requests in real-time',
      'Expense Management - Submit and track expense claims',
      'Purchase Requisitions - Create and manage purchase requests',
      'Employee Certificates - Request and download employment certificates',
    ],
    ur: [
      'حاضری کا انتظام - GPS کی تصدیق کے ساتھ حاضری درج کریں، حاضری کی تاریخ دیکھیں',
      'چھٹیوں کا انتظام - چھٹیوں کی درخواست کریں، منظور کریں اور اصل وقت میں بیلنس اپ ڈیٹ کے ساتھ ٹریک کریں',
      'ملازم کا پروفائل - ذاتی معلومات اور ملازمت کی تفصیلات دیکھیں اور ان کا انتظام کریں',
      'تنخواہ اور استحقاق - تنخواہ کے سلپس، ٹیکس سرٹیفکیٹس، اور چھٹی کے استحقاق تک رسائی حاصل کریں',
      'ورک فلو ٹریکنگ - درخواستوں کی منظوری کی حیثیت کو اصل وقت میں ٹریک کریں',
      'اخراجات کا انتظام - اخراجات کے دعوے جمع کروائیں اور انہیں ٹریک کریں',
      'خریداری کی درخواستیں - خریداری کی درخواستیں بنائیں اور ان کا انتظام کریں',
      'ملازمت کے سرٹیفکیٹ - ملازمت کے سرٹیفکیٹس کی درخواست کریں اور ڈاؤن لوڈ کریں',
    ],
    ar: [
      'إدارة الحضور - قم بتسجيل الحضور مع التحقق من GPS، وعرض سجل الحضور',
      'إدارة الإجازات - طلب الإجازات، والموافقة عليها، وتتبعها مع تحديثات الرصيد في الوقت الفعلي',
      'ملف الموظف - عرض وإدارة المعلومات الشخصية وتفاصيل التوظيف',
      'الراتب والمستحقات - الوصول إلى إيصالات الراتب، وشهادات الضرائب، واستحقاقات الإجازة',
      'تتبع سير العمل - تتبع حالة الموافقة على الطلبات في الوقت الفعلي',
      'إدارة المصروفات - تقديم ومتابعة مطالبات المصروفات',
      'طلبات الشراء - إنشاء وإدارة طلبات الشراء',
      'شهادات الموظفين - طلب وتنزيل شهادات التوظيف',
    ],
  },
};

/**
 * ==========================================
 * MULTILINGUAL HELPERS
 * ==========================================
 */

// Language detection
const detectLanguage = text => {
  if (!text || typeof text !== 'string') return 'en';

  const input = String(text).trim();
  if (input.length === 0) return 'en';

  // Urdu detection (Arabic script)
  const urduRegex =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  if (urduRegex.test(input)) return 'ur';

  // Arabic detection
  const arabicRegex = /[\u0600-\u06FF]/;
  if (arabicRegex.test(input) && !urduRegex.test(input)) return 'ar';

  // Roman Urdu/English
  return 'en';
};

// Extract numbers from any language text - FIXED VERSION
const extractNumber = text => {
  if (!text || typeof text !== 'string') return null;

  const input = String(text).trim();

  // First, try to extract standalone number (this is the key fix)
  // Match single digit numbers that are standalone or at the beginning
  const singleDigitMatch = input.match(/^\s*(\d+)\s*$/);
  if (singleDigitMatch) {
    const num = parseInt(singleDigitMatch[1], 10);
    if (num >= 1 && num <= 100) {
      return num;
    }
  }

  // Try direct number match in the text
  const numMatch = input.match(/(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (num >= 1 && num <= 100) {
      return num;
    }
  }

  // Number words in multiple languages
  const numberWords = {
    en: {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
    },
    ur: {
      ایک: 1,
      دو: 2,
      تین: 3,
      چار: 4,
      پانچ: 5,
      چھ: 6,
      سات: 7,
      آٹھ: 8,
      نو: 9,
      دس: 10,
    },
    ar: {
      واحد: 1,
      اثنان: 2,
      ثلاثة: 3,
      أربعة: 4,
      خمسة: 5,
      ستة: 6,
      سبعة: 7,
      ثمانية: 8,
      تسعة: 9,
      عشرة: 10,
    },
  };

  const lang = detectLanguage(input);
  const lowerInput = input.toLowerCase();

  for (const [word, value] of Object.entries(
    numberWords[lang] || numberWords.en,
  )) {
    if (lowerInput.includes(word)) return value;
  }

  // Roman Urdu numbers
  const romanUrduNumbers = {
    ek: 1,
    do: 2,
    teen: 3,
    char: 4,
    panch: 5,
    chay: 6,
    saat: 7,
    aath: 8,
    nau: 9,
    das: 10,
  };

  for (const [word, value] of Object.entries(romanUrduNumbers)) {
    if (lowerInput.includes(word)) return value;
  }

  return null;
};

// Multilingual date parsing
const parseAnyDateToISO = input => {
  if (!input || typeof input !== 'string') return null;

  const raw = String(input).trim();
  if (!raw) return null;

  // First try standard date formats
  // YYYY-M-D or YYYY-MM-DD
  let m = raw.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    const yyyy = m[1];
    const mm = String(m[2]).padStart(2, '0');
    const dd = String(m[3]).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T12:00:00`;
  }

  // D/M/YYYY or DD/MM/YYYY
  m = raw.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m) {
    const dd = String(m[1]).padStart(2, '0');
    const mm = String(m[2]).padStart(2, '0');
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}T12:00:00`;
  }

  // Try parsing numbers for dates (e.g., "15-12-2025")
  m = raw.match(/(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{4})/);
  if (m) {
    const dd = String(m[1]).padStart(2, '0');
    const mm = String(m[2]).padStart(2, '0');
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}T12:00:00`;
  }

  // Try Date constructor as fallback
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return formatToISOWithTime(d);
    }
  } catch (e) {
    // Continue to next method
  }

  return null;
};

const formatToISOWithTime = date => {
  if (!date) return null;
  const baseDate = new Date(date);
  if (isNaN(baseDate.getTime())) return null;

  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, '0');
  const day = String(baseDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T12:00:00`;
};

const todayISOWithTime = () => formatToISOWithTime(new Date());

const toNumberSafe = v => {
  if (v === null || v === undefined) return 0;
  const n = parseFloat(String(v).trim());
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
 * MULTILINGUAL KEYWORD DETECTION
 * ==========================================
 */

// Multilingual keyword mappings
const KEYWORDS = {
  // Attendance
  mark_attendance: {
    en: [
      'attendance',
      'mark attendance',
      'punch in',
      'punch out',
      'check in',
      'check out',
      '1', // Add number 1 for attendance
    ],
    ur: ['حاضری', 'حاضری درج کریں', 'پنچ ان', 'پنچ آؤٹ', 'چیک ان', 'چیک آؤٹ'],
    ar: [
      'الحضور',
      'تسجيل الحضور',
      'بدء الدوام',
      'إنهاء الدوام',
      'تسجيل الدخول',
      'تسجيل الخروج',
    ],
  },

  // Leave request
  request_leave: {
    en: [
      'leave request',
      'request leave',
      'apply leave',
      'take leave',
      'apply for leave',
      'need leave',
      '2', // Add number 2 for leave request
    ],
    ur: [
      'چھٹی کی درخواست',
      'درخواست چھٹی',
      'چھٹی کے لیے درخواست دیں',
      'چھٹی لیں',
      'چھٹی کی ضرورت ہے',
    ],
    ar: [
      'طلب إجازة',
      'طلب إجازة',
      'تقدم بطلب إجازة',
      'خذ إجازة',
      'أحتاج إجازة',
    ],
  },

  // Leave balance
  check_leave_balance: {
    en: [
      'leave balance',
      'check balance',
      'remaining leave',
      'how many leaves',
      'balance',
      '3', // Add number 3 for leave balance
    ],
    ur: [
      'چھٹی کا بیلنس',
      'بیلنس چیک کریں',
      'بقیہ چھٹیاں',
      'کتنے چھٹیاں ہیں',
      'بیلنس',
    ],
    ar: [
      'رصيد الإجازة',
      'تحقق من الرصيد',
      'الإجازات المتبقية',
      'كم إجازة لدي',
      'الرصيد',
    ],
  },

  // General leave (ambiguous - needs clarification)
  general_leave: {
    en: ['leave'],
    ur: ['چھٹی'],
    ar: ['إجازة'],
  },

  // Info
  info_dynaface: {
    en: [
      'about dynaface',
      'dynaface info',
      'app features',
      'how to use',
      'what is dynaface',
      '4', // Add number 4 for info
    ],
    ur: [
      'ڈائنا فیس کے بارے میں',
      'ڈائنا فیس کی معلومات',
      'ایپ کی خصوصیات',
      'کیسے استعمال کریں',
      'ڈائنا فیس کیا ہے',
    ],
    ar: [
      'حول Dynaface',
      'معلومات Dynaface',
      'ميزات التطبيق',
      'كيفية الاستخدام',
      'ما هو Dynaface',
    ],
  },

  // Cancel
  cancel: {
    en: ['cancel', 'stop', 'quit', 'exit', 'close'],
    ur: ['منسوخ کریں', 'روکیں', 'چھوڑ دیں', 'بند کریں', 'بند'],
    ar: ['إلغاء', 'توقف', 'استقال', 'خروج', 'إغلاق'],
  },

  // Confirmation
  confirm: {
    en: ['yes', 'ok', 'confirm', 'agree', 'proceed', 'save', 'submit'],
    ur: [
      'ہاں',
      'ٹھیک ہے',
      'تصدیق کریں',
      'متحد ہوں',
      'آگے بڑھیں',
      'محفوظ کریں',
      'جمع کروائیں',
    ],
    ar: ['نعم', 'حسنا', 'تأكيد', 'أوافق', 'تقدم', 'حفظ', 'إرسال'],
  },
};

// Check if text contains any of the multilingual keywords
const containsKeyword = (text, intent) => {
  if (!text || typeof text !== 'string') return false;

  const input = String(text).toLowerCase().trim();
  const lang = detectLanguage(text);

  // Check English keywords
  for (const keyword of KEYWORDS[intent]?.en || []) {
    if (
      input === keyword.toLowerCase() ||
      input.includes(keyword.toLowerCase())
    ) {
      return true;
    }
  }

  // Check Urdu keywords
  if (lang === 'ur' || lang === 'en') {
    for (const keyword of KEYWORDS[intent]?.ur || []) {
      if (
        input === keyword.toLowerCase() ||
        input.includes(keyword.toLowerCase())
      ) {
        return true;
      }
    }
  }

  // Check Arabic keywords
  if (lang === 'ar' || lang === 'en') {
    for (const keyword of KEYWORDS[intent]?.ar || []) {
      if (
        input === keyword.toLowerCase() ||
        input.includes(keyword.toLowerCase())
      ) {
        return true;
      }
    }
  }

  return false;
};

/**
 * ==========================================
 * MULTILINGUAL INTENT DETECTION - FIXED VERSION
 * ==========================================
 */
const detectIntent = userInput => {
  if (!userInput || typeof userInput !== 'string') return 'unknown';

  const text = String(userInput).trim().toLowerCase();
  console.log('🎯 Detecting intent for:', text);

  // Check for exact number matches first (1, 2, 3, 4)
  const num = extractNumber(text);
  if (num === 1) return 'mark_attendance';
  if (num === 2) return 'request_leave';
  if (num === 3) return 'check_leave_balance';
  if (num === 4) return 'info_dynaface';

  // Check specific intents with priority
  if (containsKeyword(text, 'mark_attendance')) return 'mark_attendance';
  if (containsKeyword(text, 'request_leave')) return 'request_leave';
  if (containsKeyword(text, 'check_leave_balance'))
    return 'check_leave_balance';
  if (containsKeyword(text, 'info_dynaface')) return 'info_dynaface';
  if (containsKeyword(text, 'general_leave')) return 'general_leave_ambiguous';
  if (containsKeyword(text, 'cancel')) return 'cancel';

  return 'unknown';
};

// Multilingual response generator - ENHANCED
const generateIntelligentResponse = (intent, lang = 'en', userInput = '') => {
  const responses = {
    info_dynaface: {
      en: `🤖 About Dynaface\n\n${
        DynafaceInfo.description.en
      }\n\nKey Features:\n${DynafaceInfo.key_features.en
        .map((f, i) => `${i + 1}. ${f}`)
        .join('\n')}`,
      ur: `🤖 ڈائنا فیس کے بارے میں\n\n${
        DynafaceInfo.description.ur
      }\n\nاہم خصوصیات:\n${DynafaceInfo.key_features.ur
        .map((f, i) => `${i + 1}. ${f}`)
        .join('\n')}`,
      ar: `🤖 حول Dynaface\n\n${
        DynafaceInfo.description.ar
      }\n\nالميزات الرئيسية:\n${DynafaceInfo.key_features.ar
        .map((f, i) => `${i + 1}. ${f}`)
        .join('\n')}`,
    },
    request_leave: {
      en: "Let me help you request a leave. I'll guide you step by step.",
      ur: 'میں آپ کی چھٹی کی درخواست میں مدد کرتا ہوں۔ میں آپ کو قدم بہ قدم رہنمائی کروں گا۔',
      ar: 'دعني أساعدك في طلب إجازة. سأوجهك خطوة بخطوة.',
    },
    check_leave_balance: {
      en: 'Sure! I can check your leave balance. Please select a leave type.',
      ur: 'ضرور! میں آپ کا چھٹی کا بیلنس چیک کر سکتا ہوں۔ براہ کرم ایک چھٹی کی قسم منتخب کریں۔',
      ar: 'بالتأكيد! يمكنني التحقق من رصيد إجازتك. يرجى تحديد نوع الإجازة.',
    },
    mark_attendance: {
      en: 'I can help you mark your attendance. This requires location access to verify your office location.',
      ur: 'میں آپ کی حاضری درج کرنے میں مدد کر سکتا ہوں۔ اس کے لیے دفتر کے مقام کی تصدیق کے لیے لوکیشن کی رسائی درکار ہے۔',
      ar: 'يمكنني مساعدتك في تسجيل حضورك. يتطلب هذا الوصول إلى الموقع للتحقق من موقع مكتبك.',
    },
    general_leave_ambiguous: {
      en: 'I can help you with leaves. Do you want to:\n\n1) Request a leave\n2) Check your leave balance\n\nPlease reply with 1 or 2.',
      ur: 'میں چھٹیوں میں آپ کی مدد کر سکتا ہوں۔ کیا آپ چاہتے ہیں:\n\n1) چھٹی کی درخواست دیں\n2) اپنا چھٹی بیلنس چیک کریں\n\nبراہ کرم 1 یا 2 کے ساتھ جواب دیں۔',
      ar: 'يمكنني مساعدتك في الإجازات. هل تريد:\n\n1) طلب إجازة\n2) التحقق من رصيد إجازتك\n\nيرجى الرد بـ 1 أو 2.',
    },
    unknown: {
      en: 'I can help you with:\n\n1) Mark Attendance \n2) Leave Request \n3) Check Leave Balance \n4) About Dynaface \n\nWhat would you like to do?',
      ur: 'میں آپ کی مدد کر سکتا ہوں:\n\n1) حاضری درج کریں\n2) چھٹی کی درخواست\n3) چھٹی کا بیلنس چیک کریں\n4) ڈائنا فیس کے بارے میں\n\nآپ کیا کرنا چاہیں گے؟',
      ar: 'يمكنني مساعدتك في:\n\n1) تسجيل الحضور\n2) طلب إجازة\n3) التحقق من رصيد الإجازة\n4) حول Dynaface\n\nماذا تريد أن تفعل؟',
    },
  };

  const detectedLang = lang || 'en';
  return (
    responses[intent]?.[detectedLang] ||
    responses[intent]?.en ||
    responses.unknown[detectedLang]
  );
};

/**
 * ==========================================
 * MULTILINGUAL LEAVE REQUEST HANDLER
 * ==========================================
 */
class LeaveRequestHandler {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = null;
    this.userLanguage = 'en'; // Default language
    this.leaveData = {
      mode: 'leave_request',
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
   * Set user language based on input
   */
  detectUserLanguage(text) {
    this.userLanguage = detectLanguage(text);
    return this.userLanguage;
  }

  /**
   * Redux persistence helpers - MUST DEFINE THESE METHODS
   */
  toJSON() {
    return {
      state: this.state,
      userLanguage: this.userLanguage,
      leaveData: {...this.leaveData},
    };
  }

  fromJSON(obj) {
    if (!obj) return;
    this.state = obj.state ?? null;
    this.userLanguage = obj.userLanguage ?? 'en';
    this.leaveData = {...this.leaveData, ...obj.leaveData};
  }

  /**
   * Simplify leave name method - MUST BE DEFINED AS INSTANCE METHOD
   */
  simplifyLeaveName(fullName) {
    if (!fullName || typeof fullName !== 'string') return '';

    const lowerName = fullName.toLowerCase().trim();

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

    // Check for matches in simplifications
    for (const [key, value] of Object.entries(simplifications)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }

    // If no match, return the original but cleaned up
    return fullName.replace(/\s+/g, ' ').trim();
  }

  /**
   * Multilingual responses
   */
  getResponse(key, params = {}) {
    const responses = {
      // Leave type selection
      ask_leave_type: {
        en: `Great! Let me help you request a leave.\n\nAvailable leave types:\n\n{leave_list}\n\nReply with the number or name (e.g., '1' or 'annual'). Type 'cancel' to stop.`,
        ur: `بہت اچھا! میں آپ کی چھٹی کی درخواست میں مدد کرتا ہوں۔\n\nدستیاب چھٹی کی اقسام:\n\n{leave_list}\n\nنمبر یا نام کے ساتھ جواب دیں (مثال کے طور پر '1' یا 'سالانہ')۔ روکنے کے لیے 'منسوخ کریں' ٹائپ کریں۔`,
        ar: `عظيم! دعني أساعدك في طلب إجازة.\n\nأنواع الإجازات المتاحة:\n\n{leave_list}\n\nالرد بالرقم أو الاسم (مثال: '1' أو 'سنوي'). اكتب 'إلغاء' للتوقف.`,
      },

      // Leave balance
      ask_balance_type: {
        en: `Sure! Let's check your leave balance.\n\nAvailable leave types:\n\n{leave_list}\n\nReply with the number or name (e.g., '1' or 'annual'). Type 'cancel' to stop.`,
        ur: `ضرور! آئیے آپ کا چھٹی کا بیلنس چیک کریں۔\n\nدستیاب چھٹی کی اقسام:\n\n{leave_list}\n\nنمبر یا نام کے ساتھ جواب دیں (مثال کے طور پر '1' یا 'سالانہ')۔ روکنے کے لیے 'منسوخ کریں' ٹائپ کریں۔`,
        ar: `بالتأكيد! دعنا نتحقق من رصيد إجازتك.\n\nأنواع الإجازات المتاحة:\n\n{leave_list}\n\nالرد بالرقم أو الاسم (مثال: '1' أو 'سنوي'). اكتب 'إلغاء' للتوقف.`,
      },

      // Leave category
      ask_leave_category: {
        en: 'Select leave category:\n\n1) Full Day Leave\n2) Half Day Leave\n\nReply 1 or 2.',
        ur: 'چھٹی کی قسم منتخب کریں:\n\n1) پورے دن کی چھٹی\n2) آدھے دن کی چھٹی\n\n1 یا 2 کا جواب دیں۔',
        ar: 'اختر فئة الإجازة:\n\n1) إجازة يوم كامل\n2) إجازة نصف يوم\n\nالرد 1 أو 2.',
      },

      // Start date
      ask_start_date: {
        en: 'Please provide Start Date\n\nFormat: YYYY-MM-DD or DD/MM/YYYY\n\nExample: 2025-12-30 or 30/12/2025',
        ur: 'براہ کرم تاریخ آغاز فراہم کریں\n\nفارمیٹ: YYYY-MM-DD یا DD/MM/YYYY\n\nمثال: 2025-12-30 یا 30/12/2025',
        ar: 'يرجى تقديم تاريخ البدء\n\nالتنسيق: YYYY-MM-DD أو DD/MM/YYYY\n\nمثال: 2025-12-30 أو 30/12/2025',
      },

      // End date
      ask_end_date: {
        en: 'Now provide End Date\n\nFormat: YYYY-MM-DD or DD/MM/YYYY\n\nExample: 2025-12-31 or 31/12/2025',
        ur: 'اب اختتامی تاریخ فراہم کریں\n\nفارمیٹ: YYYY-MM-DD یا DD/MM/YYYY\n\nمثال: 2025-12-31 یا 31/12/2025',
        ar: 'الآن قدم تاريخ الانتهاء\n\nالتنسيق: YYYY-MM-DD أو DD/MM/YYYY\n\nمثال: 2025-12-31 أو 31/12/2025',
      },

      // Reason
      ask_reason: {
        en: 'Please provide a reason for your leave\n\nLeave Period: {start} to {end}\n\nType your reason (3-500 characters):',
        ur: 'براہ کرم اپنی چھٹی کی وجہ فراہم کریں\n\nچھٹی کی مدت: {start} سے {end}\n\nاپنی وجہ ٹائپ کریں (3-500 حروف):',
        ar: 'يرجى تقديم سبب لإجازتك\n\nفترة الإجازة: من {start} إلى {end}\n\nاكتب سببك (3-500 حرفًا):',
      },

      // Invalid input
      invalid_input: {
        en: 'Please provide a valid input.',
        ur: 'براہ کرم ایک درست ان پٹ فراہم کریں۔',
        ar: 'يرجى تقديم إدخال صالح.',
      },

      // Invalid date
      invalid_date: {
        en: 'Please provide a valid date (YYYY-MM-DD or DD/MM/YYYY). Example: 2025-12-30',
        ur: 'براہ کرم ایک درست تاریخ فراہم کریں (YYYY-MM-DD یا DD/MM/YYYY)۔ مثال: 2025-12-30',
        ar: 'يرجى تقديم تاريخ صالح (YYYY-MM-DD أو DD/MM/YYYY). مثال: 2025-12-30',
      },

      // Confirmation
      confirmation: {
        en: `📝 Leave Request Summary\n\n• Leave Type: {leave_name} ({leave_code})\n• Category: {category}\n• Start Date: {start_date}\n• End Date: {end_date}\n• Leave Days: {leave_days}\n• Balance: {balance}\n• Quota: {quota}\n• Eligibility: {eligibility}\n• Reason: {reason}\n\nPlease confirm:\n1) Save (Save as Draft)\n2) Submit (Submit for Approval)\n3) Cancel (Cancel Request)`,
        ur: `📝 چھٹی کی درخواست کا خلاصہ\n\n• چھٹی کی قسم: {leave_name} ({leave_code})\n• قسم: {category}\n• تاریخ آغاز: {start_date}\n• اختتامی تاریخ: {end_date}\n• چھٹی کے دن: {leave_days}\n• بیلنس: {balance}\n• کوٹہ: {quota}\n• اہلیت: {eligibility}\n• وجہ: {reason}\n\nبراہ کرم تصدیق کریں:\n1) محفوظ کریں (ڈرافٹ کے طور پر محفوظ کریں)\n2) جمع کروائیں (منظوری کے لیے جمع کروائیں)\n3) منسوخ کریں (درخواست منسوخ کریں)`,
        ar: `📝 ملخص طلب الإجازة\n\n• نوع الإجازة: {leave_name} ({leave_code})\n• الفئة: {category}\n• تاريخ البدء: {start_date}\n• تاريخ الانتهاء: {end_date}\n• أيام الإجازة: {leave_days}\n• الرصيد: {balance}\n• الحصة: {quota}\n• الأهلية: {eligibility}\n• السبب: {reason}\n\nيرجى التأكيد:\n1) حفظ (حفظ كمسودة)\n2) إرسال (إرسال للموافقة)\n3) إلغاء (إلغاء الطلب)`,
      },

      // Balance summary
      balance_summary: {
        en: `📊 Leave Balance\n\n• Leave Type: {leave_name} ({leave_code})\n• Balance: {balance}\n• Quota: {quota}\n• Eligibility: {eligibility}\n\nType another leave type (number or name) to check again, or type 'cancel'.`,
        ur: `📊 چھٹی کا بیلنس\n\n• چھٹی کی قسم: {leave_name} ({leave_code})\n• بیلنس: {balance}\n• کوٹہ: {quota}\n• اہلیت: {eligibility}\n\nدوبارہ چیک کرنے کے لیے کسی دوسری چھٹی کی قسم (نمبر یا نام) ٹائپ کریں، یا 'منسوخ کریں' ٹائپ کریں۔`,
        ar: `📊 رصيد الإجازة\n\n• نوع الإجازة: {leave_name} ({leave_code})\n• الرصيد: {balance}\n• الحصة: {quota}\n• الأهلية: {eligibility}\n\nاكتب نوع إجازة آخر (رقم أو اسم) للتحقق مرة أخرى، أو اكتب 'إلغاء'.`,
      },

      // No leave types available
      no_leave_types: {
        en: 'Sorry, no leave types are available for your profile. Please contact HR.',
        ur: 'معذرت، آپ کے پروفائل کے لیے کوئی چھٹی کی قسم دستیاب نہیں ہے۔ براہ کرم HR سے رابطہ کریں۔',
        ar: 'عذرًا، لا توجد أنواع إجازات متاحة لملفك الشخصي. يرجى الاتصال بالموارد البشرية.',
      },

      // Error fetching
      error_fetching: {
        en: 'Unable to fetch leave types. Please try again later.',
        ur: 'چھٹی کی اقسام حاصل کرنے میں ناکامی۔ براہ کرم بعد میں دوبارہ کوشش کریں۔',
        ar: 'تعذر جلب أنواع الإجازات. يرجى المحاولة مرة أخرى لاحقًا.',
      },
    };

    let response =
      responses[key]?.[this.userLanguage] || responses[key]?.en || '';

    // Replace placeholders
    Object.entries(params).forEach(([param, value]) => {
      response = response.replace(new RegExp(`{${param}}`, 'g'), value);
    });

    return response;
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
      console.log(
        '📡 Fetching leave codes for employee:',
        userData?.employeeId,
      );
      const leaveCodes = await RetrieveLeaveCodes({
        employeeId: userData?.employeeId,
      });

      console.log('📋 Received leave codes:', leaveCodes);

      if (
        !leaveCodes ||
        !Array.isArray(leaveCodes) ||
        leaveCodes.length === 0
      ) {
        this.reset();
        return {
          response: this.getResponse('no_leave_types'),
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

      const responseKey =
        this.leaveData.mode === 'leave_balance'
          ? 'ask_balance_type'
          : 'ask_leave_type';

      return {
        response: this.getResponse(responseKey, {leave_list: codesList}),
        next_state: 'awaiting_leave_type',
      };
    } catch (error) {
      console.error('❌ Error fetching leave codes:', error);
      this.reset();
      return {
        response: this.getResponse('error_fetching'),
        next_state: null,
      };
    }
  }

  // Enhanced parseLeaveTypeSelection for multilingual support - FIXED VERSION
  parseLeaveTypeSelection(userInput) {
    const availableLeaveCodes = this.leaveData.availableLeaveCodes || [];
    this.detectUserLanguage(userInput);
    const input = String(userInput || '').trim();

    console.log('🔍 Parsing leave type:', input);
    console.log('📊 Available codes:', availableLeaveCodes);

    if (!availableLeaveCodes.length) {
      console.log('❌ No available leave codes');
      return {success: false};
    }

    // 1. Try number extraction (FIXED: better number parsing)
    const num = extractNumber(userInput);
    console.log('🔢 Extracted number:', num);

    if (num !== null && num >= 1 && num <= availableLeaveCodes.length) {
      const idx = num - 1;
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

    // 2. Try simplified name matching with multilingual support
    for (const code of availableLeaveCodes) {
      const simpleName = this.simplifyLeaveName(
        code.LeaveDescription,
      ).toLowerCase();
      const descLower = (code.LeaveDescription || '').toLowerCase();

      // Check if input matches in any language
      const inputLower = input.toLowerCase();

      // Match with simplified name
      if (simpleName.includes(inputLower) || inputLower.includes(simpleName)) {
        console.log('✅ Matched by simplified name:', code);
        this.leaveData.leaveCode = code.LeaveCode || '';
        this.leaveData.leaveName = code.LeaveDescription || '';
        return {success: true, selected: code};
      }

      // Match with original description
      if (descLower.includes(inputLower) || inputLower.includes(descLower)) {
        console.log('✅ Matched by description:', code);
        this.leaveData.leaveCode = code.LeaveCode || '';
        this.leaveData.leaveName = code.LeaveDescription || '';
        return {success: true, selected: code};
      }
    }

    // 3. Try common leave types in multiple languages
    const commonLeaves = {
      annual: [
        'annual',
        'سالانہ',
        'سنوي',
        'annual leave',
        'سالانہ چھٹی',
        'إجازة سنوية',
      ],
      casual: [
        'casual',
        'عارضی',
        'عرضي',
        'casual leave',
        'عارضی چھٹی',
        'إجازة عرضية',
      ],
      sick: [
        'sick',
        'بیماری',
        'مرضي',
        'sick leave',
        'بیماری کی چھٹی',
        'إجازة مرضية',
      ],
    };

    for (const [key, translations] of Object.entries(commonLeaves)) {
      for (const translation of translations) {
        if (input.toLowerCase().includes(translation.toLowerCase())) {
          for (const code of availableLeaveCodes) {
            const descLower = (code.LeaveDescription || '').toLowerCase();
            if (descLower.includes(key)) {
              console.log('✅ Common multilingual match found:', code);
              this.leaveData.leaveCode = code.LeaveCode || '';
              this.leaveData.leaveName = code.LeaveDescription || '';
              return {success: true, selected: code};
            }
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
      response: this.getResponse('ask_leave_category'),
      next_state: 'awaiting_leave_category',
    };
  }

  parseLeaveCategory(userInput) {
    this.detectUserLanguage(userInput);
    const input = String(userInput || '')
      .trim()
      .toLowerCase();

    // Check for full day leave
    const fullDayKeywords = [
      '1',
      'full',
      'full day',
      'پورے دن',
      'يوم كامل',
      'کامل',
    ];
    const halfDayKeywords = [
      '2',
      'half',
      'half day',
      'آدھے دن',
      'نصف يوم',
      'نصف',
    ];

    if (fullDayKeywords.some(keyword => input.includes(keyword))) {
      this.leaveData.leaveCategoryLabel = 'Full Day Leave';
      this.leaveData.leaveCategory = 'FullLeave';
      this.state = 'awaiting_start_date';
      return {success: true};
    }

    // Check for half day leave
    if (halfDayKeywords.some(keyword => input.includes(keyword))) {
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
      response: this.getResponse('ask_start_date'),
      next_state: 'awaiting_start_date',
    };
  }

  parseStartDate(userInput) {
    const iso = parseAnyDateToISO(userInput);
    if (!iso) return {success: false};

    this.leaveData.leaveStartDate = iso;
    console.log('📅 Start date set:', iso);

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
      response: this.getResponse('ask_end_date'),
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
      response: this.getResponse('ask_reason', {start, end}),
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
        response: this.getResponse('balance_summary', {
          leave_name: this.leaveData.leaveName,
          leave_code: this.leaveData.leaveCode,
          balance: this.leaveData.balance,
          quota: this.leaveData.quota,
          eligibility: this.leaveData.eligibility,
        }),
        next_state: 'awaiting_confirmation',
      };
    }

    const missing = this.validateRequiredFields();
    if (missing.length > 0) {
      console.log('⚠️ Missing fields found:', missing);

      // Try to recover gracefully with language-specific messages
      if (missing.includes('leave type')) {
        this.state = 'awaiting_leave_type';
        return {
          response: this.getResponse('invalid_input'),
          next_state: 'awaiting_leave_type',
        };
      }

      if (missing.includes('start date')) {
        this.state = 'awaiting_start_date';
        return {
          response: this.getResponse('invalid_date'),
          next_state: 'awaiting_start_date',
        };
      }

      if (missing.includes('end date')) {
        this.state = 'awaiting_end_date';
        return {
          response: this.getResponse('invalid_date'),
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
          response: this.getResponse('need_dates'),
          next_state: 'awaiting_end_date',
        };
      }

      if (missing.includes('reason')) {
        this.state = 'awaiting_reason';
        return {
          response: this.getResponse('need_reason'),
          next_state: 'awaiting_reason',
        };
      }
    }

    // All fields present, show confirmation
    return {
      response: this.getResponse('confirmation', {
        leave_name: this.leaveData.leaveName,
        leave_code: this.leaveData.leaveCode,
        category: this.leaveData.leaveCategoryLabel,
        start_date: formatDisplayDate(this.leaveData.leaveStartDate),
        end_date: formatDisplayDate(this.leaveData.leaveEndDate),
        leave_days: this.leaveData.leaveDays,
        balance: this.leaveData.balance,
        quota: this.leaveData.quota,
        eligibility: this.leaveData.eligibility,
        reason: this.leaveData.reason,
      }),
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

export {
  LeaveRequestHandler,
  DynafaceInfo,
  detectIntent,
  generateIntelligentResponse,
  containsKeyword,
  extractNumber,
  detectLanguage,
};
