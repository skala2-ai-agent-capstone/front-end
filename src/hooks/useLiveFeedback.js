import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

const POLL_MS = 2500;
const MAX_POLL_MS = 60000;

// answeredTurns: AI가 답한 대화 수(서버는 완료된 질문·응답 쌍으로 피드백한다)
export function useLiveFeedback(workId, answeredTurns) {
  const [phase, setPhase] = useState('idle'); // idle | waiting | generating | done | failed
  const [display, setDisplay] = useState(null); // { items:[{label,state,note}], coaching, suggestedPrompt }
  const [cooldownMessage, setCooldownMessage] = useState('');
  // 마지막 피드백이 다룬 대화 수. 그 뒤로 새 대화가 생기면 다시 요청할 수 있다
  const [coveredTurns, setCoveredTurns] = useState(0);
  const pollTimerRef = useRef(null);
  const pollStartRef = useRef(0);
  const requestedTurnsRef = useRef(0);

  useEffect(() => () => clearTimeout(pollTimerRef.current), []);

  const busy = phase === 'waiting' || phase === 'generating';
  const needsNewTurns = phase === 'done' && answeredTurns <= coveredTurns;
  const disabled = busy || answeredTurns === 0 || needsNewTurns;

  function applyResult(data) {
    if (data.phase === 'done') {
      setDisplay(data.display);
      setCoveredTurns(requestedTurnsRef.current);
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
    if (disabled) return;
    const prev = { phase, display };
    requestedTurnsRef.current = answeredTurns;
    setCooldownMessage('');
    setDisplay(null);
    setPhase('waiting');
    pollStartRef.current = Date.now();
    try {
      const data = await api.post('/api/live-evaluations', { workId });
      if (!applyResult(data)) poll(data.liveEvalId);
    } catch (err) {
      if (err.status === 429 || err.status === 409) {
        const minutes = Math.ceil((err.retryAfterSeconds || 60) / 60);
        setCooldownMessage(err.status === 429 ? `${minutes}분 후 다시 요청할 수 있어요.` : '피드백할 대화가 아직 없어요.');
        // 요청이 거절되면 직전 피드백을 그대로 보여 준다
        setDisplay(prev.display);
        setPhase(prev.phase === 'done' ? 'done' : 'idle');
        return;
      }
      setPhase('failed');
    }
  }

  return { phase, display, cooldownMessage, disabled, needsNewTurns, requestFeedback };
}
