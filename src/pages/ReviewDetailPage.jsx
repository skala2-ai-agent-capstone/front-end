import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';

export default function ReviewDetailPage() {
  const { reviewRequestId } = useParams();
  const navigate = useNavigate();
  const { toast } = useApp();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [overrideMode, setOverrideMode] = useState(false);
  const [scores, setScores] = useState({});

  function load() {
    api.get(`/api/reviews/${reviewRequestId}`).then(setDetail).catch((err) => setError(err.message));
  }

  useEffect(load, [reviewRequestId]);

  async function resolve(decision) {
    setBusy(true);
    try {
      const body = { decision, note: note || undefined };
      if (decision === 'override') {
        body.newScores = Object.fromEntries(Object.entries(scores).filter(([, v]) => v !== ''));
        if (Object.keys(body.newScores).length === 0) { toast('수정할 항목의 점수를 하나 이상 지정하세요'); setBusy(false); return; }
      }
      await api.post(`/api/reviews/${reviewRequestId}/resolve`, body);
      toast(
        decision === 'hold' ? '보류 상태를 유지했어요.'
          : decision === 'keep' ? '기존 점수로 확정했어요.'
            : '수정 요청을 접수했어요. 재평가 후 본인 확인 단계로 돌아가요.',
      );
      navigate('/review');
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <section className="page active"><div className="topheader"><h1>평가 검토</h1></div><p className="task-sub" style={{ color: 'var(--red)' }}>{error}</p></section>;
  if (!detail) return <section className="page active"><div className="topheader"><h1>평가 검토</h1></div><p className="task-sub">불러오는 중…</p></section>;

  const { targetItems, reason, reviewMemo, appeal, evaluation } = detail;
  const items = evaluation.report.items.filter((it) => targetItems.includes(it.itemId));

  return (
    <section className="page active">
      <div className="topheader"><h1>평가 검토</h1><span className="badge badge-red">{evaluation.evaluation.displayStatus}</span></div>
      <div className="page-sub"><p>{evaluation.evaluation.taskTitle || evaluation.evaluation.taskId} · {reason}</p></div>

      <div className="review-grid">
        <div className="card review-pane">
          <h3>대상 항목</h3>
          <div className="review-body">
            {items.map((it) => (
              <p key={it.itemId}><b>{it.name}</b><br />현재 채점: {it.scoreLabel} — {it.reason}</p>
            ))}
          </div>
        </div>
        <div className="card review-pane">
          <h3>Agent 비교 메모</h3>
          <div className="review-body">
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12.5 }}>{JSON.stringify(reviewMemo, null, 2)}</pre>
          </div>
        </div>
        <div className="card review-pane">
          <h3>{appeal ? '이의 제기 내용' : '자동 감지 사유'}</h3>
          <div className="appeal-box">
            {appeal ? appeal.comment : reason}
            {appeal && <div style={{ marginTop: 10, color: 'var(--text-faint)', fontSize: 12 }}>— {appeal.submittedBy} · {new Date(appeal.submittedAt).toLocaleString()}</div>}
          </div>
        </div>
      </div>

      {overrideMode && (
        <div className="card" style={{ padding: 18, marginBottom: 18 }}>
          <h3 style={{ marginTop: 0 }}>항목별 수정 점수</h3>
          {items.map((it) => (
            <div className="form-row" key={it.itemId}>
              <label>{it.name}</label>
              <select value={scores[it.itemId] ?? ''} onChange={(e) => setScores((s) => ({ ...s, [it.itemId]: e.target.value }))}>
                <option value="">변경 안 함</option>
                <option value="0">0점</option>
                <option value="1">1점</option>
                <option value="2">2점</option>
              </select>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <div className="form-row"><label>검토 의견</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="검토 의견을 남겨주세요 (선택)" style={{ width: '100%', minHeight: 60, padding: '9px 12px', border: '1px solid var(--border-strong)', borderRadius: 8, font: 'inherit' }} />
        </div>
      </div>

      <div className="card" style={{ padding: '15px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>keep은 바로 확정되고, override는 재평가 후 본인 확인으로 돌아갑니다.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => resolve('hold')} disabled={busy}>보류 유지</button>
          <button className="btn" onClick={() => resolve('keep')} disabled={busy}>기존 점수 유지</button>
          {!overrideMode
            ? <button className="btn btn-primary" onClick={() => setOverrideMode(true)} disabled={busy}>점수 수정 요청</button>
            : <button className="btn btn-primary" onClick={() => resolve('override')} disabled={busy}>수정 요청 제출</button>}
        </div>
      </div>
    </section>
  );
}
