import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';

function trendPoints(dailyTrend) {
  if (!dailyTrend.length) return '';
  const max = Math.max(1, ...dailyTrend.map((d) => d.count));
  const n = dailyTrend.length;
  return dailyTrend.map((d, i) => {
    const x = n === 1 ? 0 : (i / (n - 1)) * 400;
    const y = 150 - (d.count / max) * 140;
    return `${x},${y}`;
  }).join(' ');
}

export default function TeamDashboardPage() {
  const { profile, toast } = useApp();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [busyType, setBusyType] = useState(null);
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');

  function load(from, to) {
    const query = from && to ? `?from=${from}&to=${to}` : '';
    api.get(`/api/teams/${profile.teamId}/dashboard${query}`)
      .then((d) => { setDashboard(d); setFromInput(d.periodFrom); setToInput(d.periodTo); })
      .catch((err) => setError(err.message));
  }

  useEffect(() => load(), [profile.teamId]);

  function applyPeriod() {
    if (!fromInput || !toInput) { toast('시작일과 종료일을 모두 선택하세요'); return; }
    if (fromInput > toInput) { toast('시작일이 종료일보다 늦을 수 없어요'); return; }
    load(fromInput, toInput);
  }

  async function approve(workType) {
    setBusyType(workType);
    try {
      await api.post(`/api/teams/${profile.teamId}/dashboard/approve`, {
        workType, from: dashboard.periodFrom, to: dashboard.periodTo,
      });
      toast(`${workType} 집계를 승인했어요.`);
      load();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusyType(null);
    }
  }

  if (error) return <section className="page active"><div className="topheader"><h1>팀 대시보드</h1></div><p className="task-sub" style={{ color: 'var(--red)' }}>{error}</p></section>;
  if (!dashboard) return <section className="page active"><div className="topheader"><h1>팀 대시보드</h1></div><p className="task-sub">불러오는 중…</p></section>;

  const { stats } = dashboard;

  return (
    <section className="page active">
      <div className="topheader">
        <h1>팀 대시보드</h1>
        <div className="header-right">
          <div className="dchip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
            <input type="date" value={fromInput} onChange={(e) => setFromInput(e.target.value)}
              style={{ border: 'none', background: 'none', font: 'inherit', color: 'inherit', padding: 0, width: 118 }} />
            <span style={{ color: 'var(--text-faint)' }}>-</span>
            <input type="date" value={toInput} onChange={(e) => setToInput(e.target.value)}
              style={{ border: 'none', background: 'none', font: 'inherit', color: 'inherit', padding: 0, width: 118 }} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={applyPeriod}>적용</button>
        </div>
      </div>
      <div className="page-sub"><p>{dashboard.teamName} · 최소 집계 인원 {dashboard.minAggregationSize}명</p></div>

      <div className="stat-row">
        <div className="card stat-card"><div className="stat-label">수집 건수</div><div className="stat-val">{stats.collectedCount}</div></div>
        <div className="card stat-card"><div className="stat-label">평가 처리율</div><div className="stat-val">{stats.processRate}%</div></div>
        <div className="card stat-card"><div className="stat-label">확정 건수</div><div className="stat-val">{stats.confirmedCount}</div></div>
        <div className="card stat-card"><div className="stat-label">미관측 비율</div><div className="stat-val">{stats.unobservedRate}%</div></div>
      </div>
      <div className="stat-row">
        <div className="card stat-card"><div className="stat-label">집계 제외 건수</div><div className="stat-val">{stats.excludedCount}</div></div>
        <div className="card stat-card"><div className="stat-label">집계 대상 인원</div><div className="stat-val">{stats.targetMemberCount}명</div></div>
        <div className="card stat-card"><div className="stat-label">집계 대상 유형</div><div className="stat-val">{stats.targetTypeCount}개</div></div>
      </div>

      <div className="card widget" style={{ marginBottom: 18 }}>
        <div className="widget-head"><div className="widget-title">일별 평가 접수 추이</div></div>
        <div className="area-chart">
          <svg viewBox="0 0 400 150" preserveAspectRatio="none">
            <polyline points={trendPoints(dashboard.dailyTrend)} fill="none" stroke="#665EFD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="axis-row">{dashboard.dailyTrend.map((d) => <span key={d.date}>{d.date.slice(5)}</span>)}</div>
      </div>

      {dashboard.workTypes.map((wt) => (
        <div className="card" style={{ padding: 18, marginBottom: 16 }} key={wt.workType}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div><b>{wt.workTypeName}</b> <span className="task-sub">수집 {wt.collectedCount}건 · 확정 {wt.confirmedCount}건 · 대상 {wt.memberCount}명</span></div>
            <button className="btn btn-primary btn-sm" onClick={() => approve(wt.workType)} disabled={busyType === wt.workType || wt.restricted}>
              {wt.approval ? '재승인' : '집계 승인'}
            </button>
          </div>

          {wt.restricted ? (
            <span className="badge badge-gray">{wt.message || '최소 인원 미달로 상세 통계 비공개'}</span>
          ) : (
            <>
              {wt.items.map((item) => (
                <div className="list-row" key={item.itemId}>
                  <span className="l">{item.name} · 평가가능 {item.observedRate}%</span>
                  <span className="r">{item.averageScore != null ? `${item.averageScore.toFixed(1)}점` : '-'}</span>
                </div>
              ))}
              {wt.topIssues.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <b style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>반복 보완점</b>
                  {wt.topIssues.map((issue) => (
                    <div className="list-row" key={issue.itemId}><span className="l">{issue.label}</span><span className="badge badge-amber">{issue.count}건</span></div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </section>
  );
}
