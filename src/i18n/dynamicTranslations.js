// Translation mappings for Dynamics data
export const dynamicTranslations = {
  en: {
    // Leave Categories
    leaveCategories: {
      FullLeave: 'Full Day Leave',
      HalfLeave: 'Half Day Leave',
    },

    // Workflow Status
    workflowStatus: {
      NotSubmitted: 'Draft',
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
    },

    // Field Labels (for card display)
    fieldLabels: {
      'Leave Start Date': 'Leave Start Date',
      'Leave End Date': 'Leave End Date',
      'Leave Days': 'Leave Days',
      'Leave Request ID': 'Leave Request ID',
      'Leave Category': 'Leave Category',
      'Leave Request Date': 'Leave Request Date',
      Balance: 'Balance',
      Reason: 'Reason',
    },
  },

  ur: {
    // Leave Categories
    leaveCategories: {
      FullLeave: 'پورے دن کی چھٹی',
      HalfLeave: 'آدھے دن کی چھٹی',
    },

    // Workflow Status
    workflowStatus: {
      NotSubmitted: 'مسودہ',
      Approved: 'منظور شدہ',
      Cancelled: 'منسوخ',
      Rejected: 'مسترد',
      Submitted: 'جمع کرایا گیا',
      ChangeRequest: 'تبدیلی کی درخواست',
      PendingCancellation: 'منسوخی زیر التواء',
      Returned: 'واپس',
      PendingApproval: 'منظوری زیر التواء',
      PendingComplete: 'تکمیل زیر التواء',
      WorkflowCompleted: 'ورک فلو مکمل',
      Completed: 'مکمل',
      Failed: 'ناکام',
    },

    // Field Labels
    fieldLabels: {
      'Leave Start Date': 'چھٹی شروع ہونے کی تاریخ',
      'Leave End Date': 'چھٹی ختم ہونے کی تاریخ',
      'Leave Days': 'چھٹی کے دن',
      'Leave Request ID': 'چھٹی کی درخواست ID',
      'Leave Category': 'چھٹی کی قسم',
      'Leave Request Date': 'درخواست کی تاریخ',
      Balance: 'بیلنس',
      Reason: 'وجہ',
    },
  },
};

// Helper function to translate dynamic values
export const translateDynamicValue = (category, value, language = 'en') => {
  try {
    const translation = dynamicTranslations[language]?.[category]?.[value];
    return translation || value; // Fallback to original if no translation
  } catch (error) {
    console.warn(`Translation not found for ${category}.${value}`);
    return value;
  }
};
