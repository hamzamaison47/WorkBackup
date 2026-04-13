/* eslint-disable react-native/no-inline-styles */
// ─────────────────────────────────────────────
// components/AttendanceManagement/ConfirmSheet.js
// Shared shell for Clock In / Clock Out / Break
// ─────────────────────────────────────────────
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from 'react-native';
import {
  formatDate,
  formatTime,
} from '../../screens/AttendanceManagement/helpers';
import {C, R, Sh} from './theme';

const ConfirmSheet = ({
  title,
  subtitle,
  status = 'Active',
  onBack,
  onConfirm,
  confirmLabel = 'Confirm',
  confirmColor,
  confirmDisabled = false,
  disableActions = false,
  onRefresh,
  refreshing = false,
  children,
}) => {
  const now = new Date();
  const btnColor = confirmColor ?? C.amber;

  return (
    <SafeAreaView style={S.screen}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity
          onPress={onBack}
          style={S.backBtn}
          disabled={disableActions}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Text style={S.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.title}>{title}</Text>
          <Text style={S.subtitle}>{subtitle}</Text>
        </View>
        <View style={{width: 40}} />
      </View>

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={S.body}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}>
        {/* Date / time strip */}
        <View style={S.dtRow}>
          <View style={S.dtCell}>
            <Text style={S.dtLabel}>DATE</Text>
            <Text style={S.dtValue}>{formatDate(now)}</Text>
          </View>
          <View style={S.dtDivider} />
          <View style={S.dtCell}>
            <Text style={S.dtLabel}>TIME</Text>
            <Text style={S.dtValue}>{formatTime(now)}</Text>
          </View>
        </View>

        <View style={S.sectionDivider} />

        {/* Screen-specific fields */}
        {children}
      </ScrollView>

      {/* Confirm button */}
      <View style={S.footer}>
        <TouchableOpacity
          style={[
            S.confirmBtn,
            {backgroundColor: btnColor},
            (confirmDisabled || disableActions) && S.confirmBtnDisabled,
          ]}
          onPress={onConfirm}
          disabled={confirmDisabled || disableActions}>
          <Text style={S.confirmTxt}>{'Confirm'}</Text>
          {/* <Text style={S.confirmTxt}>{confirmLabel}</Text> */}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ConfirmSheet;

const S = StyleSheet.create({
  screen: {flex: 1, backgroundColor: C.surface},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {width: 40, alignItems: 'flex-start'},
  backArrow: {fontSize: 24, color: C.inkSub},
  headerCenter: {flex: 1, alignItems: 'center'},
  title: {fontSize: 17, fontWeight: '700', color: C.ink},
  subtitle: {fontSize: 12, color: C.inkMuted, marginTop: 2},

  body: {padding: 20, paddingBottom: 32},

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...Sh.xs,
  },
  avatarTxt: {fontSize: 22, color: C.white, fontWeight: '700'},
  userName: {fontSize: 18, fontWeight: '700', color: C.ink},
  userMeta: {fontSize: 12, color: C.inkMuted, marginTop: 3},

  dtRow: {
    flexDirection: 'row',
    backgroundColor: C.surfaceAlt,
    borderRadius: R.sm,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  dtCell: {flex: 1, padding: 14},
  dtDivider: {width: 1, backgroundColor: C.border},
  dtLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.inkFaint,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dtValue: {fontSize: 14, fontWeight: '600', color: C.ink},

  sectionDivider: {height: 1, backgroundColor: C.border, marginBottom: 4},

  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  confirmBtn: {
    borderRadius: R.md,
    paddingVertical: 17,
    alignItems: 'center',
    ...Sh.sm,
  },
  confirmBtnDisabled: {opacity: 0.55},
  confirmTxt: {color: C.white, fontSize: 16, fontWeight: '700'},
});
