import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { stageBadgeClass } from '../utils/stage';

const STAGE_ORDER = ['작성 중', '평가 대기', '평가 중', '확인 대기', '검토 중', '확정', '자료 보류', '평가 실패'];
const SCORE_MAX = 10;
const SCORE_TICKS = [0, 5, 10];

function ScoreBarChart({ byType }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--primary)', display: 'inline-block' }} />이번 주
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--border-strong)', display: 'inline-block' }} />지난주
        </span>
      </div>

      {byType.map((t) => (
        <div key={t.workType} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 7 }}>
            {t.label} <span className="task-sub" style={{ fontWeight: 400 }}>· {t.works}건</span>
          </div>
          <ScoreBarRow value={t.thisWeek} color="var(--primary)" />
          <ScoreBarRow value={t.lastWeek} color="var(--border-strong)" valueColor="var(--text-muted)" />
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid var(--border)' }}>
          {SCORE_TICKS.map((v) => <span key={v} style={{ fontSize: 11, color: 'var(--text-faint)' }}>{v}</span>)}
        </div>
        <span style={{ width: 34 }} />
      </div>
    </div>
  );
}

function ScoreBarRow({ value, color, valueColor }) {
  const pct = value != null ? Math.min(100, (value / SCORE_MAX) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
      <div style={{ flex: 1, height: 10, borderRadius: 4, background: 'var(--gray-soft)', overflow: 'hidden' }}>
        {value != null && (
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '0 4px 4px 0' }} />
        )}
      </div>
      <span className="mono" style={{ width: 34, textAlign: 'right', fontSize: 12.5, color: valueColor || 'var(--text)', fontWeight: valueColor ? 400 : 700 }}>
        {value != null ? value.toFixed(1) : '-'}
      </span>
    </div>
  );
}

export default function TaskDashboardPage() {
  const { role, profile } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [works, setWorks] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const isSales = role === 'member';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await api.get(`/api/works?scope=${isSales ? 'mine' : 'team'}`);
        if (!cancelled) setWorks(list);
        if (isSales) {
          const s = await api.get('/api/works/summary');
          if (!cancelled) setStats(s);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [isSales]);

  const visibleWorks = useMemo(() => {
    if (!works) return [];
    const q = search.trim().toLowerCase();
    const filtered = works.filter((w) => !q || w.title.toLowerCase().includes(q));
    if (!isSales) return filtered;
    return [...filtered].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3);
  }, [works, search, isSales]);

  return (
    <section className="page active task-dashboard-page">
      <div className="topheader">
        <h1>업무 현황</h1>
        <div className="header-right">
          <div className="search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input type="text" placeholder="업무 검색..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <span className="kbd">⌘K</span>
          </div>
          <button className="icon-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg></button>
          <div className="avatar" style={{ background: 'var(--gray-soft)', color: 'var(--text-muted)' }}>{profile.avatarInitial}</div>
        </div>
      </div>
      <div className="page-sub">
        <p>{isSales ? '진행 중인 영업 업무와 자동 평가 상태를 확인하세요.' : '전체 업무 목록을 확인하세요. 팀장 업무는 평가·코칭 대상이 아닙니다.'}</p>
      </div>

      {error && <p className="task-sub" style={{ color: 'var(--red)' }}>{error}</p>}

      {isSales && stats && (
        <>
          {stats.needsMaterial > 0 && (
            <div className="info-banner warn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
              <b>자료 보완이 필요한 업무가 {stats.needsMaterial}건 있어요.</b>&nbsp;참조 자료를 추가하면 평가가 자동으로 재개됩니다.
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
          <b style={{ fontSize: 15 }}>{isSales ? '최근 업무' : '전체 업무'}</b>
          {isSales && (
            <button className="btn-link" onClick={() => navigate('/workspace')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
              전체 업무 →
            </button>
          )}
        </div>
        <div className="recent-row">
          {visibleWorks.map((w) => (
            <button key={w.workId} className="ws-card" onClick={() => navigate(`/workspace/${w.workId}`)}>
              <div className="ws-card-top"><span className={`badge ${stageBadgeClass(w.stage)}`}>{w.stage}</span><span className="mono">{new Date(w.updatedAt).toLocaleDateString()}</span></div>
              <div className="ws-card-title">{w.title}</div>
              <div className="ws-card-type">{w.workTypeLabel || '유형 미정'}{!isSales && w.employeeName ? ` · ${w.employeeName}` : ''}</div>
            </button>
          ))}
        </div>
        {works && visibleWorks.length === 0 && <p className="task-sub">검색 결과가 없어요.</p>}
        {!works && !error && <p className="task-sub">불러오는 중…</p>}
      </div>
    </section>
  );
}
