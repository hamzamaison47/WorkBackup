/**
 * AppComponents.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared component library for the app's unified UI design system.
 *
 * Based on the SettingsScreen design language:
 *   - White cards on #F1F5F9 page background
 *   - Uppercase gray card headings
 *   - Icon badge + title + subtitle rows with right chevron
 *   - Staggered spring entrance animations (settings-style screens only)
 *   - All sizing via conditionalScale / conditionalFontScale
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE EXAMPLE:
 *
 *   import {
 *     PageBackground,
 *     AnimatedCard,
 *     CardHeading,
 *     SettingRow,
 *     IconBadge,
 *     SectionLabel,
 *     Divider,
 *     EmptyState,
 *     FooterNote,
 *     RowSkeleton,
 *     BadgePill,
 *     CARD_STAGGER,
 *   } from '../../components/AppComponents';
 *
 *   <PageBackground>
 *     <AnimatedCard delay={0}>
 *       <CardHeading label="GENERAL" />
 *       <SettingRow
 *         icon="globe"
 *         iconColor="#0A66C2"
 *         iconBg="#E8F1FB"
 *         title="Language"
 *         subtitle="English"
 *         onPress={() => {}}
 *       />
 *       <SettingRow
 *         icon="calendar"
 *         iconColor="#6366F1"
 *         iconBg="#EDEFFD"
 *         title="Date & Time"
 *         subtitle="Manage preferences"
 *         onPress={() => {}}
 *         isLast
 *       />
 *     </AnimatedCard>
 *   </PageBackground>
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FILE STRUCTURE:
 *   tokens.js        — AppTokens + animation constants
 *   resolveIcon.js   — icon library resolver utility
 *   PageBackground.js
 *   Cards.js         — AnimatedCard, StaticCard
 *   Labels.js        — CardHeading, SectionLabel
 *   IconBadge.js
 *   Rows.js          — SettingRow, InfoRow
 *   AnimatedRow.js
 *   Divider.js
 *   EmptyState.js
 *   FooterNote.js
 *   RowSkeleton.js
 *   BadgePill.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Tokens & constants ────────────────────────────────────────────────────────
export {
  AppTokens,
  CARD_STAGGER,
  CARD_FADE_DUR,
  CARD_SPRING_SPEED,
  CARD_SPRING_BOUNCE,
  CARD_TRANSLATE_START,
  ROW_STAGGER,
  ROW_FADE_DUR,
  ROW_SLIDE_DUR,
} from './Tokens';

// ── Utility ───────────────────────────────────────────────────────────────────
export {default as resolveIcon} from './resolveIcon';

// ── Layout ────────────────────────────────────────────────────────────────────
export {default as PageBackground} from './PageBackground';

// ── Cards ────────────────────────────────────────────────────────────────────
export {AnimatedCard, StaticCard} from './Cards';

// ── Labels ────────────────────────────────────────────────────────────────────
export {CardHeading, SectionLabel} from './Labels';

// ── Icon ─────────────────────────────────────────────────────────────────────
export {default as IconBadge} from './IconBadge';

// ── Rows ─────────────────────────────────────────────────────────────────────
export {SettingRow, InfoRow} from './Rows';
export {default as AnimatedRow} from './AnimatedRow';

// ── Utility components ────────────────────────────────────────────────────────
export {default as Divider} from './Divider';
export {default as EmptyState} from './EmptyState';
export {default as FooterNote} from './FooterNote';
export {default as RowSkeleton} from './RowSkeleton';
export {default as BadgePill} from './BadgePill';
