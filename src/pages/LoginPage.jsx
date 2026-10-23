import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function Field({ label, id, type = 'text', value, onChange, placeholder, autoComplete, error }) {
  return (
    <div className={`field${error ? ' invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} />
      <div className={`field-error${error ? ' show' : ''}`}>{error || ''}</div>
    </div>
  );
}

export default function LoginPage() {
  const { login, isLoggedIn, role } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [forgotNotice, setForgotNotice] = useState('');

  const [signupCompany, setSignupCompany] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupErrors, setSignupErrors] = useState({});
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  if (isLoggedIn) {
    return <Navigate to={role === 'sales' ? '/tasks' : '/review'} replace />;
  }

  function enterDemo(selectedRole) {
    login(selectedRole);
    navigate(selectedRole === 'sales' ? '/tasks' : '/review');
  }

  function handleLoginSubmit(e) {
    e.preventDefault();
    const errors = {};
    if (!loginEmail) errors.email = '이메일을 입력하세요';
    else if (!isValidEmail(loginEmail)) errors.email = '올바른 이메일 형식이 아니에요';
    if (!loginPassword) errors.password = '비밀번호를 입력하세요';
    setLoginErrors(errors);
    if (Object.keys(errors).length) return;

    setLoginLoading(true);
    setTimeout(() => {
      setLoginLoading(false);
      login('sales');
      navigate('/tasks');
    }, 600);
  }

  function handleSignupSubmit(e) {
    e.preventDefault();
    const errors = {};
    if (!signupCompany) errors.company = '회사명을 입력하세요';
    if (!signupEmail) errors.email = '관리자 이메일을 입력하세요';
    else if (!isValidEmail(signupEmail)) errors.email = '올바른 이메일 형식이 아니에요';
    if (!signupPassword) errors.password = '비밀번호를 입력하세요';
    else if (signupPassword.length < 8) errors.password = '8자 이상 입력하세요';
    setSignupErrors(errors);
    if (Object.keys(errors).length) return;

    setSignupLoading(true);
    setTimeout(() => {
      setSignupLoading(false);
      setSignupDone(true);
    }, 700);
  }

  function handleForgotPassword() {
    if (!loginEmail || !isValidEmail(loginEmail)) {
      setLoginErrors((prev) => ({ ...prev, email: '비밀번호 재설정을 위해 이메일을 먼저 입력하세요' }));
      setForgotNotice('');
      return;
    }
    setForgotNotice(`${loginEmail}로 재설정 링크를 보냈어요`);
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

            <div className="auth-tabs">
              <button type="button" className={`auth-tab${activeTab === 'login' ? ' active' : ''}`} onClick={() => setActiveTab('login')}>로그인</button>
              <button type="button" className={`auth-tab${activeTab === 'signup' ? ' active' : ''}`} onClick={() => setActiveTab('signup')}>회사 신규 가입</button>
            </div>

            <div className={`auth-panel${activeTab === 'login' ? ' active' : ''}`}>
              <form noValidate onSubmit={handleLoginSubmit}>
                <Field label="이메일" id="loginEmail" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@company.com" autoComplete="username" error={loginErrors.email} />
                <Field label="비밀번호" id="loginPassword" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="비밀번호 입력" autoComplete="current-password" error={loginErrors.password} />
                <button type="submit" className={`btn btn-primary auth-submit${loginLoading ? ' is-loading' : ''}`} disabled={loginLoading}>
                  {loginLoading ? '로그인 중…' : '로그인'}
                </button>
                <div className="auth-foot">비밀번호를 잊으셨나요? <button type="button" className="link-btn" onClick={handleForgotPassword}>재설정하기</button></div>
                <div className={`auth-notice${forgotNotice ? ' show' : ''}`}>{forgotNotice}</div>
              </form>
            </div>

            <div className={`auth-panel${activeTab === 'signup' ? ' active' : ''}`}>
              {signupDone ? (
                <div className="auth-success">
                  <b>인증 메일을 보냈어요</b>
                  <p>{signupEmail}로 전송된 링크를 눌러 회사 워크스페이스 생성을 완료하세요.</p>
                </div>
              ) : (
                <form noValidate onSubmit={handleSignupSubmit}>
                  <Field label="회사명" id="signupCompany" value={signupCompany} onChange={(e) => setSignupCompany(e.target.value)} placeholder="예: 삼성SDS" error={signupErrors.company} />
                  <Field label="관리자 이메일" id="signupEmail" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="admin@company.com" autoComplete="username" error={signupErrors.email} />
                  <Field label="비밀번호" id="signupPassword" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="8자 이상" autoComplete="new-password" error={signupErrors.password} />
                  <button type="submit" className={`btn btn-primary auth-submit${signupLoading ? ' is-loading' : ''}`} disabled={signupLoading}>
                    {signupLoading ? '생성 중…' : '회사 워크스페이스 생성'}
                  </button>
                  <div className="auth-foot">가입하면 이메일로 인증 링크가 발송됩니다</div>
                </form>
              )}
            </div>

            <div className="auth-divider">데모로 바로 둘러보기</div>
            <div className="demo-row">
              <button type="button" className="btn demo-btn" onClick={() => enterDemo('sales')}>영업 직원으로 체험</button>
              <button type="button" className="btn demo-btn" onClick={() => enterDemo('admin')}>관리자로 체험</button>
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
