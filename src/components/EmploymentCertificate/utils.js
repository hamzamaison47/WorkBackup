/* eslint-disable curly */
/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {Image} from 'react-native';

export const getFormatIcon = format => {
  const formatType = format?.toLowerCase();

  let source = require('../../assets/Certificate/file.png');
  if (formatType === 'pdf') {
    source = require('../../assets/Certificate/pdf.png');
  } else if (['word', 'doc', 'docx'].includes(formatType)) {
    source = require('../../assets/Certificate/doc.png');
  }

  return (
    <Image
      source={source}
      style={{
        width: 36,
        height: 36,
        resizeMode: 'contain',
      }}
    />
  );
};

export const getFormatText = format => {
  const formatType = format?.toLowerCase();
  if (formatType === 'pdf') return 'PDF Document';
  if (['word', 'doc', 'docx'].includes(formatType)) return 'Word Document';
  return format || 'Document';
};
