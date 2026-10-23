import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function EvaluationReportPage() {
  const { toast } = useApp();
  const [status, setStatus] = useState({ text: '확인 대기', badgeClass: 'badge-blue' });
  const [locked, setLocked] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealError, setAppealError] = useState('');

  function confirmReport() {
    setStatus({ text: '확인 완료', badgeClass: 'badge-green' });
    setLocked(true);
    toast('평가 결과를 확인했어요.');
  }

  function openAppealForm() {
    setAppealOpen(true);
  }

  function cancelAppealForm() {
    setAppealOpen(false);
    setAppealReason('');
    setAppealError('');
  }

  function submitAppeal() {
    const reason = appealReason.trim();
    if (!reason) {
      setAppealError('이의 제기 사유를 입력하세요');
      return;
    }
    setAppealError('');
    setAppealOpen(false);
    setStatus({ text: '이의 제기됨', badgeClass: 'badge-red' });
    setLocked(true);
    toast('이의 제기가 접수됐어요. 검토 결과를 알려드릴게요.');
  }

  return (
    <section className="page active">
      <div className="topheader"><h1>개인 평가 리포트</h1><span className={`badge ${status.badgeClass}`}>{status.text}</span></div>
      <div className="page-sub"><p>항목별 결과와 근거를 확인하고, 동의하지 않는 항목은 이의를 제기할 수 있습니다.</p></div>

      <div className="widget-row">
        <div className="card widget" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <svg width="112" height="112" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#EDEBFE" strokeWidth="12" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="#533AFD" strokeWidth="12" strokeLinecap="round" strokeDasharray="326.7" strokeDashoffset="98" transform="rotate(-90 60 60)" />
            <text x="60" y="56" textAnchor="middle" fontSize="24" fontWeight="800" fill="#15161B" fontFamily="Pretendard">7/10</text>
            <text x="60" y="76" textAnchor="middle" fontSize="11" fill="#9A9CA8" fontFamily="Pretendard">종합 점수</text>
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>현대오토에버 견적서 작성</div>
            <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
              <span className="chip">견적서 작성</span>
              <span className="chip">루브릭 v1.3</span>
            </div>
            <div className="more-link">전체 평가 기록 보기<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg></div>
          </div>
        </div>
        <div className="card widget">
          <div className="widget-head"><div className="widget-title"><div className="widget-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></div>평가 가능 비율</div></div>
          <div className="ring-wrap">
            <svg width="84" height="84" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#EDEBFE" strokeWidth="12" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="#533AFD" strokeWidth="12" strokeLinecap="round" strokeDasharray="326.7" strokeDashoffset="65" transform="rotate(-90 60 60)" />
              <text x="60" y="68" textAnchor="middle" fontSize="22" fontWeight="800" fill="#15161B" fontFamily="Pretendard">80%</text>
            </svg>
            <div className="ring-legend">
              <div className="rl-row"><span><span className="dot" style={{ background: 'var(--primary)' }}></span> 채점 완료</span><span className="rl-val">4개</span></div>
              <div className="rl-row"><span><span className="dot" style={{ background: 'var(--gray-soft)', border: '1px solid var(--border-strong)' }}></span> 미관측</span><span className="rl-val">1개</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="rubric-row">
          <div className="rubric-top"><div className="rubric-name"><span className="dot" style={{ background: 'var(--green)' }}></span>문제 정의</div><span className="badge badge-green">2점</span></div>
          <div className="rubric-evidence">근거: 대화 #42 — 고객 예산·필수 요구가 견적 조건에 모두 반영됨</div>
        </div>
        <div className="rubric-row">
          <div className="rubric-top"><div className="rubric-name"><span className="dot" style={{ background: 'var(--green)' }}></span>지시 품질</div><span className="badge badge-green">2점</span></div>
          <div className="rubric-evidence">근거: AI 프롬프트에 수량·기간·범위 조건이 명시적으로 전달됨</div>
        </div>
        <div className="rubric-row">
          <div className="rubric-top"><div className="rubric-name"><span className="dot" style={{ background: 'var(--amber)' }}></span>결과 검증</div><span className="badge badge-amber">1점</span></div>
          <div className="rubric-evidence">근거: 할인 정책 대조는 확인됐으나, 수량별 단가 재계산 검증 기록 없음</div>
          <div className="rubric-coach">개선 제안 · 확정 견적 생성 전, 수량 구간별 단가를 정책 문서와 1회 더 대조해보세요.</div>
        </div>
        <div className="rubric-row">
          <div className="rubric-top"><div className="rubric-name"><span className="dot" style={{ background: 'var(--text-faint)' }}></span>보안 준수</div><span className="badge badge-gray">미관측</span></div>
          <div className="rubric-evidence">검증 행동 기록 없음 — 0점이 아닌 미관측으로 분류되며 점수 계산에서 제외됩니다.</div>
        </div>
        <div className="rubric-row">
          <div className="rubric-top"><div className="rubric-name"><span className="dot" style={{ background: 'var(--green)' }}></span>결과물 품질</div><span className="badge badge-green">2점</span></div>
          <div className="rubric-evidence">근거: 최종 견적서가 고객 조건·제품 가격 자료와 일치</div>
        </div>
      </div>

      {appealOpen && (
        <div className="card" style={{ marginTop: 18 }}>
          <h3 style={{ margin: '0 0 10px' }}>이의 제기 사유</h3>
          <textarea
            value={appealReason}
            onChange={(e) => setAppealReason(e.target.value)}
            placeholder="어떤 항목의 평가에 동의하지 않는지, 근거와 함께 적어주세요."
            style={{ width: '100%', minHeight: 88, padding: '11px 13px', border: '1px solid var(--border-strong)', borderRadius: 9, font: 'inherit', resize: 'vertical' }}
          />
          <div className={`field-error${appealError ? ' show' : ''}`}>{appealError}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button className="btn" onClick={cancelAppealForm}>취소</button>
            <button className="btn btn-primary" onClick={submitAppeal}>이의 제기 제출</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <button className="btn" onClick={openAppealForm} disabled={locked}>이의 제기</button>
        <button className="btn btn-primary" onClick={confirmReport} disabled={locked}>확인 완료</button>
      </div>
    </section>
  );
}
