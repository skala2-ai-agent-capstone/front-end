import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';

const REPORT_STATUS_LABEL = { generated: '생성됨', insufficient_data: '데이터 부족', withheld: '보류' };
const REPORT_STATUS_BADGE = { generated: 'badge-green', insufficient_data: 'badge-gray', withheld: 'badge-amber' };

function renderListItem(item, i) {
  if (item == null) return null;
  if (typeof item === 'string') return <li key={i}>{item}</li>;
  if (typeof item === 'object') {
    const label = item.label || item.name || item.itemId || item.title || `항목 ${i + 1}`;
    const rest = Object.entries(item).filter(([k]) => !['label', 'name', 'itemId', 'title'].includes(k) && item[k] != null);
    return (
      <li key={i}>
        <b>{label}</b>
        {rest.length > 0 && (
          <span className="task-sub"> · {rest.map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`).join(' · ')}</span>
        )}
      </li>
    );
  }
  return null;
}

export default function TeamCoachingReportPage() {
  const { profile, toast } = useApp();
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [creating, setCreating] = useState(false);
  const pollTimerRef = useRef(null);

  const loadList = useCallback(() => {
    api.get(`/api/teams/${profile.teamId}/evaluations`).then(setList).catch((err) => setError(err.message));
  }, [profile.teamId]);

  useEffect(loadList, [loadList]);

  useEffect(() => () => clearTimeout(pollTimerRef.current), []);

  function loadDetail(requestId) {
    setOpenId(requestId);
    setDetail(null);
    setDetailError('');
    clearTimeout(pollTimerRef.current);

    function poll() {
      api.get(`/api/teams/${profile.teamId}/evaluations/${requestId}`)
        .then((d) => {
          setDetail(d);
          if (d.evaluation.status === '대기') {
            pollTimerRef.current = setTimeout(poll, 2500);
          } else {
            loadList();
          }
        })
        .catch((err) => setDetailError(err.message));
    }
    poll();
  }

  async function handleCreate() {
    if (!from || !to) { toast('시작일과 종료일을 모두 선택하세요'); return; }
    if (from > to) { toast('시작일이 종료일보다 늦을 수 없어요'); return; }
    setCreating(true);
    try {
      const res = await api.post(`/api/teams/${profile.teamId}/evaluations`, { from, to });
      toast('팀 코칭 리포트를 요청했어요. 잠시 후 결과를 확인하세요.');
      loadDetail(res.requestId);
    } catch (err) {
      toast(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="page active">
      <div className="topheader"><h1>팀 코칭 리포트</h1></div>
      <div className="page-sub"><p>기간별 팀 집계 근거로 코칭 리포트를 생성합니다. 개인 정보는 담기지 않아요.</p></div>

      <div className="card" style={{ padding: 18, marginBottom: 16, display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>시작일</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>종료일 (포함)</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>{creating ? '요청 중…' : '새 리포트 생성'}</button>
      </div>

      {error && <p className="task-sub" style={{ color: 'var(--red)' }}>{error}</p>}
      {!error && !list && <p className="task-sub">불러오는 중…</p>}
      {list && list.length === 0 && <p className="task-sub">아직 생성한 팀 코칭 리포트가 없어요.</p>}

      {list && list.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <table>
            <thead><tr><th>기간</th><th>상태</th><th>결과</th><th>요청</th><th></th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.requestId} className="row-link" onClick={() => loadDetail(r.requestId)}>
                  <td>{r.periodFrom} ~ {r.periodTo}</td>
                  <td>{r.status}</td>
                  <td>{r.reportStatus ? <span className={`badge ${REPORT_STATUS_BADGE[r.reportStatus] || 'badge-gray'}`}>{REPORT_STATUS_LABEL[r.reportStatus] || r.reportStatus}</span> : '-'}</td>
                  <td className="mono">{new Date(r.requestedAt).toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <svg className="row-link-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 6l6 6-6 6" /></svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openId && (
        <div className="card" style={{ padding: 20 }}>
          {detailError && <p className="task-sub" style={{ color: 'var(--red)' }}>{detailError}</p>}
          {!detailError && !detail && <p className="task-sub">불러오는 중…</p>}
          {detail && detail.evaluation.status === '대기' && <p className="task-sub">리포트를 만들고 있어요. 잠시만 기다려주세요…</p>}
          {detail && detail.evaluation.status === '실패' && <p className="task-sub" style={{ color: 'var(--red)' }}>리포트 생성에 실패했어요{detail.evaluation.error ? ` (${detail.evaluation.error})` : ''}.</p>}
          {detail && detail.evaluation.status === '완료' && detail.report && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <b style={{ fontSize: 16 }}>{detail.evaluation.periodFrom} ~ {detail.evaluation.periodTo}</b>
                <span className={`badge ${REPORT_STATUS_BADGE[detail.report.status] || 'badge-gray'}`}>{REPORT_STATUS_LABEL[detail.report.status] || detail.report.status}</span>
              </div>
              {detail.report.summary && <p style={{ marginBottom: 14 }}>{detail.report.summary}</p>}

              {detail.report.metrics?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <h3 style={{ fontSize: 14, marginBottom: 6 }}>집계 지표</h3>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>{detail.report.metrics.map(renderListItem)}</ul>
                </div>
              )}
              {detail.report.strengths?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <h3 style={{ fontSize: 14, marginBottom: 6 }}>강점</h3>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>{detail.report.strengths.map(renderListItem)}</ul>
                </div>
              )}
              {detail.report.improvements?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <h3 style={{ fontSize: 14, marginBottom: 6 }}>보완점</h3>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>{detail.report.improvements.map(renderListItem)}</ul>
                </div>
              )}
              {detail.report.limitations?.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 12.5, color: 'var(--text-faint)', marginBottom: 6 }}>유의사항</h3>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-faint)' }}>
                    {detail.report.limitations.map((l, i) => <li key={i}>{l}</li>)}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
