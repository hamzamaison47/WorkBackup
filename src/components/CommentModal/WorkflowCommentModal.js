import React, {useState, useEffect, useRef} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import useAppTokens from '../AppComponentsDesign/useAppTokens';
import {
  conditionalScale,
  conditionalVerticalScale,
  conditionalFontScale,
} from '../../store/utils/scaling';

const WorkflowCommentModal = ({
  visible,
  title = 'Submit Request',
  message = 'Add an optional comment before submitting.',
  placeholder = 'Type your comment…',
  onCancel,
  onSubmit,
  onRequestClose,
  isProcessing = false,
}) => {
  const T = useAppTokens();
  const [comment, setComment] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setComment('');
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [fadeAnim, visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onRequestClose}>
      <TouchableWithoutFeedback onPress={onRequestClose}>
        <View
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            paddingHorizontal: conditionalScale(20, 22, 24, 24),
          }}>
          <TouchableWithoutFeedback>
            <Animated.View
              // eslint-disable-next-line react-native/no-inline-styles
              style={{
                opacity: fadeAnim,
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1],
                    }),
                  },
                ],
                backgroundColor: T.cardBg,
                borderRadius: conditionalScale(14, 15, 16, 16),
                padding: conditionalScale(18, 19, 20, 20),
                borderWidth: 1,
                borderColor: T.cardDivider,
                shadowColor: T.shadowColor,
                shadowOffset: {width: 0, height: 6},
                shadowOpacity: 0.15,
                shadowRadius: 16,
                elevation: 10,
              }}>
              <Text
                // eslint-disable-next-line react-native/no-inline-styles
                style={{
                  fontSize: conditionalFontScale(15, 16, 16, 17),
                  fontWeight: '700',
                  color: T.titleText,
                  marginBottom: 6,
                }}>
                {title}
              </Text>
              <Text
                // eslint-disable-next-line react-native/no-inline-styles
                style={{
                  fontSize: conditionalFontScale(12, 12, 13, 13),
                  color: T.subtitleText,
                  marginBottom: 12,
                }}>
                {message}
              </Text>

              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder={placeholder}
                placeholderTextColor={T.subtitleText}
                multiline
                numberOfLines={3}
                editable={!isProcessing}
                // eslint-disable-next-line react-native/no-inline-styles
                style={{
                  minHeight: conditionalVerticalScale(70, 74, 78, 80),
                  borderWidth: 1,
                  borderColor: T.border,
                  borderRadius: conditionalScale(10, 10, 11, 11),
                  padding: conditionalScale(10, 11, 12, 12),
                  color: T.titleText,
                  fontSize: conditionalFontScale(12, 13, 13, 14),
                  textAlignVertical: 'top',
                  backgroundColor: T.surface,
                }}
              />

              <View
                style={{
                  flexDirection: 'row',
                  marginTop: 16,
                  gap: conditionalScale(10, 10, 12, 12),
                }}>
                <TouchableOpacity
                  onPress={() => onCancel?.()}
                  disabled={isProcessing}
                  style={{
                    flex: 1,
                    paddingVertical: conditionalVerticalScale(10, 11, 12, 12),
                    borderRadius: conditionalScale(10, 10, 11, 11),
                    borderWidth: 1,
                    borderColor: T.border,
                    alignItems: 'center',
                    opacity: isProcessing ? 0.5 : 1,
                  }}>
                  <Text
                    style={{
                      color: T.subtitleText,
                      fontWeight: '600',
                      fontSize: conditionalFontScale(12, 13, 13, 14),
                    }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onSubmit?.(comment.trim())}
                  disabled={isProcessing}
                  style={{
                    flex: 1,
                    paddingVertical: conditionalVerticalScale(10, 11, 12, 12),
                    borderRadius: conditionalScale(10, 10, 11, 11),
                    backgroundColor: T.blue,
                    alignItems: 'center',
                    opacity: isProcessing ? 0.7 : 1,
                  }}>
                  <Text
                    style={{
                      color: T.onPrimary,
                      fontWeight: '700',
                      fontSize: conditionalFontScale(12, 13, 13, 14),
                    }}>
                    {isProcessing ? 'Submitting…' : 'OK'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default WorkflowCommentModal;
