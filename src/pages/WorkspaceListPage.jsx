import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { stageBadgeClass } from '../utils/stage';
import NewTaskModal from '../components/NewTaskModal';

export default function WorkspaceListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [works, setWorks] = useState(null);
  const [workTypes, setWorkTypes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    Promise.all([api.get('/api/works?scope=mine'), api.get('/api/work-types')])
      .then(([w, types]) => { setWorks(w); setWorkTypes(types); })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  const rows = useMemo(() => {
    if (!works) return [];
    const q = search.trim().toLowerCase();
    return works.filter((w) => (filter === 'all' || w.workType === filter) && (!q || w.title.toLowerCase().includes(q)));
  }, [works, filter, search]);

  function initialOf(w) {
    return (w.workTypeLabel || w.title || '?').slice(0, 2).toUpperCase();
  }

  function handleCreated(workId) {
    setModalOpen(false);
    navigate(`/workspace/${workId}`);
  }

  return (
    <section className="page active">
      <div className="topheader">
        <h1>AI 업무 공간</h1>
        <div className="header-right">
          <div className="search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input type="text" placeholder="업무 검색..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
            새 업무 생성
          </button>
        </div>
      </div>
      <div className="ws-tabs">
        <button className={`ws-tab${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>전체</button>
        {workTypes.map((t) => (
          <button key={t.workType} className={`ws-tab${filter === t.workType ? ' active' : ''}`} onClick={() => setFilter(t.workType)}>{t.label}</button>
        ))}
      </div>

      {error && <p className="task-sub" style={{ color: 'var(--red)' }}>{error}</p>}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th><span className="th-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>업무</span></th>
              <th>업무 유형</th>
              <th>상태</th>
              <th><span className="th-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>최종 수정</span></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.workId}>
                <td>
                  <div className="task-name-cell">
                    <div className="avatar" style={{ background: 'var(--gray-soft)', color: 'var(--text-muted)' }}>{initialOf(w)}</div>
                    <div><div className="task-name">{w.title}</div><div className="task-sub">{w.workId}</div></div>
                  </div>
                </td>
                <td>{w.workTypeLabel || '유형 미정'}</td>
                <td><span className={`badge ${stageBadgeClass(w.stage)}`}>{w.stage}</span></td>
                <td className="mono">{new Date(w.updatedAt).toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-open" onClick={() => navigate(`/workspace/${w.workId}`)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 6l6 6-6 6" /></svg>열기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {works && rows.length === 0 && <p className="task-sub" style={{ padding: 16 }}>업무가 없어요.</p>}
      </div>

      {modalOpen && <NewTaskModal onClose={() => setModalOpen(false)} onCreated={handleCreated} workTypes={workTypes} />}
    </section>
  );
}
