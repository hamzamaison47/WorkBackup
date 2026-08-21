// import {useState, useMemo, useEffect, useCallback} from 'react';
// import {matchesDateRange} from '../store/utils/dateFilter';

// // ─────────────────────────────────────────────────────────────────────────────
// //  useListFilters — single owner of a list page's filter/sort/search state and
// //  the faceted pipeline that derives the rendered list. Pure derivation (no
// //  setState side-channels), so sort/search/filters always reflect consistently.
// //
// //  Config:
// //    data          source array (the screen's fetched rows)
// //    dateField     field used for the Date filter + Sort (default createdDateTime);
// //                  resolved case-insensitively against the data, so
// //                  CreatedDateTime / a:CreatedDateTime all match. Absent under
// //                  any casing → the header trigger is disabled but still shown.
// //    searchFields  array of field names to search; omit to scan all values
// //    searchPredicate  (item, qLower) => bool — overrides searchFields if given
// //    classifyPill  item => pill label | null — maps a row to its status pill
// //                  (omit for a screen with no pills)
// //    pills         optional static pill list (e.g. ['All','Pending','Returned']);
// //                  when given, the pill row never shrinks. Omit to derive the
// //                  visible pills from whatever classifyPill yields in the base.
// //
// //  Returns filter state + setters, derived documentTypes / visiblePills /
// //  filterCounts / filteredData, and `actionPaneProps` to spread into
// //  ActionPaneContainer for the header pills + search.
// // ─────────────────────────────────────────────────────────────────────────────
// const buildFieldPredicate = searchFields => (item, q) =>
//   searchFields.some(f =>
//     String(item?.[f] ?? '')
//       .toLowerCase()
//       .includes(q),
//   );

// const scanAllPredicate = (item, q) =>
//   Object.values(item || {}).some(v =>
//     String(v ?? '')
//       .toLowerCase()
//       .includes(q),
//   );

// export default function useListFilters({
//   data = [],
//   dateField = 'createdDateTime',
//   searchFields = null,
//   searchPredicate = null,
//   classifyPill = null,
//   pills = null,
//   // Universal header filter — which sections the top-right trigger surfaces.
//   showDateFilter = true,
//   showSortControl = true,
// }) {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [sortOrder, setSortOrder] = useState(null);
//   const [activeFilter, setActiveFilter] = useState('All');
//   const [selectedDocumentTypes, setSelectedDocumentTypes] = useState([]);
//   const [selectedDateRange, setSelectedDateRange] = useState('all');

//   // Selectable document types — derived from the full source list so options
//   // don't shrink while a search/date filter narrows the view.
//   const documentTypes = useMemo(
//     () => [...new Set(data.map(item => item.documentType).filter(Boolean))],
//     [data],
//   );

//   // Resolve the configured dateField against real data, tolerant to casing and a
//   // leading SOAP `a:` prefix — CreatedDateTime / createdDateTime /
//   // a:CreatedDateTime all collapse to one key. Returns the actual key present in
//   // the rows (so sort + date-filter operate on it), or null when no row carries
//   // it under any casing → the header trigger stays disabled until it appears.
//   const resolvedDateField = useMemo(() => {
//     const norm = k => String(k).replace(/^a:/i, '').toLowerCase();
//     const target = norm(dateField);
//     if (!target) {
//       return null;
//     }
//     if (
//       data.some(item => item?.[dateField] != null && item[dateField] !== '')
//     ) {
//       return dateField;
//     }
//     for (const item of data) {
//       if (!item) {
//         continue;
//       }
//       const key = Object.keys(item).find(
//         k => norm(k) === target && item[k] != null && item[k] !== '',
//       );
//       if (key) {
//         return key;
//       }
//     }
//     return null;
//   }, [data, dateField]);
//   const hasDateField = resolvedDateField != null;
//   const activeDateField = resolvedDateField || dateField;

//   // 1) Search.
//   const searched = useMemo(() => {
//     const q = searchQuery.trim().toLowerCase();
//     if (!q) {
//       return data;
//     }
//     const pred =
//       searchPredicate ||
//       (searchFields ? buildFieldPredicate(searchFields) : scanAllPredicate);
//     return data.filter(item => pred(item, q));
//   }, [data, searchQuery, searchFields, searchPredicate]);

//   // 2) Sort (orthogonal — reorders, removes nothing).
//   const sorted = useMemo(() => {
//     if (!sortOrder) {
//       return searched;
//     }
//     const copy = [...searched];
//     copy.sort((a, b) => {
//       const da = new Date(a?.[activeDateField] || 0);
//       const db = new Date(b?.[activeDateField] || 0);
//       return sortOrder === 'asc' ? da - db : db - da;
//     });
//     return copy;
//   }, [searched, sortOrder, activeDateField]);

//   // 3) pillBase — document-type + date AND, but NOT the active pill, so pill
//   //    counts/visibility react to those facets.
//   const pillBase = useMemo(() => {
//     let base = sorted;
//     if (selectedDocumentTypes.length > 0) {
//       base = base.filter(item =>
//         selectedDocumentTypes.includes(item.documentType),
//       );
//     }
//     if (selectedDateRange && selectedDateRange !== 'all') {
//       base = base.filter(item =>
//         matchesDateRange(item[activeDateField], selectedDateRange),
//       );
//     }
//     return base;
//   }, [sorted, selectedDocumentTypes, selectedDateRange, activeDateField]);

//   // Faceted counts off pillBase.
//   const filterCounts = useMemo(() => {
//     const counts = {All: pillBase.length};
//     if (classifyPill) {
//       const labels = pills
//         ? pills.filter(p => p !== 'All')
//         : [
//             ...new Set(
//               pillBase.map(item => classifyPill(item)).filter(Boolean),
//             ),
//           ];
//       labels.forEach(label => {
//         counts[label] = pillBase.filter(
//           item => classifyPill(item) === label,
//         ).length;
//       });
//     }
//     return counts;
//   }, [pillBase, classifyPill, pills]);

//   // Visible pills — static list (never shrinks) or derived from the base.
//   const visiblePills = useMemo(() => {
//     if (pills) {
//       return pills;
//     }
//     if (!classifyPill || !pillBase.length) {
//       return ['All'];
//     }
//     return [
//       'All',
//       ...new Set(pillBase.map(item => classifyPill(item)).filter(Boolean)),
//     ];
//   }, [pills, classifyPill, pillBase]);

//   // Final list: pillBase narrowed by the active pill.
//   const filteredData = useMemo(() => {
//     if (activeFilter === 'All' || !classifyPill) {
//       return pillBase;
//     }
//     return pillBase.filter(item => classifyPill(item) === activeFilter);
//   }, [pillBase, activeFilter, classifyPill]);

//   // Auto-revert: if the active pill has no rows under the current facets, snap
//   // back to 'All' so the user isn't stranded on an empty list.
//   const activePillEmpty = activeFilter !== 'All' && !filterCounts[activeFilter];
//   useEffect(() => {
//     if (activePillEmpty) {
//       setActiveFilter('All');
//     }
//   }, [activePillEmpty]);

//   const onSearchChange = useCallback(text => setSearchQuery(text), []);
//   const onSortChange = useCallback(sort => setSortOrder(sort), []);
//   const onDocumentTypeChange = useCallback(
//     next => setSelectedDocumentTypes(next),
//     [],
//   );
//   const onDateRangeChange = useCallback(key => setSelectedDateRange(key), []);

//   // Badge for the universal header trigger — only its own facets (date + sort).
//   const dateActive = !!selectedDateRange && selectedDateRange !== 'all';
//   const headerFilterCount = (dateActive ? 1 : 0) + (sortOrder ? 1 : 0);

//   // Spread into ActionPaneContainer to drive the header pills + search + the
//   // universal Date/Sort trigger. Splitting the trigger's *location* (header vs
//   // body) must not split the *state*: the header trigger reads/writes the same
//   // handlers as the body bar, so counts/AND/auto-revert stay unified.
//   const actionPaneProps = {
//     showFilterPills: !!classifyPill || !!pills,
//     filterPills: visiblePills,
//     activeFilter,
//     onFilterChange: setActiveFilter,
//     filterCounts,
//     onSearchChange,
//     // Piped through the spread so opt-in screens need no per-screen re-plumbing.
//     // null when both sections are disabled → the header trigger doesn't render.
//     headerFilter:
//       showDateFilter || showSortControl
//         ? {
//             showDateFilter,
//             showSortControl,
//             selectedDateRange,
//             onDateRangeChange,
//             sortOrder,
//             onSortChange,
//             badgeCount: headerFilterCount,
//             // Two independent disable conditions (icon still always renders):
//             // the list is empty, OR the resolved created-date field is absent
//             // from the data under any casing (nothing to sort/filter on).
//             disabled: data.length === 0 || !hasDateField,
//           }
//         : null,
//   };

//   return {
//     // state
//     searchQuery,
//     sortOrder,
//     activeFilter,
//     selectedDocumentTypes,
//     selectedDateRange,
//     // setters / handlers
//     setActiveFilter,
//     onSearchChange,
//     onSortChange,
//     onDocumentTypeChange,
//     onDateRangeChange,
//     setSelectedDocumentTypes,
//     setSelectedDateRange,
//     // derived
//     documentTypes,
//     visiblePills,
//     filterCounts,
//     filteredData,
//     pillBase,
//     // convenience
//     actionPaneProps,
//   };
// }
import {useState, useMemo, useEffect, useCallback} from 'react';
import {matchesDateRange} from '../store/utils/dateFilter';

// ─────────────────────────────────────────────────────────────────────────────
//  useListFilters — single owner of a list page's filter/sort/search state and
//  the faceted pipeline that derives the rendered list. Pure derivation (no
//  setState side-channels), so sort/search/filters always reflect consistently.
//
//  Config:
//    data          source array (the screen's fetched rows)
//    dateField     field used for the Date filter + Sort (default createdDateTime);
//                  resolved case-insensitively against the data, so
//                  CreatedDateTime / a:CreatedDateTime all match. Absent under
//                  any casing → the header trigger is disabled but still shown.
//    searchFields  array of field names to search; omit to scan all values
//    searchPredicate  (item, qLower) => bool — overrides searchFields if given
//    classifyPill  item => pill label | null — maps a row to its status pill
//                  (omit for a screen with no pills)
//    pills         optional static pill list (e.g. ['All','Pending','Returned']);
//                  when given, the pill row never shrinks. Omit to derive the
//                  visible pills from whatever classifyPill yields in the base.
//
//  Returns filter state + setters, derived documentTypes / visiblePills /
//  filterCounts / documentTypeCounts / filteredData, and `actionPaneProps` to
//  spread into ActionPaneContainer for the header pills + search.
// ─────────────────────────────────────────────────────────────────────────────
const buildFieldPredicate = searchFields => (item, q) =>
  searchFields.some(f =>
    String(item?.[f] ?? '')
      .toLowerCase()
      .includes(q),
  );

const scanAllPredicate = (item, q) =>
  Object.values(item || {}).some(v =>
    String(v ?? '')
      .toLowerCase()
      .includes(q),
  );

export default function useListFilters({
  data = [],
  dateField = 'createdDateTime',
  searchFields = null,
  searchPredicate = null,
  classifyPill = null,
  pills = null,
  // Universal header filter — which sections the top-right trigger surfaces.
  showDateFilter = true,
  showSortControl = true,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState('all');

  // Selectable document types — derived from the full source list so options
  // don't shrink while a search/date filter narrows the view.
  const documentTypes = useMemo(
    () => [...new Set(data.map(item => item.documentType).filter(Boolean))],
    [data],
  );

  // Resolve the configured dateField against real data, tolerant to casing and a
  // leading SOAP `a:` prefix — CreatedDateTime / createdDateTime /
  // a:CreatedDateTime all collapse to one key. Returns the actual key present in
  // the rows (so sort + date-filter operate on it), or null when no row carries
  // it under any casing → the header trigger stays disabled until it appears.
  const resolvedDateField = useMemo(() => {
    const norm = k => String(k).replace(/^a:/i, '').toLowerCase();
    const target = norm(dateField);
    if (!target) {
      return null;
    }
    if (
      data.some(item => item?.[dateField] != null && item[dateField] !== '')
    ) {
      return dateField;
    }
    for (const item of data) {
      if (!item) {
        continue;
      }
      const key = Object.keys(item).find(
        k => norm(k) === target && item[k] != null && item[k] !== '',
      );
      if (key) {
        return key;
      }
    }
    return null;
  }, [data, dateField]);
  const hasDateField = resolvedDateField != null;
  const activeDateField = resolvedDateField || dateField;

  // 1) Search.
  const searched = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return data;
    }
    const pred =
      searchPredicate ||
      (searchFields ? buildFieldPredicate(searchFields) : scanAllPredicate);
    return data.filter(item => pred(item, q));
  }, [data, searchQuery, searchFields, searchPredicate]);

  // 2) Sort (orthogonal — reorders, removes nothing).
  const sorted = useMemo(() => {
    if (!sortOrder) {
      return searched;
    }
    const copy = [...searched];
    copy.sort((a, b) => {
      const da = new Date(a?.[activeDateField] || 0);
      const db = new Date(b?.[activeDateField] || 0);
      return sortOrder === 'asc' ? da - db : db - da;
    });
    return copy;
  }, [searched, sortOrder, activeDateField]);

  // 3) pillBase — document-type + date AND, but NOT the active pill, so pill
  //    counts/visibility react to those facets.
  const pillBase = useMemo(() => {
    let base = sorted;
    if (selectedDocumentTypes.length > 0) {
      base = base.filter(item =>
        selectedDocumentTypes.includes(item.documentType),
      );
    }
    if (selectedDateRange && selectedDateRange !== 'all') {
      base = base.filter(item =>
        matchesDateRange(item[activeDateField], selectedDateRange),
      );
    }
    return base;
  }, [sorted, selectedDocumentTypes, selectedDateRange, activeDateField]);

  // Base for document-type counts: narrowed by search, date range, and the
  // active status pill — but NOT by the document-type selection itself, so
  // every type pill keeps an accurate count and stays visible while others
  // are selected (standard multi-select facet behavior).
  const docTypeBase = useMemo(() => {
    let base = sorted;
    if (selectedDateRange && selectedDateRange !== 'all') {
      base = base.filter(item =>
        matchesDateRange(item[activeDateField], selectedDateRange),
      );
    }
    if (activeFilter !== 'All' && classifyPill) {
      base = base.filter(item => classifyPill(item) === activeFilter);
    }
    return base;
  }, [sorted, selectedDateRange, activeDateField, activeFilter, classifyPill]);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSortOrder(null);
    setActiveFilter('All');
    setSelectedDocumentTypes([]);
    setSelectedDateRange('all');
  }, []);

  const documentTypeCounts = useMemo(() => {
    const counts = {};
    documentTypes.forEach(type => {
      counts[type] = docTypeBase.filter(
        item => item.documentType === type,
      ).length;
    });
    return counts;
  }, [docTypeBase, documentTypes]);

  // Faceted counts off pillBase.
  const filterCounts = useMemo(() => {
    const counts = {All: pillBase.length};
    if (classifyPill) {
      const labels = pills
        ? pills.filter(p => p !== 'All')
        : [
            ...new Set(
              pillBase.map(item => classifyPill(item)).filter(Boolean),
            ),
          ];
      labels.forEach(label => {
        counts[label] = pillBase.filter(
          item => classifyPill(item) === label,
        ).length;
      });
    }
    return counts;
  }, [pillBase, classifyPill, pills]);

  // Visible pills — static list (never shrinks) or derived from the base.
  const visiblePills = useMemo(() => {
    if (pills) {
      return pills;
    }
    if (!classifyPill || !pillBase.length) {
      return ['All'];
    }
    return [
      'All',
      ...new Set(pillBase.map(item => classifyPill(item)).filter(Boolean)),
    ];
  }, [pills, classifyPill, pillBase]);

  // Final list: pillBase narrowed by the active pill.
  const filteredData = useMemo(() => {
    if (activeFilter === 'All' || !classifyPill) {
      return pillBase;
    }
    return pillBase.filter(item => classifyPill(item) === activeFilter);
  }, [pillBase, activeFilter, classifyPill]);

  // Auto-revert: if the active pill has no rows under the current facets, snap
  // back to 'All' so the user isn't stranded on an empty list.
  const activePillEmpty = activeFilter !== 'All' && !filterCounts[activeFilter];
  useEffect(() => {
    if (activePillEmpty) {
      setActiveFilter('All');
    }
  }, [activePillEmpty]);

  const onSearchChange = useCallback(text => setSearchQuery(text), []);
  const onSortChange = useCallback(sort => setSortOrder(sort), []);
  const onDocumentTypeChange = useCallback(
    next => setSelectedDocumentTypes(next),
    [],
  );
  const onDateRangeChange = useCallback(key => setSelectedDateRange(key), []);

  // Badge for the universal header trigger — only its own facets (date + sort).
  const dateActive = !!selectedDateRange && selectedDateRange !== 'all';
  const headerFilterCount = (dateActive ? 1 : 0) + (sortOrder ? 1 : 0);

  // Spread into ActionPaneContainer to drive the header pills + search + the
  // universal Date/Sort trigger. Splitting the trigger's *location* (header vs
  // body) must not split the *state*: the header trigger reads/writes the same
  // handlers as the body bar, so counts/AND/auto-revert stay unified.
  const actionPaneProps = {
    showFilterPills: !!classifyPill || !!pills,
    filterPills: visiblePills,
    activeFilter,
    onFilterChange: setActiveFilter,
    filterCounts,
    onSearchChange,
    // Piped through the spread so opt-in screens need no per-screen re-plumbing.
    // null when both sections are disabled → the header trigger doesn't render.
    headerFilter:
      showDateFilter || showSortControl
        ? {
            showDateFilter,
            showSortControl,
            selectedDateRange,
            onDateRangeChange,
            sortOrder,
            onSortChange,
            badgeCount: headerFilterCount,
            // Two independent disable conditions (icon still always renders):
            // the list is empty, OR the resolved created-date field is absent
            // from the data under any casing (nothing to sort/filter on).
            disabled: data.length === 0 || !hasDateField,
          }
        : null,
  };

  return {
    // state
    searchQuery,
    sortOrder,
    activeFilter,
    selectedDocumentTypes,
    selectedDateRange,
    // setters / handlers
    setActiveFilter,
    onSearchChange,
    onSortChange,
    onDocumentTypeChange,
    onDateRangeChange,
    setSelectedDocumentTypes,
    setSelectedDateRange,
    resetFilters,
    // derived
    documentTypes,
    visiblePills,
    filterCounts,
    documentTypeCounts,
    filteredData,
    pillBase,
    // convenience
    actionPaneProps,
  };
}
