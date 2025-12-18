import Voice from '@react-native-voice/voice';
// Load expo-speech at runtime with a safe fallback so the app doesn't crash
// if Expo native modules aren't configured in a bare React Native project.
let Speech: any = null;
try {
  // require at runtime to avoid module initialization errors

  Speech = require('expo-speech');
} catch (e) {
  Speech = {speak: (msg: any) => console.warn('expo-speech unavailable:', msg)};
}
import {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {CreateAttendance} from '../API/Attendance/CreateAttendance';

export default function VoiceAttendance(props: any) {
  const {active = false, onResult} = props || {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [listening, setListening] = useState(false);
  const {userData} = useSelector((state: any) => state.user || {});

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechStart = onSpeechStart;

    return () => {
      try {
        Voice.stop();
      } catch {}
      Voice.destroy();
      Voice.removeAllListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (active) {
      startListening();
    } else {
      try {
        Voice.stop();
      } catch {}
      setListening(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const startListening = async () => {
    try {
      setListening(true);
      await Voice.start('en-US');
    } catch (e) {
      setListening(false);
      onResult && onResult({error: 'failed-to-start'});
    }
  };

  const onSpeechStart = (e: any) => {
    setListening(true);
    console.log('Voice: speech started', e);
  };

  const onSpeechError = (e: any) => {
    console.error('Voice: speech error', e);
    try {
      Voice.stop();
    } catch (stopErr) {
      console.warn('Voice: stop failed', stopErr);
    }
    setListening(false);
    const detail = e && (e.message || e.error || JSON.stringify(e));
    onResult && onResult({error: 'speech-error', detail});
  };

  const onSpeechEnd = () => {
    try {
      Voice.stop();
    } catch {}
    setListening(false);
  };

  const onSpeechResults = async (event: any) => {
    // stop the recognizer immediately to avoid continuous listening
    try {
      await Voice.stop();
    } catch {}
    setListening(false);

    const raw = event.value?.[0];
    if (!raw) {
      onResult && onResult({error: 'no-transcript'});
      return;
    }

    const text = String(raw).toLowerCase();

    // Recognize punch commands
    if (
      text.includes('punch') ||
      text.includes('mark attendance') ||
      text.includes('mark present')
    ) {
      if (!userData || !userData.employeeId) {
        const msg = 'No employee is signed in. Please login first.';
        Speech.speak(msg);
        onResult && onResult({isSuccess: false, message: msg});
        return;
      }

      try {
        const punchDateTime = new Date().toISOString();
        const result = await CreateAttendance({
          employeeId: userData.employeeId,
          punchDateTime,
        });

        const msg =
          result && result.isSuccess
            ? 'Attendance punched successfully.'
            : result?.message || 'Failed to punch attendance.';
        Speech.speak(msg);
        onResult && onResult(result);
      } catch (err: any) {
        const msg = 'Error punching attendance. Please try again.';
        Speech.speak(msg);
        onResult && onResult({isSuccess: false, message: msg, error: err});
      }

      return;
    }

    // Fallback: provide transcript
    Speech.speak('You said: ' + raw);
    onResult && onResult({transcript: raw});
  };

  return null;
}
