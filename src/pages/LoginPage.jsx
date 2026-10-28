import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import logo from '../assets/aworko-logo.png';

export default function LoginPage() {
  const { isLoggedIn, authLoading, role } = useApp();
  const [tab, setTab] = useState('login');

  if (!authLoading && isLoggedIn) {
    return <Navigate to={role === 'member' ? '/tasks' : '/review'} replace />;
  }

  return (
    <div className="auth-wrap" id="authScreen">
      <div className="auth-split">
        <div className="auth-left">
          <div className="auth-left-inner">
            <div style={{ marginBottom: 28 }}>
              <img src={logo} alt="Aworko" style={{ height: 28, width: 'auto' }} />
            </div>

            <div className="auth-tabs">
              <button type="button" className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>로그인</button>
              <button type="button" className={`auth-tab${tab === 'signup' ? ' active' : ''}`} onClick={() => setTab('signup')}>회원가입</button>
            </div>

            {tab === 'login' ? <LoginPanel /> : <SignupPanel />}
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-blob b1"></div>
          <div className="auth-blob b2"></div>
          <div className="auth-blob b3"></div>

          <div className="auth-right-logo">
            <img src={logo} alt="Aworko" style={{ height: 32, width: 'auto' }} />
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

function LoginPanel() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [employeeNo, setEmployeeNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
  );
}

function SignupPanel() {
  const { signup } = useApp();
  const navigate = useNavigate();
  const [employeeNo, setEmployeeNo] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [companies, setCompanies] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/auth/companies').then(setCompanies).catch(() => setCompanies([]));
  }, []);

  const selectedCompany = companies?.find((c) => c.companyId === companyId);

  function handleCompanyChange(value) {
    setCompanyId(value);
    setTeamId('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // 팀은 필수다: 팀이 없으면 이의 제기를 검토할 팀장이 정해지지 않는다(가입은 항상 팀원)
    if (!employeeNo || !password || !name || !companyId || !teamId) {
      setError('사번·비밀번호·이름·소속 회사·팀은 필수예요');
      return;
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 해요');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signup({ employeeNo, password, name, companyId, teamId });
      navigate('/');
    } catch (err) {
      setError(err.status === 409 ? '이미 등록된 사번이에요' : (err.message || '회원가입에 실패했어요'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-panel active">
      <form noValidate onSubmit={handleSubmit}>
        <div className={`field${error ? ' invalid' : ''}`}>
          <label htmlFor="suEmployeeNo">사번</label>
          <input id="suEmployeeNo" type="text" inputMode="numeric" value={employeeNo} onChange={(e) => setEmployeeNo(e.target.value)} placeholder="예: 1031" autoComplete="username" />
        </div>
        <div className={`field${error ? ' invalid' : ''}`}>
          <label htmlFor="suPassword">비밀번호</label>
          <input id="suPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8자 이상" autoComplete="new-password" />
        </div>
        <div className="field">
          <label htmlFor="suName">이름</label>
          <input id="suName" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 홍길동" autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="suCompanyId">소속 회사</label>
          <select id="suCompanyId" value={companyId} onChange={(e) => handleCompanyChange(e.target.value)} disabled={!companies}>
            <option value="">{companies ? '회사를 선택하세요' : '불러오는 중…'}</option>
            {companies?.map((c) => <option key={c.companyId} value={c.companyId}>{c.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="suTeamId">소속 팀</label>
          <select id="suTeamId" value={teamId} onChange={(e) => setTeamId(e.target.value)} disabled={!selectedCompany?.teams.length}>
            <option value="">{selectedCompany && !selectedCompany.teams.length ? '등록된 팀이 없어요' : '팀을 선택하세요'}</option>
            {selectedCompany?.teams.map((t) => <option key={t.teamId} value={t.teamId}>{t.name}</option>)}
          </select>
          {selectedCompany && !selectedCompany.teams.length && (
            <div className="task-sub" style={{ marginTop: 6 }}>이 회사에는 아직 팀이 없어 가입할 수 없어요. 관리자에게 팀 등록을 요청하세요.</div>
          )}
          <div className={`field-error${error ? ' show' : ''}`}>{error}</div>
        </div>
        <button type="submit" className={`btn btn-primary auth-submit${loading ? ' is-loading' : ''}`} disabled={loading}>
          {loading ? '가입 중…' : '회원가입'}
        </button>
      </form>
    </div>
  );
}
