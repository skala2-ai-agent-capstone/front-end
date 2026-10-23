import { useState } from 'react';

const LF_COOLDOWN_MS = 5 * 60 * 1000;

export const LF_ITEM_SETS = [
  [
    { label: '지시 품질', state: 'good', note: '조건(수량·기간·범위)을 구체적으로 전달했어요.' },
    { label: '결과 검증', state: 'warn', note: 'AI 결과를 참조 자료와 아직 대조하지 않았어요.' },
    { label: '보안 준수', state: 'pending', note: '민감정보 입력 여부를 확인할 대화가 아직 없어요.' },
  ],
  [
    { label: '문제 정의', state: 'good', note: '업무 목적과 범위가 대화에 잘 드러나 있어요.' },
    { label: '지시 품질', state: 'warn', note: '형식·제약 조건을 조금 더 구체적으로 전달해보세요.' },
    { label: '결과 검증', state: 'pending', note: 'AI 산출물을 검토한 기록이 아직 없어요.' },
  ],
];
export const LF_COACHING = [
  '다음 메시지에서 가격 정책 문서와 금액을 한 번 더 대조해보세요.',
  '참조 자료의 버전을 명시해서 전달하면 더 정확한 결과를 받을 수 있어요.',
  '필수 요구사항 중 아직 언급하지 않은 항목이 있는지 확인해보세요.',
];
export const LF_STATE_META = {
  good: { color: 'var(--green)', text: '양호' },
  warn: { color: 'var(--amber)', text: '보완 필요' },
  pending: { color: 'var(--text-faint)', text: '관측 전' },
};

let lfSetIndex = 0;

function cooldownRemainingSecNow() {
  const last = Number(sessionStorage.getItem('liveFeedbackRequestedAt') || 0);
  const remain = LF_COOLDOWN_MS - (Date.now() - last);
  return remain > 0 ? Math.ceil(remain / 1000) : 0;
}

export function useLiveFeedback(hasUserMessages) {
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(null);
  const [cooldownRemainingSec, setCooldownRemainingSec] = useState(cooldownRemainingSecNow);

  function requestFeedback() {
    if (phase !== 'idle' || cooldownRemainingSec > 0 || !hasUserMessages) return;
    sessionStorage.setItem('liveFeedbackRequestedAt', String(Date.now()));
    setPhase('waiting');

    setTimeout(() => setPhase('generating'), 900);

    setTimeout(() => {
      const items = LF_ITEM_SETS[lfSetIndex % LF_ITEM_SETS.length];
      const coaching = LF_COACHING[lfSetIndex % LF_COACHING.length];
      lfSetIndex += 1;
      setResult({ items, coaching });
      setPhase('done');
      setCooldownRemainingSec(LF_COOLDOWN_MS / 1000);
    }, 2400);
  }

  const disabled = phase !== 'idle' || cooldownRemainingSec > 0 || !hasUserMessages;

  return { phase, result, cooldownRemainingSec, disabled, requestFeedback };
}
