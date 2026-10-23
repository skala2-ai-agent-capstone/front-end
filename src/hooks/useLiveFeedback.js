import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

const POLL_MS = 2500;
const MAX_POLL_MS = 60000;

export function useLiveFeedback(workId, hasUserMessages) {
  const [phase, setPhase] = useState('idle'); // idle | waiting | generating | done | failed
  const [display, setDisplay] = useState(null); // { items:[{label,state,note}], coaching, suggestedPrompt }
  const [cooldownMessage, setCooldownMessage] = useState('');
  const pollTimerRef = useRef(null);
  const pollStartRef = useRef(0);

  useEffect(() => () => clearTimeout(pollTimerRef.current), []);

  function applyResult(data) {
    if (data.phase === 'done') {
      setDisplay(data.display);
      setPhase('done');
      return true;
    }
    if (data.phase === 'failed') {
      setPhase('failed');
      return true;
    }
    return false;
  }

  function poll(liveEvalId) {
    pollTimerRef.current = setTimeout(async () => {
      try {
        const data = await api.get(`/api/live-evaluations/${liveEvalId}`);
        if (applyResult(data)) return;
        setPhase(data.phase);
        if (Date.now() - pollStartRef.current > MAX_POLL_MS) {
          setPhase('failed');
          return;
        }
        poll(liveEvalId);
      } catch {
        setPhase('failed');
      }
    }, POLL_MS);
  }

  async function requestFeedback() {
    if (phase !== 'idle' && phase !== 'failed') return;
    if (!hasUserMessages) return;
    setCooldownMessage('');
    setDisplay(null);
    setPhase('waiting');
    pollStartRef.current = Date.now();
    try {
      const data = await api.post('/api/live-evaluations', { workId });
      if (!applyResult(data)) poll(data.liveEvalId);
    } catch (err) {
      if (err.status === 429) {
        const minutes = Math.ceil((err.retryAfterSeconds || 60) / 60);
        setCooldownMessage(`${minutes}분 후 다시 요청할 수 있어요.`);
        setPhase('idle');
        return;
      }
      if (err.status === 409) {
        setCooldownMessage('피드백할 대화가 아직 없어요.');
        setPhase('idle');
        return;
      }
      setPhase('failed');
    }
  }

  const disabled = (phase !== 'idle' && phase !== 'failed') || !hasUserMessages;

  return { phase, display, cooldownMessage, disabled, requestFeedback };
}
