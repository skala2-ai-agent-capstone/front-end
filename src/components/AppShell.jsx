import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const navClass = ({ isActive }) => `nav-item${isActive ? ' active' : ''}`;

export default function AppShell() {
  const { role, profile, logout } = useApp();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const switchRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (switchRef.current && !switchRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell" id="appShell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-4z" stroke="white" strokeWidth="1.8" strokeLinejoin="round" /></svg>
          </div>
          <span className="brand-name">세일즈 AI 코치</span>
        </div>

        <div className={`workspace-switch${menuOpen ? ' open' : ''}`} ref={switchRef} onClick={() => setMenuOpen((v) => !v)}>
          <div className="wmark"></div>
          <div className="wtext"><b>{profile.teamName}</b><span>{profile.companyName}</span></div>
          <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M8 9l4 4 4-4M8 15l4-4 4 4" /></svg>
          <div className="workspace-menu">
            <div className="workspace-menu-item active">{profile.companyName} · {profile.teamName} (현재)</div>
            <div className="workspace-menu-item disabled">+ 다른 회사로 전환 (준비 중)</div>
          </div>
        </div>

        <div id="mainNav">
          <div className="nav-label">워크스페이스</div>
          <NavLink to="/tasks" className={navClass}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
            업무 현황
          </NavLink>
          <NavLink to="/workspace" className={navClass}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.4 8.4 0 0 1-8.8 8.4 8.6 8.6 0 0 1-3.8-.9L3 20l1.1-5.1A8.4 8.4 0 1 1 21 11.5z" /></svg>
            AI 업무 공간
          </NavLink>

          {role === 'member' && (
            <>
              <div className="nav-label">평가</div>
              <NavLink to="/report" className={navClass}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                개인 평가 리포트
              </NavLink>
            </>
          )}

          {role === 'team_lead' && (
            <>
              <div className="nav-label">평가</div>
              <NavLink to="/review" className={navClass}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v18M3 7l4-4 4 4M3 7a4 4 0 0 0 8 0M13 7l4-4 4 4M13 7a4 4 0 0 0 8 0" /></svg>
                평가 검토
              </NavLink>
              <div className="nav-label">운영</div>
              <NavLink to="/dashboard" className={navClass}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19V10M12 19V5M20 19v-7" /></svg>
                팀 대시보드
              </NavLink>
              <NavLink to="/settings" className={navClass}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82" /></svg>
                운영 설정
              </NavLink>
            </>
          )}
        </div>

        <div className="sidebar-foot">
          <div className="user-row">
            <div className="avatar">{profile.avatarInitial}</div>
            <div style={{ flex: 1, minWidth: 0 }}><b>{profile.name}</b><span>{profile.teamName} · {role === 'team_lead' ? '팀장' : '팀원'}</span></div>
            <button className="logout-btn" onClick={handleLogout} title="로그아웃">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
