import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { stageBadgeClass } from '../utils/stage';

const STAGE_ORDER = ['작성 중', '평가 대기', '평가 중', '확인 대기', '검토 중', '확정', '자료 보류', '평가 실패'];
const SCORE_MAX = 10;
const SCORE_TICKS = [10, 5, 0];
const CHART_H = 170;
const BAR_W = 28;

function ScoreBarChart({ byType }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--primary)', display: 'inline-block' }} />이번 주
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--border-strong)', display: 'inline-block' }} />지난주
        </span>
      </div>

      <div style={{ display: 'flex' }}>
        <div style={{ position: 'relative', width: 20, height: CHART_H, marginRight: 6, flex: 'none' }}>
          {SCORE_TICKS.map((v) => (
            <span key={v} style={{ position: 'absolute', right: 0, top: `${(SCORE_MAX - v) / SCORE_MAX * 100}%`, transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-faint)' }}>{v}</span>
          ))}
        </div>

        <div style={{ position: 'relative', flex: 1, height: CHART_H, borderLeft: '1px solid var(--border)' }}>
          {SCORE_TICKS.map((v) => (
            <div key={v} style={{ position: 'absolute', left: 0, right: 0, top: `${(SCORE_MAX - v) / SCORE_MAX * 100}%`, borderTop: '1px solid var(--border)' }} />
          ))}
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            {byType.map((t) => (
              <div key={t.workType} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4 }}>
                <ScoreColumn value={t.thisWeek} color="var(--primary)" />
                <ScoreColumn value={t.lastWeek} color="var(--border-strong)" valueColor="var(--text-muted)" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', marginLeft: 26 }}>
        {byType.map((t) => (
          <div key={t.workType} style={{ flex: 1, textAlign: 'center', marginTop: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t.label}</div>
            <div className="task-sub" style={{ fontSize: 11 }}>{t.works}건</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreColumn({ value, color, valueColor }) {
  const barHeight = value != null ? Math.max(0, Math.min(100, (value / SCORE_MAX) * 100)) / 100 * CHART_H : 0;
  return (
    <div style={{ width: BAR_W, height: CHART_H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
      <span className="mono" style={{ fontSize: 11.5, marginBottom: 4, color: value != null ? (valueColor || 'var(--text)') : 'var(--text-faint)', fontWeight: value != null && !valueColor ? 700 : 400 }}>
        {value != null ? value.toFixed(1) : '-'}
      </span>
      <div style={{ width: '100%', height: barHeight, background: value != null ? color : 'transparent', borderRadius: '4px 4px 0 0' }} />
    </div>
  );
}

export default function TaskDashboardPage() {
  const { role, profile } = useApp();
  const navigate = useNavigate();
  const [works, setWorks] = useState(null);
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState('');

  const isSales = role === 'member';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await api.get('/api/works?scope=mine');
        if (!cancelled) setWorks(list);
        if (isSales) {
          const s = await api.get('/api/works/summary');
          if (!cancelled) setStats(s);
        } else {
          const r = await api.get('/api/reviews');
          if (!cancelled) setReviews(r);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [isSales]);

  const recentWorks = useMemo(() => {
    if (!works) return [];
    return [...works].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3);
  }, [works]);

  const pendingReviewCount = useMemo(() => {
    if (!reviews) return null;
    return reviews.filter((r) => r.status === '검토 대기').length;
  }, [reviews]);

  const sortedReviews = useMemo(() => {
    if (!reviews) return [];
    return [...reviews].sort((a, b) => (a.status === '검토 대기' ? 0 : 1) - (b.status === '검토 대기' ? 0 : 1));
  }, [reviews]);

  return (
    <section className="page active task-dashboard-page">
      <div className="topheader">
        <h1>업무 현황</h1>
        <div className="header-right">
          <button className="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg></button>
          <div className="avatar" style={{ background: 'var(--gray-soft)', color: 'var(--text-muted)' }}>{profile.avatarInitial}</div>
        </div>
      </div>
      <div className="page-sub">
        <p>{isSales ? '진행 중인 영업 업무와 자동 평가 상태를 확인하세요.' : '내 업무와 지금 검토·확인이 필요한 평가 건을 확인하세요.'}</p>
      </div>

      {error && <p className="task-sub" style={{ color: 'var(--red)' }}>{error}</p>}

      {!isSales && (
        <>
          <div className="stat-row">
            <div className="card stat-card"><div className="stat-label">검토 대기</div><div className="stat-val">{pendingReviewCount != null ? pendingReviewCount : '-'}</div></div>
          </div>

          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <b style={{ fontSize: 18 }}>평가 검토가 필요한 업무</b>
              {reviews && reviews.length >= 4 && (
                <button className="btn-link" onClick={() => navigate('/review')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 16, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                  전체 보기 →
                </button>
              )}
            </div>
            {reviews && reviews.length > 0 && (
              <div className="recent-row">
                {sortedReviews.slice(0, 3).map((r) => (
                  <button key={r.reviewRequestId} className="ws-card" onClick={() => navigate(`/review/${r.reviewRequestId}`)}>
                    <div className="ws-card-top"><span className="badge badge-red">{r.displayStatus}</span></div>
                    <div className="ws-card-title">{r.taskTitle || r.taskId}</div>
                    <div className="ws-card-type">{r.workTypeLabel || r.workType} · {r.reason}</div>
                    <div className="mono" style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{r.employeeName || r.employeeId} · {new Date(r.submittedAt).toLocaleDateString()}</div>
                  </button>
                ))}
              </div>
            )}
            {reviews && reviews.length === 0 && <p className="task-sub">지금 검토가 필요한 업무가 없어요.</p>}
            {!reviews && !error && <p className="task-sub">불러오는 중…</p>}
          </div>
        </>
      )}

      {isSales && stats && (
        <>
          {stats.needsMaterial > 0 && (
            <div className="info-banner warn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
              <b>자료 보완이 필요한 업무가 {stats.needsMaterial}건 있어요.</b>&nbsp;자료를 보완했다면 담당 팀장에게 AI 재평가를 요청하세요.
            </div>
          )}

          <div className="stat-row">
            <div className="card stat-card"><div className="stat-label">전체 업무</div><div className="stat-val">{stats.total}</div></div>
            <div className="card stat-card"><div className="stat-label">평가 중</div><div className="stat-val">{stats.stages['평가 중'] || 0}</div></div>
            <div className="card stat-card"><div className="stat-label">확정 완료</div><div className="stat-val">{stats.stages['확정'] || 0}</div></div>
            <div className="card stat-card"><div className="stat-label">자료 보류</div><div className="stat-val">{stats.needsMaterial}</div></div>
          </div>

          <div className="widget-row">
            <div className="card widget">
              <div className="widget-head"><div className="widget-title"><div className="widget-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19V10M12 19V5M20 19v-7" /></svg></div>업무 유형별 평균 점수 (10점 만점)</div></div>
              <ScoreBarChart byType={stats.byType} />
            </div>
            <div className="card widget">
              <div className="widget-head"><div className="widget-title"><div className="widget-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /></svg></div>업무 상태</div></div>
              {STAGE_ORDER.filter((s) => stats.stages[s]).map((s) => (
                <div className="list-row" key={s}><span className="l">● {s}</span><span className="r">{stats.stages[s]}</span></div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <b style={{ fontSize: 18 }}>최근 업무</b>
          {works && works.length >= 4 && (
            <button className="btn-link" onClick={() => navigate('/workspace')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 16, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
              전체 업무 →
            </button>
          )}
        </div>
        <div className="recent-row">
          {recentWorks.map((w) => (
            <button key={w.workId} className="ws-card" onClick={() => navigate(`/workspace/${w.workId}`)}>
              <div className="ws-card-top"><span className={`badge ${stageBadgeClass(w.stage)}`}>{w.stage}</span><span className="mono">{new Date(w.updatedAt).toLocaleDateString()}</span></div>
              <div className="ws-card-title">{w.title}</div>
              <div className="ws-card-type">{w.workTypeLabel || '유형 미정'}</div>
            </button>
          ))}
        </div>
        {works && recentWorks.length === 0 && <p className="task-sub">업무가 없어요.</p>}
        {!works && !error && <p className="task-sub">불러오는 중…</p>}
      </div>
    </section>
  );
}
