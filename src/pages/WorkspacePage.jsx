import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { useLiveFeedback } from '../hooks/useLiveFeedback';
import LiveFeedbackPanel from '../components/LiveFeedbackPanel';
import RetryEvaluationButton, { RETRYABLE_STATUSES } from '../components/RetryEvaluationButton';
import { stageBadgeClass } from '../utils/stage';

export default function WorkspacePage() {
  const { taskId } = useParams();
  return <WorkspaceView key={taskId} workId={taskId} />;
}

const latestAnswer = (messages) => [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? '';

// 최소한의 마크다운: **굵게**만 처리하고, 줄바꿈은 white-space: pre-wrap으로 CSS에서 살린다
function renderFormatted(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  ));
}

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

  // 사내 참고 자료: 지정·열람
  const [refCatalog, setRefCatalog] = useState(null);
  const [refPickerOpen, setRefPickerOpen] = useState(false);
  const [refPickerValue, setRefPickerValue] = useState('');
  const [refBusy, setRefBusy] = useState(false);
  const [expandedRef, setExpandedRef] = useState(null);
  const [refContent, setRefContent] = useState({});

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

  async function refreshDetail() {
    try {
      const fresh = await api.get(`/api/works/${workId}`);
      setDetail(fresh);
    } catch (err) {
      toast(err.message);
    }
  }

  function openRefPicker() {
    setRefPickerOpen(true);
    if (refCatalog === null) {
      api.get('/api/references').then(setRefCatalog).catch((err) => { toast(err.message); setRefCatalog([]); });
    }
  }

  async function handleAddReference() {
    if (!refPickerValue) return;
    const [docId, version] = refPickerValue.split('|');
    setRefBusy(true);
    try {
      await api.post(`/api/works/${workId}/references`, { docId, version });
      await refreshDetail();
      setRefPickerValue('');
      setRefPickerOpen(false);
    } catch (err) {
      toast(err.message);
    } finally {
      setRefBusy(false);
    }
  }

  async function handleRemoveReference(docId, version) {
    setRefBusy(true);
    try {
      await api.delete(`/api/works/${workId}/references/${docId}/${version}`);
      await refreshDetail();
    } catch (err) {
      toast(err.message);
    } finally {
      setRefBusy(false);
    }
  }

  function handleViewReference(docId, version) {
    const key = `${docId}-${version}`;
    if (expandedRef === key) { setExpandedRef(null); return; }
    setExpandedRef(key);
    if (refContent[key] === undefined) {
      api.get(`/api/works/${workId}/references/${docId}/${version}`)
        .then((d) => setRefContent((prev) => ({ ...prev, [key]: d.content })))
        .catch((err) => setRefContent((prev) => ({ ...prev, [key]: `(불러오기 실패: ${err.message})` })));
    }
  }

  if (loadError) {
    return (
      <section className="page active">
        <div className="topheader">
          <button className="btn-back" onClick={() => navigate(-1)} title="뒤로 가기">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        </div>
        <p className="task-sub" style={{ color: 'var(--red)' }}>{loadError}</p>
      </section>
    );
  }
  if (!detail) {
    return (
      <section className="page active">
        <div className="topheader">
          <button className="btn-back" onClick={() => navigate(-1)} title="뒤로 가기">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        </div>
        <p className="task-sub">불러오는 중…</p>
      </section>
    );
  }

  const { summary, editable } = detail;
  const isCompleted = summary.status === 'completed';
  // 이미 완료 접수된 업무는 본인이어도 다시 대화·제출할 수 없다 — 재제출할 때마다 평가가 중복 생성되는 걸 막기 위함
  const canEdit = editable && !isCompleted;

  return (
    <section className="page active ws-page">
      <div className="topheader">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button className="btn-back" onClick={() => navigate(-1)} title="뒤로 가기">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <h1 style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary.title}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
          {/* 팀장 조회: 처리 실패·자료 보류 평가를 AI가 다시 평가하게 한다 */}
          {!editable && summary.evaluationId && RETRYABLE_STATUSES.includes(summary.evaluationStatus) && (
            <RetryEvaluationButton evaluationId={summary.evaluationId} onDone={refreshDetail} />
          )}
          <span className={`badge ${stageBadgeClass(summary.stage)}`}>{summary.stage}</span>
        </div>
      </div>
      <div className="page-sub" style={{ marginBottom: 16 }}>
        <p>
          업무 유형: {summary.workTypeLabel || '미정'}
          {!editable && ' · 읽기 전용(팀장 조회)'}
          {editable && isCompleted && ' · 읽기 전용(완료 접수된 업무)'}
        </p>
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
                      {renderFormatted(m.content)}
                      {canEdit && (
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
            {canEdit && (
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
                placeholder={canEdit ? 'AI에게 메시지 보내기…' : isCompleted ? '완료 접수된 업무입니다' : '읽기 전용 업무입니다'} disabled={!canEdit || sending} />
              <button className="send-btn" onClick={handleSend} disabled={!canEdit || sending}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="ws-sidebar">
          {canEdit && (
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
              {detail.registrationItems && detail.registrationItems.length > 0 ? (
                detail.registrationItems.map((item) => <div key={item.key}>{item.label}: {item.value}</div>)
              ) : detail.registration && Object.keys(detail.registration).length > 0 ? (
                Object.entries(detail.registration).map(([k, v]) => <div key={k}>{k}: {String(v)}</div>)
              ) : (
                <span className="task-sub">등록된 목적·요구사항이 없어요.</span>
              )}
            </div>
          </div>
          <div className="card ws-panel">
            <h3>고객 자료</h3>
            <div>
              {detail.sourceDocuments.map((d) => (
                <div className="ref-item" key={d.attachmentId}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                  <span style={{ flex: 1 }}>{d.fileName || d.docId}{!d.textExtracted && <span className="task-sub"> (텍스트 추출 안 됨)</span>}</span>
                  {editable && (
                    <button className="btn-link" type="button" title="원본 다운로드"
                      onClick={() => api.downloadFile(`/api/works/${workId}/source-documents/${d.attachmentId}/file`, d.fileName || d.docId).catch((err) => toast(err.message))}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, flex: 'none' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 15, height: 15 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                    </button>
                  )}
                </div>
              ))}
              {detail.sourceDocuments.length === 0 && <p className="task-sub">등록된 고객 자료가 없어요.</p>}
            </div>
          </div>
          <div className="card ws-panel">
            <h3>사내 참고 자료</h3>
            <p className="task-sub" style={{ marginBottom: 8 }}>지정한 자료는 AI 대화에 함께 전달돼요.</p>
            <div>
              {detail.internalReferences.map((r) => {
                const key = `${r.docId}-${r.version}`;
                const isOpen = expandedRef === key;
                return (
                  <div key={key}>
                    <div className="ref-item" style={{ cursor: 'pointer' }} onClick={() => handleViewReference(r.docId, r.version)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                      <span style={{ flex: 1 }}>{r.title}{r.source === 'accessed' && <span className="task-sub"> (열람함)</span>}</span>
                      {canEdit && (
                        <button type="button" title="지정 해제" disabled={refBusy}
                          onClick={(e) => { e.stopPropagation(); handleRemoveReference(r.docId, r.version); }}
                          style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 0, flex: 'none', fontSize: 15 }}>×</button>
                      )}
                    </div>
                    {isOpen && (
                      <div className="task-sub" style={{ padding: '6px 8px 10px 30px', whiteSpace: 'pre-wrap' }}>
                        {refContent[key] === undefined ? '불러오는 중…' : refContent[key]}
                      </div>
                    )}
                  </div>
                );
              })}
              {detail.internalReferences.length === 0 && <p className="task-sub">아직 지정한 사내 자료가 없어요.</p>}
            </div>
            {canEdit && (
              refPickerOpen ? (
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <select value={refPickerValue} onChange={(e) => setRefPickerValue(e.target.value)} style={{ flex: 1, minWidth: 0 }} disabled={refBusy}>
                    <option value="">{refCatalog === null ? '불러오는 중…' : '자료 선택'}</option>
                    {refCatalog?.filter((c) => !detail.internalReferences.some((r) => r.docId === c.docId && r.version === c.version))
                      .map((c) => <option key={`${c.docId}|${c.version}`} value={`${c.docId}|${c.version}`}>{c.title} · {c.version} ({c.status})</option>)}
                  </select>
                  <button className="btn btn-sm btn-primary" onClick={handleAddReference} disabled={refBusy || !refPickerValue}>추가</button>
                  <button className="btn btn-sm" onClick={() => setRefPickerOpen(false)} disabled={refBusy}>취소</button>
                </div>
              ) : (
                <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={openRefPicker}>+ 자료 추가</button>
              )
            )}
          </div>
          <div className="card ws-panel">
            <div className="doc-toolbar">
              <h3 style={{ margin: 0 }}>{detail.artifactTitle}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {canEdit && unsavedDraft && <span className="task-sub" style={{ fontSize: 11 }}>저장 안 됨</span>}
                {detail.artifact && <span className="chip on" style={{ fontSize: 11, padding: '3px 9px' }}>{detail.artifact.version}</span>}
              </div>
            </div>
            {canEdit ? (
              <textarea className="doc-body" aria-label="산출물 본문" value={draft} disabled={savingDraft}
                onChange={(e) => setEditedDraft(e.target.value)}
                placeholder="AI와 대화를 시작하면 최근 답변이 여기에 들어와요. 직접 고쳐서 저장할 수 있어요."
                rows={9} style={{ width: '100%', maxHeight: 360, border: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, display: 'block' }} />
            ) : (
              <div className="doc-body">
                {detail.artifact ? detail.artifact.content : <p className="task-sub">AI와 대화를 시작하면 여기에 산출물이 쌓여요.</p>}
              </div>
            )}
            {canEdit && (
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
