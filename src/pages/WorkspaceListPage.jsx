import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { stageBadgeClass } from '../utils/stage';
import NewTaskModal from '../components/NewTaskModal';

export default function WorkspaceListPage() {
  const navigate = useNavigate();
  const [works, setWorks] = useState(null);
  const [workTypes, setWorkTypes] = useState([]);
  const [filter, setFilter] = useState('all');
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
    return works.filter((w) => filter === 'all' || w.workType === filter);
  }, [works, filter]);

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
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          새 업무 생성
        </button>
      </div>
      <div className="page-sub"><p>작업할 업무를 선택하세요. AI와 대화하며 산출물을 작성합니다.</p></div>

      {error && <p className="task-sub" style={{ color: 'var(--red)' }}>{error}</p>}

      <div className="card">
        <div className="tbl-head">
          <b style={{ fontSize: 15 }}>전체 업무</b>
          <div className="filters">
            <span className={`chip${filter === 'all' ? ' on' : ''}`} onClick={() => setFilter('all')}>전체</span>
            {workTypes.map((t) => (
              <span key={t.workType} className={`chip${filter === t.workType ? ' on' : ''}`} onClick={() => setFilter(t.workType)}>{t.label}</span>
            ))}
          </div>
        </div>
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
