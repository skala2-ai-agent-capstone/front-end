import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { login, isLoggedIn, authLoading, role } = useApp();
  const navigate = useNavigate();

  const [employeeNo, setEmployeeNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authLoading && isLoggedIn) {
    return <Navigate to={role === 'member' ? '/tasks' : '/review'} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!employeeNo || !password) {
      setError('사번과 비밀번호를 입력하세요');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(employeeNo, password);
      navigate('/');
    } catch (err) {
      setError(err.message || '로그인에 실패했어요');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap" id="authScreen">
      <div className="auth-split">
        <div className="auth-left">
          <div className="auth-left-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 28 }}>
              <div className="brand-mark"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-4z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" /></svg></div>
              <span style={{ fontWeight: 700, fontSize: 16 }}>세일즈 AI 코치</span>
            </div>

            <div className="auth-panel active">
              <form noValidate onSubmit={handleSubmit}>
                <div className={`field${error ? ' invalid' : ''}`}>
                  <label htmlFor="employeeNo">사번</label>
                  <input id="employeeNo" type="text" inputMode="numeric" value={employeeNo} onChange={(e) => setEmployeeNo(e.target.value)} placeholder="예: 1021" autoComplete="username" />
                </div>
                <div className={`field${error ? ' invalid' : ''}`}>
                  <label htmlFor="password">비밀번호</label>
                  <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" autoComplete="current-password" />
                  <div className={`field-error${error ? ' show' : ''}`}>{error}</div>
                </div>
                <button type="submit" className={`btn btn-primary auth-submit${loading ? ' is-loading' : ''}`} disabled={loading}>
                  {loading ? '로그인 중…' : '로그인'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-blob b1"></div>
          <div className="auth-blob b2"></div>
          <div className="auth-blob b3"></div>

          <div className="auth-right-logo">
            <div className="brand-mark"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-4z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" /></svg></div>
            <span>세일즈 AI 코치</span>
          </div>

          <div className="auth-right-body">
            <h2>영업 업무, AI와 함께<br />평가받고 성장하세요</h2>
            <p>RFP 분석부터 견적서 작성까지 — AI와 대화하며 산출물을 만들고, 자동 평가와 코칭으로 다음 업무를 더 잘 해내세요.</p>
          </div>

          <div className="auth-proof">
            <div className="stack"><span>강</span><span>권</span><span>+32</span></div>
            <div><b>34명이 함께 쓰고 있어요</b><small>영업1팀 · 삼성SDS</small></div>
          </div>
        </div>
      </div>
    </div>
  );
}
