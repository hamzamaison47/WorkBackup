import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

/**
 * MultiSelectActionBar
 *
 * Slides DOWN from the top when multi-select mode is active.
 * Two-row layout so nothing overlaps on small screens:
 *   Row 1 — ✕ cancel  +  "N items selected"
 *   Row 2 — [Submit All]  [Delete All]  (equal width, full row)
 *
 * Props:
 *  - visible         {boolean}   Whether the bar is shown
 *  - selectedCount   {number}    How many cards are selected
 *  - onSubmitAll     {function}  Called when "Submit All" is pressed
 *  - onDeleteAll     {function}  Called when "Delete All" is pressed
 *  - onCancel        {function}  Called when the ✕ is pressed
 *  - submitLabel     {string}    (optional) Override "Submit All" label
 *  - deleteLabel     {string}    (optional) Override "Delete All" label
 *  - topOffset       {number}    (optional) Distance from top of container — default 0
 *  - isSubmitting    {boolean}   (optional) Shows spinner on Submit button
 *  - isDeleting      {boolean}   (optional) Shows spinner on Delete button
 */

const MultiSelectActionBar = ({
  visible = false,
  selectedCount = 0,
  onSubmitAll,
  onDeleteAll,
  onCancel,
  submitLabel = 'Submit All',
  deleteLabel = 'Delete All',
  topOffset = 0,
  isSubmitting = false,
  isDeleting = false,
}) => {
  // Starts off-screen above, slides down into view
  const translateY = useRef(new Animated.Value(-160)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const countScaleAnim = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(selectedCount);

  // ── Slide down in / slide up out ──
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 70,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -160,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

  // ── Count badge bounce on change ──
  useEffect(() => {
    if (selectedCount !== prevCount.current) {
      prevCount.current = selectedCount;
      Animated.sequence([
        Animated.spring(countScaleAnim, {
          toValue: 1.35,
          useNativeDriver: true,
          tension: 200,
          friction: 5,
        }),
        Animated.spring(countScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 5,
        }),
      ]).start();
    }
  }, [selectedCount, countScaleAnim]);

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        barStyles.wrapper,
        {
          top: topOffset,
          opacity,
          transform: [{translateY}],
        },
      ]}>
      <View style={barStyles.pill}>
        {/* ── Row 1: cancel button + selected count ── */}
        <View style={barStyles.topRow}>
          <TouchableOpacity
            onPress={onCancel}
            activeOpacity={0.7}
            style={barStyles.cancelButton}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <FontAwesome name="times" size={15} color="#64748b" />
          </TouchableOpacity>

          <View style={barStyles.countArea}>
            <Animated.View
              style={[
                barStyles.countBadge,
                {transform: [{scale: countScaleAnim}]},
              ]}>
              <Text style={barStyles.countNumber}>{selectedCount}</Text>
            </Animated.View>
            <Text style={barStyles.countLabel} numberOfLines={1}>
              {selectedCount === 1 ? 'item' : 'items'} selected
            </Text>
          </View>
        </View>

        {/* ── Horizontal divider ── */}
        <View style={barStyles.rule} />

        {/* ── Row 2: action buttons, equal width ── */}
        <View style={barStyles.bottomRow}>
          {/* Submit All */}
          <TouchableOpacity
            onPress={onSubmitAll}
            activeOpacity={0.8}
            disabled={selectedCount === 0 || isSubmitting || isDeleting}
            style={[
              barStyles.actionBtn,
              barStyles.submitBtn,
              (selectedCount === 0 || isSubmitting || isDeleting) &&
                barStyles.actionBtnDisabled,
            ]}>
            {isSubmitting ? (
              <FontAwesome
                name="circle-o-notch"
                size={13}
                color="#fff"
                style={barStyles.btnIcon}
              />
            ) : (
              <FontAwesome
                name="paper-plane"
                size={12}
                color="#fff"
                style={barStyles.btnIcon}
              />
            )}
            <Text style={barStyles.submitText} numberOfLines={1}>
              {isSubmitting ? 'Submitting…' : submitLabel}
            </Text>
          </TouchableOpacity>

          {/* Delete All */}
          <TouchableOpacity
            onPress={onDeleteAll}
            activeOpacity={0.8}
            disabled={selectedCount === 0 || isDeleting || isSubmitting}
            style={[
              barStyles.actionBtn,
              barStyles.deleteBtn,
              (selectedCount === 0 || isDeleting || isSubmitting) &&
                barStyles.actionBtnDisabled,
            ]}>
            {isDeleting ? (
              <FontAwesome
                name="circle-o-notch"
                size={13}
                color="#fff"
                style={barStyles.btnIcon}
              />
            ) : (
              <FontAwesome
                name="trash"
                size={13}
                color="#fff"
                style={barStyles.btnIcon}
              />
            )}
            <Text style={barStyles.deleteText} numberOfLines={1}>
              {isDeleting ? 'Deleting…' : deleteLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const barStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  pill: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.15)',
    elevation: 24,
  },

  // ── Row 1 ──
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  cancelButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  countArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1, // takes remaining space so text never overflows
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    flexShrink: 0,
  },
  countNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  countLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    flexShrink: 1,
  },

  // ── Divider ──
  rule: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 10,
  },

  // ── Row 2 ──
  bottomRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1, // equal width for both buttons
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnDisabled: {
    opacity: 0.45,
  },
  submitBtn: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  submitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  deleteBtn: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  btnIcon: {
    marginTop: Platform.OS === 'ios' ? 0.5 : 0,
  },
});

export default MultiSelectActionBar;
