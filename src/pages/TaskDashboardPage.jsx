import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function TaskDashboardPage() {
  const { role, profile, tasks } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const isSales = role === 'member';

  const visibleTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return Object.entries(tasks).filter(([, t]) => !q || t.title.toLowerCase().includes(q));
  }, [tasks, search]);

  return (
    <section className="page active">
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

      {isSales && (
        <>
          <div className="info-banner warn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
            <b>자료 보완이 필요한 업무가 2건 있어요.</b>&nbsp;참조 자료를 추가하면 평가가 자동으로 재개됩니다.
          </div>

          <div className="stat-row">
            <div className="card stat-card">
              <div className="stat-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>전체 업무</div>
              <div className="stat-val">18</div>
              <div className="stat-delta up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 17l5-10 5 10" /></svg>4개 유형<span className="muted">· 전체</span></div>
            </div>
            <div className="card stat-card">
              <div className="stat-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>평가 진행 중</div>
              <div className="stat-val">6</div>
              <div className="stat-delta up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 17l5-10 5 10" /></svg>처리율 92%<span className="muted">· 전주 대비</span></div>
            </div>
            <div className="card stat-card">
              <div className="stat-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 11l3 3L22 4" /></svg>확정 완료</div>
              <div className="stat-val">9</div>
              <div className="stat-delta up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 17l5-10 5 10" /></svg>+2<span className="muted">· 이번 주</span></div>
            </div>
            <div className="card stat-card">
              <div className="stat-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>보류 중</div>
              <div className="stat-val">2</div>
              <div className="stat-delta down"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 7l5 10 5-10" /></svg>자료 보완 필요</div>
            </div>
          </div>

          <div className="widget-row">
            <div className="card widget">
              <div className="widget-head">
                <div className="widget-title"><div className="widget-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19V10M12 19V5M20 19v-7" /></svg></div>업무 유형별 평균 점수</div>
                <div className="legend-row">
                  <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--primary)' }}></span>이번 주</div>
                  <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--primary-subdued)', border: '1px solid var(--primary)' }}></span>지난 주</div>
                </div>
              </div>
              <div className="bars-wrap">
                <div className="bar-tip" style={{ left: '38%' }}>
                  <div className="tt-head">견적서 작성</div>
                  <div className="tt-row"><span className="dot" style={{ background: 'var(--primary)' }}></span>8.0점</div>
                  <div className="tt-row"><span className="dot" style={{ background: 'var(--primary-subdued)', border: '1px solid var(--primary)' }}></span>7.2점</div>
                </div>
                <div className="bars">
                  <div className="bar-col"><div className="bar-stack" style={{ height: '70%' }}><div className="bar-seg-1" style={{ height: '20%' }}></div><div className="bar-seg-2" style={{ height: '80%' }}></div></div><div className="bar-label">RFP분석</div></div>
                  <div className="bar-col"><div className="bar-stack" style={{ height: '55%' }}><div className="bar-seg-1" style={{ height: '30%' }}></div><div className="bar-seg-2" style={{ height: '70%' }}></div></div><div className="bar-label">제안서</div></div>
                  <div className="bar-col lead"><div className="bar-stack" style={{ height: '80%' }}><div className="bar-seg-1" style={{ height: '10%' }}></div><div className="bar-seg-2" style={{ height: '90%' }}></div></div><div className="bar-label">견적서</div></div>
                  <div className="bar-col"><div className="bar-stack" style={{ height: '40%' }}><div className="bar-seg-1" style={{ height: '35%' }}></div><div className="bar-seg-2" style={{ height: '65%' }}></div></div><div className="bar-label">질의답변</div></div>
                </div>
              </div>
            </div>
            <div className="card widget">
              <div className="widget-head"><div className="widget-title"><div className="widget-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /></svg></div>업무 상태</div></div>
              <div className="list-row"><span className="l">● 작성 중</span><span className="r">5</span></div>
              <div className="list-row"><span className="l">● 평가 중</span><span className="r">6</span></div>
              <div className="list-row"><span className="l">● 확인 대기</span><span className="r">3</span></div>
              <div className="list-row"><span className="l">● 확정</span><span className="r">4</span></div>
            </div>
          </div>
        </>
      )}

      <div className="card" style={{ padding: 20 }}>
        <b style={{ fontSize: 15, display: 'block', marginBottom: 14 }}>최근 업무</b>
        <div className="recent-row">
          {visibleTasks.map(([id, t]) => (
            <button key={id} className="ws-card" onClick={() => navigate(`/workspace/${id}`)}>
              <div className="ws-card-top"><span className={`badge ${t.statusClass}`}>{t.status}</span><span className="mono">{t.updated}</span></div>
              <div className="ws-card-title">{t.title}</div>
              <div className="ws-card-type">{t.type}</div>
            </button>
          ))}
        </div>
        {visibleTasks.length === 0 && <p className="task-sub">검색 결과가 없어요.</p>}
      </div>
    </section>
  );
}
