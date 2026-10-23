import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useLiveFeedback } from '../hooks/useLiveFeedback';
import LiveFeedbackPanel from '../components/LiveFeedbackPanel';

export default function WorkspacePage() {
  const { taskId } = useParams();
  const { tasks } = useApp();
  const task = tasks[taskId];

  if (!task) return <Navigate to="/workspace" replace />;

  return <WorkspaceView key={taskId} taskId={taskId} task={task} />;
}

function WorkspaceView({ taskId, task }) {
  const { addUserMessage, addAiReply } = useApp();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const threadRef = useRef(null);

  const hasUserMessages = task.messages.some((m) => m.role === 'user');
  const liveFeedback = useLiveFeedback(hasUserMessages);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [task.messages.length, isTyping]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    addUserMessage(taskId, text);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      addAiReply(taskId);
      setIsTyping(false);
    }, 700);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <section className="page active">
      <div className="topheader">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button className="btn-back" onClick={() => navigate('/workspace')} title="업무 목록으로">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <h1 style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</h1>
        </div>
        <span className={`badge ${task.statusClass}`}>{task.status}</span>
      </div>
      <div className="page-sub" style={{ marginBottom: 16 }}><p>업무 유형: {task.type}</p></div>

      <div className="ws-grid">
        <div className="chat-main">
          <div className="chat-thread" ref={threadRef}>
            {task.messages.map((m, i) => (
              m.role === 'user'
                ? <div className="turn user" key={i}><div className="user-bubble" dangerouslySetInnerHTML={{ __html: m.text }} /></div>
                : <div className="turn assistant" key={i}><div className="assistant-avatar">✦</div><div className="assistant-body" dangerouslySetInnerHTML={{ __html: m.text }} /></div>
            ))}
            {isTyping && (
              <div className="turn assistant"><div className="assistant-avatar">✦</div><div className="assistant-body">···</div></div>
            )}
          </div>
          <div className="chat-fixed-input">
            <button
              className="btn btn-ghost btn-sm lf-trigger"
              type="button"
              onClick={liveFeedback.requestFeedback}
              disabled={liveFeedback.disabled}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 2L4 14h6l-1 8 9-12h-6z" /></svg>
              실시간 피드백
            </button>
            <div className="chat-input-pill">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="AI에게 메시지 보내기…" />
              <button className="send-btn" onClick={handleSend}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
              </button>
            </div>
            <div className="chat-hint">Enter로 전송 · Shift+Enter로 줄바꿈</div>
          </div>
        </div>

        <div className="ws-sidebar">
          <LiveFeedbackPanel
            phase={liveFeedback.phase}
            result={liveFeedback.result}
            cooldownRemainingSec={liveFeedback.cooldownRemainingSec}
            hasUserMessages={hasUserMessages}
          />
          <div className="card ws-panel">
            <h3>업무 정보</h3>
            <div className="ws-readonly" dangerouslySetInnerHTML={{ __html: task.purpose }} />
          </div>
          <div className="card ws-panel">
            <h3>고객 자료</h3>
            <div>
              {task.customerRefs.map((r, i) => (
                <div className="ref-item" key={i}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                  {r}
                </div>
              ))}
              {task.customerRefs.length === 0 && <p className="task-sub">등록된 고객 자료가 없어요.</p>}
            </div>
          </div>
          <div className="card ws-panel">
            <h3>사내 참고 자료</h3>
            <p className="task-sub" style={{ marginBottom: 8 }}>AI가 답변을 만들 때 자동으로 참고하는 자료예요.</p>
            <div>
              {task.internalRefs.map((r, i) => (
                <div className="ref-item" key={i}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                  {r}
                </div>
              ))}
              {task.internalRefs.length === 0 && <p className="task-sub">아직 참고한 사내 자료가 없어요.</p>}
            </div>
          </div>
          <div className="card ws-panel">
            <div className="doc-toolbar"><h3 style={{ margin: 0 }}>{task.artifactTitle}</h3><span className="chip on" style={{ fontSize: 11, padding: '3px 9px' }}>{task.artifactVersion}</span></div>
            <div className="doc-body" dangerouslySetInnerHTML={{ __html: task.artifactBody }} />
            <div className="doc-foot">
              <button className="btn btn-ghost" style={{ flex: 1 }}>초안 저장</button>
              <button className="btn btn-primary" style={{ flex: 1 }}>최종 완료</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
