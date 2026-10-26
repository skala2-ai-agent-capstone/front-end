import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { REPORT_STATUS_BADGE, REPORT_STATUS_LABEL } from '../utils/coachingReport';

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

export default function TeamCoachingReportDetailPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { profile } = useApp();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let timer;
    let cancelled = false;
    setDetail(null);
    setError('');

    // 생성 중(대기)이면 끝날 때까지 다시 조회한다
    function poll() {
      api.get(`/api/teams/${profile.teamId}/evaluations/${requestId}`)
        .then((d) => {
          if (cancelled) return;
          setDetail(d);
          if (d.evaluation.status === '대기') timer = setTimeout(poll, 2500);
        })
        .catch((err) => { if (!cancelled) setError(err.message); });
    }
    poll();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [profile.teamId, requestId]);

  const report = detail?.report;
  const evaluation = detail?.evaluation;

  return (
    <section className="page active">
      <div className="topheader">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button className="btn-back" onClick={() => navigate('/dashboard/coaching')} title="목록으로">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <h1>팀 코칭 리포트</h1>
        </div>
        {report && <span className={`badge ${REPORT_STATUS_BADGE[report.status] || 'badge-gray'}`}>{REPORT_STATUS_LABEL[report.status] || report.status}</span>}
      </div>
      {evaluation && (
        <div className="page-sub"><p>{evaluation.periodFrom} ~ {evaluation.periodTo}</p></div>
      )}

      <div className="card" style={{ padding: 20 }}>
        {error && <p className="task-sub" style={{ color: 'var(--red)' }}>{error}</p>}
        {!error && !detail && <p className="task-sub">불러오는 중…</p>}
        {evaluation?.status === '대기' && <p className="task-sub">리포트를 만들고 있어요. 잠시만 기다려주세요…</p>}
        {evaluation?.status === '실패' && <p className="task-sub" style={{ color: 'var(--red)' }}>리포트 생성에 실패했어요{evaluation.error ? ` (${evaluation.error})` : ''}.</p>}
        {evaluation?.status === '완료' && report && (
          <>
            {report.summary && <p style={{ marginBottom: 14 }}>{report.summary}</p>}

            {report.metrics?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, marginBottom: 6 }}>집계 지표</h3>
                <ul style={{ margin: 0, paddingLeft: 18 }}>{report.metrics.map(renderListItem)}</ul>
              </div>
            )}
            {report.strengths?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, marginBottom: 6 }}>강점</h3>
                <ul style={{ margin: 0, paddingLeft: 18 }}>{report.strengths.map(renderListItem)}</ul>
              </div>
            )}
            {report.improvements?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, marginBottom: 6 }}>보완점</h3>
                <ul style={{ margin: 0, paddingLeft: 18 }}>{report.improvements.map(renderListItem)}</ul>
              </div>
            )}
            {report.limitations?.length > 0 && (
              <div>
                <h3 style={{ fontSize: 12.5, color: 'var(--text-faint)', marginBottom: 6 }}>유의사항</h3>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-faint)' }}>
                  {report.limitations.map((l, i) => <li key={i}>{l}</li>)}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
