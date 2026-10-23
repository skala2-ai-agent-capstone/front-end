import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function ReviewListPage() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/reviews').then(setReviews).catch((err) => setError(err.message));
  }, []);

  return (
    <section className="page active">
      <div className="topheader"><h1>평가 검토</h1></div>
      <div className="page-sub"><p>이의가 제기되었거나 채점 불일치가 감지된 건을 검토합니다.</p></div>

      {error && <p className="task-sub" style={{ color: 'var(--red)' }}>{error}</p>}
      {!error && !reviews && <p className="task-sub">불러오는 중…</p>}
      {reviews && reviews.length === 0 && <p className="task-sub">처리할 검토 건이 없어요.</p>}

      {reviews && reviews.length > 0 && (
        <div className="card">
          <table>
            <thead>
              <tr><th>업무</th><th>유형</th><th>사유</th><th>상태</th><th>접수</th><th></th></tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.reviewRequestId}>
                  <td><div className="task-name">{r.taskTitle || r.taskId}</div><div className="task-sub">{r.employeeId}</div></td>
                  <td>{r.workType || '-'}</td>
                  <td>{r.reason}</td>
                  <td><span className="badge badge-red">{r.displayStatus}</span></td>
                  <td className="mono">{new Date(r.submittedAt).toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-open" onClick={() => navigate(`/review/${r.reviewRequestId}`)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 6l6 6-6 6" /></svg>열기
                    </button>
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
