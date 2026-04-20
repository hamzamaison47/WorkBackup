// components/AIChatbot/AIChatModal.js
//
// Chat modal that:
//   1. Checks if user is authenticated with Azure AD
//   2. If not, shows a login screen first
//   3. Once authenticated, opens the chat (Bearer token is used automatically)

import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Keyboard,
  Linking,
} from 'react-native';
import {sendMessage} from '../../services/FoundryAgentService';
import {isAuthenticated, login} from '../../services/AzureAuthService';

const uid = () => Math.random().toString(36).slice(2, 10);

const C = {
  bg: '#F4F6FB',
  headerBg: '#1A56DB',
  headerText: '#FFFFFF',
  userBubble: '#1A56DB',
  userText: '#FFFFFF',
  botBubble: '#FFFFFF',
  botText: '#1A1A2E',
  inputBg: '#FFFFFF',
  inputBorder: '#DDE3F0',
  sendBtn: '#1A56DB',
  sendBtnDisabled: '#A0B4E8',
  timestamp: '#9AA3B2',
  errorText: '#D32F2F',
};

const formatTime = d =>
  d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  text: "Hi! I'm Dynaface AI. How can I help you today?",
  timestamp: formatTime(new Date()),
};

// ─── ChatBubble ───────────────────────────────────────────────────────────────
const ChatBubble = ({item}) => {
  const isUser = item.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.rowUser : styles.rowBot]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AI</Text>
        </View>
      )}
      <View style={styles.bubbleWrapper}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleBot,
          ]}>
          <Text
            style={[
              isUser ? styles.textUser : styles.textBot,
              item.isError && {color: C.errorText},
            ]}>
            {item.text}
          </Text>

          {/* Consent button — only shown when type === 'consent' */}
          {item.type === 'consent' && item.consentLink && (
            <TouchableOpacity
              style={styles.consentBtn}
              onPress={() => Linking.openURL(item.consentLink)}
              activeOpacity={0.85}>
              <Text style={styles.consentBtnText}>Give Consent ↗</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.ts, isUser ? styles.tsR : styles.tsL]}>
          {item.timestamp}
        </Text>
      </View>
    </View>
  );
};

// ─── TypingIndicator ──────────────────────────────────────────────────────────
const TypingIndicator = () => {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d % 3) + 1), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={[styles.bubbleRow, styles.rowBot]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>AI</Text>
      </View>
      <View style={[styles.bubble, styles.bubbleBot]}>
        <Text style={styles.textBot}>{'Thinking' + '.'.repeat(dots)}</Text>
      </View>
    </View>
  );
};

// ─── LoginScreen (shown if not authenticated) ─────────────────────────────────
const LoginScreen = ({onLogin, onClose}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await login(); // opens Azure AD browser popup
      console.log(token);
      onLogin();
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.loginScreen}>
      <TouchableOpacity onPress={onClose} style={styles.loginClose}>
        <Text style={styles.loginCloseText}>✕</Text>
      </TouchableOpacity>
      <View style={styles.loginContent}>
        <View style={styles.loginIcon}>
          <Text style={{fontSize: 40}}>🤖</Text>
        </View>
        <Text style={styles.loginTitle}>Dynaface AI</Text>
        <Text style={styles.loginSubtitle}>
          Sign in with your Microsoft account to start chatting
        </Text>
        {error && <Text style={styles.loginError}>{error}</Text>}
        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.loginBtnIcon}>⊞</Text>
              <Text style={styles.loginBtnText}>Sign in with Microsoft</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── AIChatModal ─────────────────────────────────────────────────────────────
const AIChatModal = ({visible, onClose}) => {
  const [authed, setAuthed] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const flatListRef = useRef(null);

  // Check auth state whenever modal opens
  useEffect(() => {
    if (visible) setAuthed(true);
  }, [visible]);

  const handleClose = useCallback(() => {
    setMessages([WELCOME]);
    setInputText('');
    setConversationId(null);
    setIsTyping(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({animated: true}), 100);
  }, [messages, isTyping]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;
    Keyboard.dismiss();
    setInputText('');

    setMessages(prev => [
      ...prev,
      {id: uid(), role: 'user', text, timestamp: formatTime(new Date())},
    ]);
    setIsTyping(true);

    try {
      const {
        conversationId: cid,
        type,
        reply,
        consentLink,
      } = await sendMessage(conversationId, text);
      if (!conversationId) setConversationId(cid);
      setMessages(prev => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          type: type ?? 'text', // ← 'text' | 'consent'
          text: reply || '(No response)',
          consentLink: consentLink ?? null,
          timestamp: formatTime(new Date()),
        },
      ]);
    } catch (err) {
      console.error('[AIChatModal] sendMessage error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          type: 'text',
          text: 'Something went wrong. Please try again.',
          timestamp: formatTime(new Date()),
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [inputText, isTyping, conversationId]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Show login screen if not authenticated */}
        {!authed ? (
          <LoginScreen onLogin={() => setAuthed(true)} onClose={handleClose} />
        ) : (
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerAvatar}>
                  <Text style={styles.headerAvatarText}>AI</Text>
                </View>
                <View>
                  <Text style={styles.headerTitle}>Dynaface AI</Text>
                  <Text style={styles.headerSub}>
                    {conversationId ? '● Active' : '● Ready'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Chat body */}
            <KeyboardAvoidingView
              style={styles.body}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={i => i.id}
                renderItem={({item}) => <ChatBubble item={item} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={isTyping ? <TypingIndicator /> : null}
              />

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask Dynaface AI…"
                  placeholderTextColor="#9AA3B2"
                  multiline
                  maxLength={1000}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    (!inputText.trim() || isTyping) && styles.sendBtnDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={!inputText.trim() || isTyping}
                  activeOpacity={0.8}>
                  {isTyping ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.sendBtnText}>↑</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: C.bg},

  // Login screen
  loginScreen: {flex: 1, backgroundColor: C.bg},
  loginClose: {
    alignSelf: 'flex-end',
    margin: 16,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8ECF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginCloseText: {fontSize: 16, color: '#555'},
  loginContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: -60,
  },
  loginIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 10,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 32,
  },
  loginError: {color: C.errorText, marginBottom: 12, fontSize: 13},
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.headerBg,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    gap: 10,
    width: '100%',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: C.headerBg,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
  },
  loginBtnDisabled: {backgroundColor: C.sendBtnDisabled},
  loginBtnIcon: {fontSize: 18, color: '#fff'},
  loginBtnText: {color: '#fff', fontWeight: '700', fontSize: 15},

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.headerBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 3},
  },
  headerLeft: {flexDirection: 'row', alignItems: 'center', gap: 10},
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {color: '#fff', fontWeight: '700', fontSize: 13},
  headerTitle: {color: C.headerText, fontWeight: '700', fontSize: 16},
  headerSub: {color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 1},
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {color: '#fff', fontSize: 16, fontWeight: '600'},

  // Chat
  body: {flex: 1},
  listContent: {padding: 16, paddingBottom: 8},
  bubbleRow: {flexDirection: 'row', marginVertical: 4, alignItems: 'flex-end'},
  rowUser: {justifyContent: 'flex-end'},
  rowBot: {justifyContent: 'flex-start'},
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.headerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 16,
  },
  avatarText: {color: '#fff', fontSize: 10, fontWeight: '700'},
  bubbleWrapper: {maxWidth: '75%'},
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
  },
  bubbleUser: {backgroundColor: C.userBubble, borderBottomRightRadius: 4},
  bubbleBot: {backgroundColor: C.botBubble, borderBottomLeftRadius: 4},
  textUser: {color: C.userText, fontSize: 14, lineHeight: 20},
  textBot: {color: C.botText, fontSize: 14, lineHeight: 20},
  ts: {fontSize: 10, color: C.timestamp, marginTop: 3, marginHorizontal: 4},
  tsR: {textAlign: 'right'},
  tsL: {textAlign: 'left'},

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: C.inputBg,
    borderTopWidth: 1,
    borderTopColor: C.inputBorder,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: C.bg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A2E',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.sendBtn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentBtn: {
    marginTop: 10,
    backgroundColor: C.headerBg,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  consentBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  sendBtnDisabled: {backgroundColor: C.sendBtnDisabled},
  sendBtnText: {color: '#fff', fontSize: 20, fontWeight: '700'},
});

export default AIChatModal;
