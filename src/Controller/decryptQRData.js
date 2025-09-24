/* eslint-disable curly */

import CryptoJS from 'crypto-js';

export function decryptQRData(base64Data, secretKey) {
  if (!base64Data) throw new Error('No data provided to decrypt');

  const b64 = base64Data.trim();
  const raw = CryptoJS.enc.Base64.parse(b64);
  const totalBytes = raw.sigBytes;

  if (totalBytes <= 16) throw new Error('Encrypted payload too short');

  const ivWordArray = CryptoJS.lib.WordArray.create(raw.words.slice(0, 4), 16);

  const cipherWordArray = CryptoJS.lib.WordArray.create(
    raw.words.slice(4),
    totalBytes - 16,
  );

  const key = CryptoJS.SHA256(secretKey);

  const decrypted = CryptoJS.AES.decrypt({ciphertext: cipherWordArray}, key, {
    iv: ivWordArray,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const plainText = decrypted.toString(CryptoJS.enc.Utf8);

  if (!plainText) {
    throw new Error(
      'Decryption produced empty result (wrong key or corrupted data)',
    );
  }

  try {
    return JSON.parse(plainText);
  } catch (err) {
    throw new Error(
      'Decryption succeeded but JSON parse failed: ' + err.message,
    );
  }
}
