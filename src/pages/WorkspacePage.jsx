import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { useLiveFeedback } from '../hooks/useLiveFeedback';
import LiveFeedbackPanel from '../components/LiveFeedbackPanel';
import { stageBadgeClass } from '../utils/stage';

export default function WorkspacePage() {
  const { taskId } = useParams();
  return <WorkspaceView key={taskId} workId={taskId} />;
}

const latestAnswer = (messages) => [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? '';

function WorkspaceView({ workId }) {
  const { toast } = useApp();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [completing, setCompleting] = useState(false);
  // 산출물 편집본. null이면 손대지 않은 상태라 저장본(없으면 최근 AI 답변)을 그대로 보여 준다
  const [editedDraft, setEditedDraft] = useState(null);
  const threadRef = useRef(null);

  const hasUserMessages = messages.some((m) => m.role === 'user');
  const answeredTurns = messages.filter((m) => m.role === 'assistant').length;
  const liveFeedback = useLiveFeedback(workId, answeredTurns);

  const savedContent = detail?.artifact?.content ?? null;
  const draft = editedDraft ?? savedContent ?? latestAnswer(messages);
  const unsavedDraft = draft !== (savedContent ?? '');

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get(`/api/works/${workId}`), api.get(`/api/works/${workId}/messages`)])
      .then(([d, m]) => { if (!cancelled) { setDetail(d); setMessages(m); } })
      .catch((err) => { if (!cancelled) setLoadError(err.message); });
    return () => { cancelled = true; };
  }, [workId]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages.length, sending]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    setMessages((prev) => [...prev, { messageId: 'tmp-u', role: 'user', content: text, createdAt: new Date().toISOString() }]);
    try {
      await api.post(`/api/works/${workId}/messages`, { content: text });
      const fresh = await api.get(`/api/works/${workId}/messages`);
      setMessages(fresh);
    } catch (err) {
      toast(err.message);
      const fresh = await api.get(`/api/works/${workId}/messages`).catch(() => null);
      if (fresh) setMessages(fresh);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function putAnswerInDraft(content) {
    if (editedDraft !== null && unsavedDraft && !window.confirm('저장하지 않은 수정이 있어요. 이 답변으로 바꿀까요?')) return;
    setEditedDraft(content);
  }

  async function handleSaveDraft() {
    if (!draft.trim()) { toast('저장할 내용이 없어요. AI 답변을 산출물에 넣거나 직접 작성하세요.'); return; }
    setSavingDraft(true);
    try {
      const artifact = await api.post(`/api/works/${workId}/artifacts`, { content: draft });
      setDetail((prev) => ({ ...prev, artifact }));
      setEditedDraft(null);
      toast(`${artifact.version} 초안을 저장했어요.`);
    } catch (err) {
      toast(err.message);
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleComplete() {
    if (!detail.artifact) { toast('먼저 산출물을 저장하세요.'); return; }
    if (unsavedDraft) { toast('저장하지 않은 수정이 있어요. 초안을 먼저 저장하세요.'); return; }
    setCompleting(true);
    try {
      await api.post('/api/work-events', { taskId: workId, deliverableVersion: detail.artifact.version });
      toast('업무 완료를 접수했어요. 평가가 곧 시작돼요.');
      const fresh = await api.get(`/api/works/${workId}`);
      setDetail(fresh);
    } catch (err) {
      toast(err.message);
    } finally {
      setCompleting(false);
    }
  }

  if (loadError) {
    return <section className="page active"><div className="topheader"><h1>AI 업무 공간</h1></div><p className="task-sub" style={{ color: 'var(--red)' }}>{loadError}</p></section>;
  }
  if (!detail) {
    return <section className="page active"><div className="topheader"><h1>AI 업무 공간</h1></div><p className="task-sub">불러오는 중…</p></section>;
  }

  const { summary, editable } = detail;

  return (
    <section className="page active">
      <div className="topheader">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button className="btn-back" onClick={() => navigate('/workspace')} title="업무 목록으로">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <h1 style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary.title}</h1>
        </div>
        <span className={`badge ${stageBadgeClass(summary.stage)}`}>{summary.stage}</span>
      </div>
      <div className="page-sub" style={{ marginBottom: 16 }}>
        <p>업무 유형: {summary.workTypeLabel || '미정'}{!editable && ' · 읽기 전용(팀장 조회)'}</p>
      </div>

      <div className="ws-grid">
        <div className="chat-main">
          <div className="chat-thread" ref={threadRef}>
            {messages.map((m) => (
              m.role === 'user'
                ? <div className="turn user" key={m.messageId}><div className="user-bubble">{m.content}</div></div>
                : (
                  <div className="turn assistant" key={m.messageId}>
                    <div className="assistant-avatar">✦</div>
                    <div className="assistant-body">
                      {m.content}
                      {editable && (
                        <div><button className="btn btn-ghost btn-sm" type="button" style={{ marginTop: 6 }} onClick={() => putAnswerInDraft(m.content)}>산출물에 넣기</button></div>
                      )}
                    </div>
                  </div>
                )
            ))}
            {sending && (
              <div className="turn assistant"><div className="assistant-avatar">✦</div><div className="assistant-body">···</div></div>
            )}
          </div>
          <div className="chat-fixed-input">
            {editable && (
              <button
                className="btn btn-ghost btn-sm lf-trigger"
                type="button"
                onClick={liveFeedback.requestFeedback}
                disabled={liveFeedback.disabled}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 2L4 14h6l-1 8 9-12h-6z" /></svg>
                실시간 피드백
              </button>
            )}
            <div className="chat-input-pill">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={editable ? 'AI에게 메시지 보내기…' : '읽기 전용 업무입니다'} disabled={!editable || sending} />
              <button className="send-btn" onClick={handleSend} disabled={!editable || sending}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
              </button>
            </div>
            <div className="chat-hint">Enter로 전송 · Shift+Enter로 줄바꿈</div>
          </div>
        </div>

        <div className="ws-sidebar">
          {editable && (
            <LiveFeedbackPanel
              phase={liveFeedback.phase}
              display={liveFeedback.display}
              cooldownMessage={liveFeedback.cooldownMessage}
              needsNewTurns={liveFeedback.needsNewTurns}
              hasUserMessages={hasUserMessages}
            />
          )}
          <div className="card ws-panel">
            <h3>업무 정보</h3>
            <div className="ws-readonly">
              {detail.registration && Object.keys(detail.registration).length > 0
                ? Object.entries(detail.registration).map(([k, v]) => <div key={k}>{k}: {String(v)}</div>)
                : <span className="task-sub">등록된 목적·요구사항이 없어요.</span>}
            </div>
          </div>
          <div className="card ws-panel">
            <h3>고객 자료</h3>
            <div>
              {detail.sourceDocuments.map((d) => (
                <div className="ref-item" key={d.attachmentId}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                  {d.fileName || d.docId}{!d.textExtracted && <span className="task-sub"> (텍스트 추출 안 됨)</span>}
                </div>
              ))}
              {detail.sourceDocuments.length === 0 && <p className="task-sub">등록된 고객 자료가 없어요.</p>}
            </div>
          </div>
          <div className="card ws-panel">
            <h3>사내 참고 자료</h3>
            <p className="task-sub" style={{ marginBottom: 8 }}>AI가 답변을 만들 때 자동으로 참고하는 자료예요.</p>
            <div>
              {detail.internalReferences.map((r) => (
                <div className="ref-item" key={`${r.docId}-${r.version}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                  {r.title}
                </div>
              ))}
              {detail.internalReferences.length === 0 && <p className="task-sub">아직 참고한 사내 자료가 없어요.</p>}
            </div>
          </div>
          <div className="card ws-panel">
            <div className="doc-toolbar">
              <h3 style={{ margin: 0 }}>{detail.artifactTitle}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {editable && unsavedDraft && <span className="task-sub" style={{ fontSize: 11 }}>저장 안 됨</span>}
                {detail.artifact && <span className="chip on" style={{ fontSize: 11, padding: '3px 9px' }}>{detail.artifact.version}</span>}
              </div>
            </div>
            {editable ? (
              <textarea className="doc-body" aria-label="산출물 본문" value={draft} disabled={savingDraft}
                onChange={(e) => setEditedDraft(e.target.value)}
                placeholder="AI와 대화를 시작하면 최근 답변이 여기에 들어와요. 직접 고쳐서 저장할 수 있어요."
                rows={9} style={{ width: '100%', maxHeight: 360, border: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, display: 'block' }} />
            ) : (
              <div className="doc-body">
                {detail.artifact ? detail.artifact.content : <p className="task-sub">AI와 대화를 시작하면 여기에 산출물이 쌓여요.</p>}
              </div>
            )}
            {editable && (
              <div className="doc-foot">
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={handleSaveDraft} disabled={savingDraft}>{savingDraft ? '저장 중…' : '초안 저장'}</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleComplete} disabled={completing}>{completing ? '접수 중…' : '최종 완료'}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
