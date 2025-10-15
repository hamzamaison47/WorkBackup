import React from 'react';
import {TouchableOpacity, View, Text, StyleSheet} from 'react-native';
import {getFormatIcon, getFormatText} from './utils';

const CertificateCard = ({certificate, onPress}) => {
  const {CertificateTypeCode, TemplateName, LetterGenerationType, Encrypt} =
    certificate;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(certificate)}
      activeOpacity={0.9}>
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            LetterGenerationType?.toLowerCase() === 'pdf'
              ? styles.pdfIcon
              : styles.wordIcon,
          ]}>
          {getFormatIcon(LetterGenerationType)}
          {/* <Text style={styles.iconText}>
            {getFormatIcon(LetterGenerationType)}
          </Text> */}
        </View>

        <View style={styles.headerTextContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {CertificateTypeCode || 'Untitled Certificate'}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {TemplateName || 'No template assigned'}
          </Text>
        </View>

        <View style={styles.formatBadge}>
          <Text style={styles.formatText}>
            {getFormatText(LetterGenerationType)}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View
          style={[
            styles.encryptBadge,
            Encrypt === 'Yes' ? styles.encrypted : styles.standard,
          ]}>
          <Text
            style={[
              styles.encryptText,
              Encrypt === 'Yes' ? styles.encryptedText : styles.standardText,
            ]}>
            {Encrypt === 'Yes' ? '🔒 Encrypted' : '🔓 Standard'}
          </Text>
        </View>

        <View style={styles.requestContainer}>
          <Text style={styles.requestText}>Tap to Request</Text>
          <Text style={styles.arrow}>→</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CertificateCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  iconText: {fontSize: 24},

  headerTextContainer: {flex: 1, marginRight: 10},
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },

  formatBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  formatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    letterSpacing: 0.2,
  },

  // FOOTER
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    marginTop: 4,
  },
  encryptBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  encrypted: {backgroundColor: '#fee2e2'},
  standard: {backgroundColor: '#e0f2fe'},
  encryptText: {fontSize: 12, fontWeight: '600', letterSpacing: 0.2},
  encryptedText: {color: '#b91c1c'},
  standardText: {color: '#0369a1'},

  requestContainer: {flexDirection: 'row', alignItems: 'center', gap: 6},
  requestText: {fontSize: 13, fontWeight: '600', color: '#2563eb'},
  arrow: {fontSize: 18, fontWeight: 'bold', color: '#2563eb'},
});
