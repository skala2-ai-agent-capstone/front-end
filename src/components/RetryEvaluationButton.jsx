import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';

// 평가 상태(evaluations.status) 값. 업무 단계(stage)의 '평가 실패'와 달리 평가 상태는 '처리 실패'다
export const RETRYABLE_STATUSES = ['처리 실패', '자료 보류'];

// 팀장 재처리: 처리 실패·자료 보류 평가를 AI가 새로 평가한다(담당 팀장만). 끝나면 담당자 확인 단계로 간다
export default function RetryEvaluationButton({ evaluationId, onDone, className = 'btn' }) {
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);

  async function handleClick(e) {
    e.stopPropagation();
    setBusy(true);
    try {
      await api.post(`/api/evaluations/${evaluationId}/retry`);
      toast('AI 재평가를 요청했어요. 끝나면 담당자 확인 단계로 넘어가요.');
      onDone?.();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className={className} onClick={handleClick} disabled={busy}>
      {busy ? '요청 중…' : 'AI 재평가'}
    </button>
  );
}
