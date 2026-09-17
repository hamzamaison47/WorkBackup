const escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const extractFieldsFromHtml = (html, labels) => {
  const result = {};
  if (!html) return result;

  labels.forEach(label => {
    const safeLabel = escapeRegExp(label);
    const re = new RegExp(
      `<td[^>]*>\\s*${safeLabel}\\s*</td>\\s*<td[^>]*>([\\s\\S]*?)</td>`,
      'i',
    );
    const match = html.match(re);
    if (match) result[label] = match[1].trim();
  });

  return result;
};

export const extractImageUriFromHtml = html => {
  if (!html) return null;

  const {Image: imageTagHtml} = extractFieldsFromHtml(html, ['Image']);
  if (!imageTagHtml) return null;

  const srcMatch = imageTagHtml.match(/src=['"]([^'"]+)['"]/i);
  if (!srcMatch) return null;

  const uri = srcMatch[1].trim();
  if (!uri || uri.length < 30) return null;

  return uri;
};
