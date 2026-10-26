import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';

const IN_PROGRESS_STATUSES = ['대기', '수집 중', '평가 중', '근거 확인 중', '코칭 생성 중'];
const ITEM_STATUS_BADGE = { 채점: 'badge-green', 미관측: 'badge-gray', '검토 필요': 'badge-amber' };
const COACHING_LABEL = { 강점: '강점', 보완점: '개선 제안', '기록 안내': '참고' };

export default function EvaluationReportPage() {
  const { toast } = useApp();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [detail, setDetail] = useState(null);
  const [appealMode, setAppealMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const pollTimerRef = useRef(null);

  const loadFirstEvaluation = useCallback(async () => {
    const list = await api.get('/api/evaluations');
    if (!list.length) { setDetail(null); return null; }
    return list[0].evaluationId;
  }, []);

  const loadDetail = useCallback(async (evaluationId) => {
    const data = await api.get(`/api/evaluations/${evaluationId}`);
    setDetail(data);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setLoadError('');
      try {
        const evaluationId = await loadFirstEvaluation();
        if (!evaluationId || cancelled) { setLoading(false); return; }
        await loadDetail(evaluationId);
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();

    return () => { cancelled = true; clearTimeout(pollTimerRef.current); };
  }, [loadFirstEvaluation, loadDetail]);

  useEffect(() => {
    if (!detail) return undefined;
    const status = detail.evaluation.status;
    if (status === '평가 실패') return undefined;
    const stillEmpty = detail.report.items.length === 0;
    if (!IN_PROGRESS_STATUSES.includes(status) && !stillEmpty) return undefined;

    pollTimerRef.current = setTimeout(async () => {
      try {
        await loadDetail(detail.evaluation.evaluationId);
      } catch { /* keep last known state, try again next tick */ }
    }, 2500);
    return () => clearTimeout(pollTimerRef.current);
  }, [detail, loadDetail]);

  async function handleRetry() {
    setBusy(true);
    try {
      await api.post(`/api/evaluations/${detail.evaluation.evaluationId}/retry`);
      await loadDetail(detail.evaluation.evaluationId);
      toast('평가를 다시 시작했어요.');
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    setBusy(true);
    try {
      await api.post(`/api/evaluations/${detail.evaluation.evaluationId}/confirm`);
      await loadDetail(detail.evaluation.evaluationId);
      toast('평가 결과를 확인했어요.');
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  function toggleAppealItem(itemId) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  }

  async function handleSubmitAppeal() {
    if (selectedItems.size === 0) { toast('이의를 제기할 항목을 하나 이상 선택하세요'); return; }
    setBusy(true);
    try {
      await api.post(`/api/evaluations/${detail.evaluation.evaluationId}/appeals`, {
        targetItems: [...selectedItems],
        comment,
      });
      setAppealMode(false);
      setSelectedItems(new Set());
      setComment('');
      await loadDetail(detail.evaluation.evaluationId);
      toast('이의 제기가 접수됐어요. 검토 결과를 알려드릴게요.');
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="page active">
        <div className="topheader"><h1>개인 평가 리포트</h1></div>
        <p className="task-sub">불러오는 중…</p>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="page active">
        <div className="topheader"><h1>개인 평가 리포트</h1></div>
        <p className="task-sub" style={{ color: 'var(--red)' }}>{loadError}</p>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="page active">
        <div className="topheader"><h1>개인 평가 리포트</h1></div>
        <p className="task-sub">아직 평가 내역이 없어요.</p>
      </section>
    );
  }

  const { evaluation, report } = detail;
  const canAct = evaluation.status === '확인 대기';
  const isFailed = evaluation.status === '평가 실패';
  const inProgress = report.items.length === 0;

  return (
    <section className="page active">
      <div className="topheader"><h1>개인 평가 리포트</h1><span className="badge badge-blue">{evaluation.displayStatus}</span></div>
      <div className="page-sub"><p>{evaluation.taskTitle || evaluation.taskId} · {evaluation.workTypeName}</p></div>

      {isFailed ? (
        <div className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <p className="task-sub" style={{ color: 'var(--red)' }}>평가가 실패했어요. 다시 시도해주세요.</p>
          <button className="btn btn-primary" onClick={handleRetry} disabled={busy}>{busy ? '재시도 중…' : '재시도'}</button>
        </div>
      ) : inProgress ? (
        <div className="card" style={{ padding: 20 }}>
          <p className="task-sub">평가가 진행 중이에요. 잠시 후 자동으로 갱신돼요…</p>
        </div>
      ) : (
        <>
          <div className="widget-row">
            <div className="card widget" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <svg width="112" height="112" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#EDEBFE" strokeWidth="12" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="#533AFD" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray="326.7" strokeDashoffset={326.7 * (1 - (report.maxScore ? report.totalScore / report.maxScore : 0))} transform="rotate(-90 60 60)" />
                <text x="60" y="56" textAnchor="middle" fontSize="24" fontWeight="800" fill="#15161B" fontFamily="Pretendard">{report.totalScore}/{report.maxScore}</text>
                <text x="60" y="76" textAnchor="middle" fontSize="11" fill="#9A9CA8" fontFamily="Pretendard">종합 점수</text>
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{evaluation.taskTitle || evaluation.taskId}</div>
                <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
                  <span className="chip">{evaluation.workTypeName}</span>
                  <span className="chip">루브릭 {evaluation.rubricVersion}</span>
                </div>
              </div>
            </div>
            <div className="card widget">
              <div className="widget-head"><div className="widget-title"><div className="widget-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></div>평가 가능 비율</div></div>
              <div className="ring-wrap">
                <svg width="84" height="84" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#EDEBFE" strokeWidth="12" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#533AFD" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray="326.7" strokeDashoffset={326.7 * (1 - report.observedRate / 100)} transform="rotate(-90 60 60)" />
                  <text x="60" y="68" textAnchor="middle" fontSize="22" fontWeight="800" fill="#15161B" fontFamily="Pretendard">{report.observedRate}%</text>
                </svg>
                <div className="ring-legend">
                  <div className="rl-row"><span><span className="dot" style={{ background: 'var(--primary)' }}></span> 채점 완료</span><span className="rl-val">{report.scoredCount}개</span></div>
                  <div className="rl-row"><span><span className="dot" style={{ background: 'var(--gray-soft)', border: '1px solid var(--border-strong)' }}></span> 미관측</span><span className="rl-val">{report.unobservedCount}개</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            {report.items.map((item) => (
              <div className="rubric-row" key={item.itemId}>
                <div className="rubric-top">
                  <div className="rubric-name">
                    {appealMode && canAct && (
                      <input type="checkbox" checked={selectedItems.has(item.itemId)} onChange={() => toggleAppealItem(item.itemId)} style={{ marginRight: 4 }} />
                    )}
                    <span className="dot" style={{ background: item.status === '채점' ? 'var(--green)' : item.status === '검토 필요' ? 'var(--amber)' : 'var(--text-faint)' }}></span>
                    {item.name}
                  </div>
                  <span className={`badge ${ITEM_STATUS_BADGE[item.status]}`}>{item.scoreLabel}</span>
                </div>
                <div className="rubric-evidence">{item.reason}</div>
                {item.coaching.map((c, i) => (
                  <div className="rubric-coach" key={i}>{COACHING_LABEL[c.kind]} · {c.text}</div>
                ))}
              </div>
            ))}
          </div>

          {appealMode && canAct && (
            <div className="card" style={{ marginTop: 18 }}>
              <h3 style={{ margin: '0 0 10px' }}>이의 제기 사유</h3>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="선택한 항목에 대해 왜 동의하지 않는지 적어주세요."
                style={{ width: '100%', minHeight: 88, padding: '11px 13px', border: '1px solid var(--border-strong)', borderRadius: 9, font: 'inherit', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button className="btn" onClick={() => { setAppealMode(false); setSelectedItems(new Set()); }} disabled={busy}>취소</button>
                <button className="btn btn-primary" onClick={handleSubmitAppeal} disabled={busy}>이의 제기 제출</button>
              </div>
            </div>
          )}

          {canAct && !appealMode && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button className="btn" onClick={() => setAppealMode(true)} disabled={busy}>이의 제기</button>
              <button className="btn btn-primary" onClick={handleConfirm} disabled={busy}>확인 완료</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
