import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TASK_INITIALS, TYPE_FILTERS } from '../data/tasks';
import NewTaskModal from '../components/NewTaskModal';

export default function WorkspaceListPage() {
  const { tasks } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);

  const rows = useMemo(
    () => Object.entries(tasks).filter(([, t]) => filter === 'all' || t.typeKey === filter),
    [tasks, filter],
  );

  function initialOf(id, t) {
    return TASK_INITIALS[t.typeKey] || id.slice(0, 2).toUpperCase();
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

      <div className="card">
        <div className="tbl-head">
          <b style={{ fontSize: 15 }}>전체 업무</b>
          <div className="filters">
            {TYPE_FILTERS.map(([key, label]) => (
              <span key={key} className={`chip${filter === key ? ' on' : ''}`} onClick={() => setFilter(key)}>{label}</span>
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
            {rows.map(([id, t]) => (
              <tr key={id}>
                <td>
                  <div className="task-name-cell">
                    <div className="avatar" style={{ background: 'var(--gray-soft)', color: 'var(--text-muted)' }}>{initialOf(id, t)}</div>
                    <div><div className="task-name">{t.title}</div><div className="task-sub">{id.toUpperCase()}</div></div>
                  </div>
                </td>
                <td>{t.type}</td>
                <td><span className={`badge ${t.statusClass}`}>{t.status}</span></td>
                <td className="mono">{t.updated}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn-open" onClick={() => navigate(`/workspace/${id}`)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 6l6 6-6 6" /></svg>열기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && <NewTaskModal onClose={() => setModalOpen(false)} />}
    </section>
  );
}
