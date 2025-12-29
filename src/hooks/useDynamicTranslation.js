import {useTranslation} from 'react-i18next';
import {translateDynamicValue} from '../i18n/dynamicTranslations';

export const useDynamicTranslation = () => {
  const {i18n} = useTranslation();
  const currentLanguage = i18n.language;

  const translateLeaveType = value => {
    return translateDynamicValue('leaveTypes', value, currentLanguage);
  };

  const translateLeaveCategory = value => {
    return translateDynamicValue('leaveCategories', value, currentLanguage);
  };

  const translateWorkflowStatus = value => {
    return translateDynamicValue('workflowStatus', value, currentLanguage);
  };

  const translateFieldLabel = value => {
    return translateDynamicValue('fieldLabels', value, currentLanguage);
  };

  return {
    translateLeaveType,
    translateLeaveCategory,
    translateWorkflowStatus,
    translateFieldLabel,
    currentLanguage,
  };
};
