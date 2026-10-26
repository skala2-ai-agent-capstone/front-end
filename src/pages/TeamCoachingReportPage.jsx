import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { REPORT_STATUS_BADGE, REPORT_STATUS_LABEL } from '../utils/coachingReport';

export default function TeamCoachingReportPage() {
  const { profile, toast } = useApp();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.get(`/api/teams/${profile.teamId}/evaluations`).then(setList).catch((err) => setError(err.message));
  }, [profile.teamId]);

  async function handleCreate() {
    if (!from || !to) { toast('시작일과 종료일을 모두 선택하세요'); return; }
    if (from > to) { toast('시작일이 종료일보다 늦을 수 없어요'); return; }
    setCreating(true);
    try {
      const res = await api.post(`/api/teams/${profile.teamId}/evaluations`, { from, to });
      toast('팀 코칭 리포트를 요청했어요. 잠시 후 결과를 확인하세요.');
      navigate(`/dashboard/coaching/${res.requestId}`);
    } catch (err) {
      toast(err.message);
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
        <div className="card">
          <table>
            <thead><tr><th>기간</th><th>상태</th><th>결과</th><th>요청</th><th></th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.requestId} className="row-link" onClick={() => navigate(`/dashboard/coaching/${r.requestId}`)}>
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
    </section>
  );
}
