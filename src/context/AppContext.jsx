import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AI_REPLIES, INITIAL_TASKS, TYPE_META } from '../data/tasks';
import { escapeHtml } from '../utils/escapeHtml';

const AppContext = createContext(null);

export const ROLE_PROFILE = {
  sales: { avatar: '강', name: '강근혜', roleLabel: '영업1팀 · 직원' },
  admin: { avatar: '권', name: '권하림', roleLabel: '영업1팀 · 관리자' },
};

export function AppProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem('role') != null);
  const [role, setRoleState] = useState(() => sessionStorage.getItem('role') || 'sales');
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [toastState, setToastState] = useState({ message: '', key: 0 });
  const aiReplyIndexRef = useRef(0);

  const toast = useCallback((message) => {
    setToastState((s) => ({ message, key: s.key + 1 }));
  }, []);

  const login = useCallback((selectedRole) => {
    sessionStorage.setItem('role', selectedRole);
    setRoleState(selectedRole);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('lastPage');
    setIsLoggedIn(false);
  }, []);

  const switchRole = useCallback((newRole) => {
    sessionStorage.setItem('role', newRole);
    setRoleState(newRole);
  }, []);

  const addUserMessage = useCallback((taskId, text) => {
    const safeText = escapeHtml(text);
    setTasks((prev) => {
      const task = prev[taskId];
      if (!task) return prev;
      return { ...prev, [taskId]: { ...task, messages: [...task.messages, { role: 'user', text: safeText }] } };
    });
  }, []);

  const addAiReply = useCallback((taskId) => {
    const reply = AI_REPLIES[aiReplyIndexRef.current % AI_REPLIES.length];
    aiReplyIndexRef.current += 1;
    setTasks((prev) => {
      const task = prev[taskId];
      if (!task) return prev;
      return {
        ...prev,
        [taskId]: { ...task, messages: [...task.messages, { role: 'ai', text: reply }], updated: '방금 전' },
      };
    });
  }, []);

  const createTask = useCallback((typeKey, title, purpose, fileNames) => {
    const id = 'custom' + Date.now();
    const meta = TYPE_META[typeKey];
    setTasks((prev) => ({
      ...prev,
      [id]: {
        title: title || meta.type, type: meta.type, typeKey, status: '작성 중', statusClass: 'badge-gray', updated: '방금 전',
        purpose: purpose ? escapeHtml(purpose).replace(/\n/g, '<br/>') : '등록된 목적·요구사항이 없습니다',
        customerRefs: fileNames,
        internalRefs: [],
        artifactTitle: meta.artifactTitle, artifactVersion: '초안 작성 전',
        artifactBody: '<p class="task-sub">AI와 대화를 시작하면 여기에 산출물이 쌓여요.</p>',
        messages: [],
      },
    }));
    return id;
  }, []);

  const value = useMemo(() => ({
    isLoggedIn, role, profile: ROLE_PROFILE[role],
    login, logout, switchRole,
    tasks, addUserMessage, addAiReply, createTask,
    toast, toastState,
  }), [isLoggedIn, role, tasks, toastState, login, logout, switchRole, addUserMessage, addAiReply, createTask, toast]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
