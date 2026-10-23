import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function AdminReviewPage() {
  const { toast } = useApp();
  const [status, setStatus] = useState({ text: '검토 중', badgeClass: 'badge-red' });
  const [footNote, setFootNote] = useState('승인 시 상태가 "확정"으로 전이됩니다.');
  const [finalScore, setFinalScore] = useState(null);
  const [locked, setLocked] = useState(false);

  function holdReview() {
    setStatus({ text: '보류 중', badgeClass: 'badge-gray' });
    setFootNote('자료 보완 또는 추가 확인이 필요해 보류 상태를 유지합니다.');
    setLocked(true);
    toast('보류 상태를 유지했어요.');
  }

  function keepScore() {
    setStatus({ text: '확정', badgeClass: 'badge-green' });
    setFootNote('기존 채점을 유지한 채로 확정됐습니다.');
    setLocked(true);
    toast('기존 점수로 확정했어요.');
  }

  function overrideScore() {
    setStatus({ text: '확정', badgeClass: 'badge-green' });
    setFootNote('검토자 의견대로 점수를 수정해 확정됐습니다.');
    setFinalScore('2점');
    setLocked(true);
    toast('2점으로 수정해 확정했어요.');
  }

  return (
    <section className="page active">
      <div className="topheader"><h1>평가 검토</h1><span className={`badge ${status.badgeClass}`}>{status.text}</span></div>
      <div className="page-sub"><p>이의가 제기되었거나 채점 불일치가 감지된 건을 검토합니다. — 포스코DX RFP 분석 · TASK-2265</p></div>

      <div className="review-grid">
        <div className="card review-pane">
          <h3>원문·산출물</h3>
          <div className="review-body">
            <p>§4.2 요구사항: "응답 시간 200ms 이내 처리 가능한 아키텍처를 제시할 것"</p>
            <p>제출 산출물: "평균 응답 시간 150ms 수준의 레퍼런스 아키텍처를 적용함"</p>
          </div>
        </div>
        <div className="card review-pane">
          <h3>적용 루브릭 <span className="chip" style={{ fontSize: 10.5, padding: '2px 8px', marginLeft: 4 }}>v1.3</span></h3>
          <div className="review-body">
            <p><b>요구사항 추출</b><br />0 = 필수 요구 누락 / 1 = 일부 누락 / 2 = 전체 추출 + 원문 위치 연결</p>
            <p>현재 채점: <span className="diff-del">1점</span> → 검토자 의견: <span className="diff-add">2점</span></p>
            {finalScore && <p style={{ marginTop: 8, color: 'var(--text-muted)' }}>최종 반영: <b>{finalScore}</b></p>}
          </div>
        </div>
        <div className="card review-pane">
          <h3>이의 제기 내용</h3>
          <div className="appeal-box">
            "응답 시간 요구사항은 원문 위치(§4.2)까지 명시했는데 1점 처리됐습니다. 재검토 부탁드립니다."
            <div style={{ marginTop: 10, color: 'var(--text-faint)', fontSize: 12 }}>— 직원 이의 제기 · 어제 18:40</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '15px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>{footNote}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={holdReview} disabled={locked}>보류 유지</button>
          <button className="btn" onClick={keepScore} disabled={locked}>기존 점수 유지</button>
          <button className="btn btn-primary" onClick={overrideScore} disabled={locked}>2점으로 수정·확정</button>
        </div>
      </div>
    </section>
  );
}
