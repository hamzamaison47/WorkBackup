// hooks/useExtraWorkflowFields.js
import {useState, useEffect, useRef} from 'react';
import getWFRecordDetailHTMLResponse from '../API/WorkflowTrackingStatusTable/getWFRecordDetailHTMLResponse';
import {
  extractFieldsFromHtml,
  extractImageUriFromHtml,
} from '../utils/extractWorkflowFields';

const cache = new Map(); // recId -> {fields, imageUri}

export default function useExtraWorkflowFields(item, labels) {
  const [result, setResult] = useState(() => cache.get(item.recId) || null);
  const fetchedRef = useRef(null);

  const labelsKey = labels.join('|');

  useEffect(() => {
    if (cache.has(item.recId)) {
      setResult(cache.get(item.recId));
      return;
    }
    if (fetchedRef.current === item.recId) return;
    fetchedRef.current = item.recId;

    let cancelled = false;
    (async () => {
      try {
        const html = await getWFRecordDetailHTMLResponse({
          contextRecId: item.ContextRecId,
          tableId: item.ContextTableId,
        });
        const fields = labels.length ? extractFieldsFromHtml(html, labels) : {};
        const imageUri = extractImageUriFromHtml(html);
        if (item.TableName === 'PurchTable') {
          console.log('DEBUG raw HTML for PurchTable recId', item.recId, html);
        }
        const combined = {fields, imageUri};
        cache.set(item.recId, combined);
        if (!cancelled) setResult(combined);
      } catch (e) {
        const empty = {fields: {}, imageUri: null};
        cache.set(item.recId, empty);
        if (!cancelled) setResult(empty);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.recId, item.ContextRecId, item.ContextTableId, labelsKey]);

  // Returns { fields, imageUri } (or null while still loading / no data)
  return result;
}
