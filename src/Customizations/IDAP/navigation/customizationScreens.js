// ─────────────────────────────────────────────────────────────────────────
// IDAP customization screens — local menu-item registration
//
// The app registers navigable screens by looping over `state.menuItem.menuItems`
// (the backend menu) in DrawerNavigator/TabNavigator and mounting a screen for
// every entry whose MenuId resolves in `screenMapping`. Sub-pages (e.g. the
// original `ExpenseManagmentLinesListPage`) are navigable only because the
// backend menu enumerates them — usually as hidden entries (Visible '0').
//
// Newly added IDAP sub-pages are NOT in the backend menu yet, so
// `navigation.navigate('<id>')` fails with "was not handled by any navigator".
// These stubs inject those ids into `menuItems` locally so the SAME navigator
// loop registers them. They are shaped exactly like fetchEmployeeMenuItems()
// output and kept fully hidden (Visible '0', all Display* off) so they never
// surface as dashboard tiles, footer tabs, or side-nav rows — they are reached
// only via navigation.navigate().
//
// Merge is de-duplicated by MenuId: if/when the backend starts returning one of
// these ids, the backend copy wins and no duplicate route is registered.
// ─────────────────────────────────────────────────────────────────────────

const hiddenScreen = (menuId, label) => ({
  LegalEntity: '',
  FullName: '',
  AccessLevel: '',
  Image: '',
  Label: label,
  MenuId: menuId,
  ModuleId: '',
  Object: '',
  ParentId: '',
  RoleId: '',
  Sequence: '',
  Type: '',
  Visible: '0',
  DisplayOnFooter: 'No',
  DisplayOnHeader: 'No',
  DisplayOnMainScreen: 'No',
  DisplayOnSideNavigation: 'No',
});

export const CUSTOMIZATION_MENU_SCREENS = [
  // Medical Expense Lines list — navigated to from the Medical header list and
  // from the Medical header create screen. Not a backend menu entry.
  hiddenScreen('MedicalExpenseLinesListPage', 'Medical Expense Lines'),
  // Medical Expense Line create form — navigated to from the lines list (Add).
  // Not a backend menu entry.
  hiddenScreen('MedicalExpenseLinesSaveRecord', 'Medical Expense Line'),
  // Travel Requisition Lines list — navigated to from the Travel header list and
  // from the Travel header create screen. Not a backend menu entry.
  hiddenScreen('TravelRequisitionLinesListPage', 'Travel Requisition Lines'),
  // Travel Requisition Line create form — navigated to from the lines list (Add).
  // Not a backend menu entry.
  hiddenScreen('TravelRequisitionLinesSaveRecord', 'Travel Requisition Line'),
  // Expense Management Lines list (the NEW expense module, not Medical) —
  // navigated to from the expense header list and from the header create screen
  // after a successful create. Not a backend menu entry.
  hiddenScreen('ExpenseManagementLinesListPage', 'Expense Lines'),
  // Expense Management Line create form — navigated to from the lines list (Add).
  // Not a backend menu entry.
  hiddenScreen('ExpenseManagementLineSaveRecord', 'Expense Line'),
];

/**
 * Append the IDAP customization screen stubs to a menu-items array, skipping any
 * id already present (backend wins). Safe to call on every setMenuItems dispatch.
 */
export const withCustomizationScreens = (menuItems = []) => {
  const list = Array.isArray(menuItems) ? menuItems : [];
  const existing = new Set(list.map(item => item?.MenuId));
  const additions = CUSTOMIZATION_MENU_SCREENS.filter(
    screen => !existing.has(screen.MenuId),
  );
  return additions.length ? [...list, ...additions] : list;
};
