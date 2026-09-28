import {AppTokens} from '../components/AppComponentsDesign/Appcomponents';

export const getStatusColors = status => {
  // "Not Submitted", "not  submitted" and nbsp variants all become "notsubmitted"
  const s = String(status ?? '')
    .toLowerCase()
    .replace(/\s+/g, '');

  if (['active', 'approved', 'success', 'yes', 'true'].includes(s)) {
    return {bg: AppTokens.greenBg, text: '#065F46', dot: AppTokens.green};
  }
  if (s === 'completed') {
    return {bg: AppTokens.purpleBg, text: '#4C1D95', dot: AppTokens.purple};
  }
  if (
    [
      'pending',
      'pendingapproval',
      'inreview',
      'waiting',
      'processing',
      'inprogress',
    ].includes(s)
  ) {
    // "Waiting" family: slate, not amber (see statusWaiting* in Tokens.js).
    return {
      bg: AppTokens.statusWaitingBg,
      text: AppTokens.statusWaitingText,
      dot: AppTokens.statusWaiting,
    };
  }
  if (
    ['cancelled', 'canceled', 'rejected', 'failed', 'no', 'false'].includes(s)
  ) {
    return {bg: AppTokens.redBg, text: '#991B1B', dot: AppTokens.red};
  }
  if (['draft', 'notsubmitted'].includes(s)) {
    // "Draft" family: lighter neutral than waiting (statusDraft* in Tokens.js).
    return {
      bg: AppTokens.statusDraftBg,
      text: AppTokens.statusDraftText,
      dot: AppTokens.statusDraft,
    };
  }
  return {bg: AppTokens.slateBg, text: AppTokens.slate, dot: '#94A3B8'};
};
