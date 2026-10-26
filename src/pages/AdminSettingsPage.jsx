import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import PolicyUploadPanel from '../components/PolicyUploadPanel';

const ChevIcon = () => <svg className="crit-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>;

const STATUS_BADGE = { 초안: 'badge-amber', 현행: 'badge-green', 폐기: 'badge-gray' };

export default function AdminSettingsPage() {
  const { toast } = useApp();
  const [tab, setTab] = useState('tab-b');
  const showRubrics = useCallback(() => setTab('tab-c'), []);

  const [rubrics, setRubrics] = useState(null);
  const loadRubrics = useCallback(() => {
    api.get('/api/settings/rubrics').then(setRubrics).catch((err) => toast(err.message));
  }, [toast]);
  useEffect(() => { loadRubrics(); }, [loadRubrics]);
  const draftCount = rubrics ? rubrics.filter((r) => r.status === '초안').length : 0;

  return (
    <section className="page active">
      <div className="topheader"><h1>운영 설정</h1></div>
      <div className="page-sub"><p>제품·가격·정책 자료, 평가 기준을 관리합니다.</p></div>

      <div className="utabs">
        <button className={`utab${tab === 'tab-b' ? ' active' : ''}`} onClick={() => setTab('tab-b')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
          제품·가격·정책 자료
        </button>
        <button className={`utab${tab === 'tab-c' ? ' active' : ''}`} onClick={() => setTab('tab-c')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
          평가 기준 관리
          {draftCount > 0 && <span className="tab-count">초안 {draftCount}건</span>}
        </button>
      </div>

      {/* 업로드 탭은 늘 띄워 두고 숨긴다. 평가 기준 탭에 가 있는 동안에도 생성 상태를 폴링해 완료 시 기준 목록을 다시 읽는다 */}
      <div className={`settings-panel${tab === 'tab-b' ? ' active' : ''}`}>
        <PolicyUploadPanel draftCount={draftCount} onGenerated={loadRubrics} onReview={showRubrics} />
      </div>

      {tab === 'tab-c' && <RubricsTab rubrics={rubrics} reload={loadRubrics} />}
    </section>
  );
}

function RubricsTab({ rubrics, reload }) {
  const { toast } = useApp();
  const [wt, setWt] = useState(null);
  const [viewKey, setViewKey] = useState(null); // { docId, version }
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState('');
  const [openItemId, setOpenItemId] = useState(null);
  const [edit, setEdit] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [clauses, setClauses] = useState(null);
  const [busy, setBusy] = useState(false);
  const [clauseInput, setClauseInput] = useState('');
  const [sourceInput, setSourceInput] = useState('');

  const workTypes = useMemo(() => {
    if (!rubrics) return [];
    const seen = new Map();
    rubrics.forEach((r) => { if (!seen.has(r.workType)) seen.set(r.workType, r.workTypeLabel); });
    return [...seen.entries()].map(([key, label]) => ({ key, label }));
  }, [rubrics]);

  useEffect(() => {
    if (!wt && workTypes.length) setWt(workTypes[0].key);
  }, [wt, workTypes]);

  const entries = useMemo(() => (rubrics || []).filter((r) => r.workType === wt), [rubrics, wt]);
  const draftEntry = entries.find((r) => r.status === '초안');
  const currentEntry = entries.find((r) => r.status === '현행');
  const archivedEntries = entries.filter((r) => r.status === '폐기');

  useEffect(() => {
    if (!wt) return;
    const target = draftEntry || currentEntry || entries[0];
    setViewKey(target ? { docId: target.docId, version: target.version } : null);
    setOpenItemId(null); setEdit(null); setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wt, rubrics]);

  useEffect(() => {
    if (!viewKey) { setDetail(null); return; }
    setDetailError('');
    api.get(`/api/settings/rubrics/${viewKey.docId}/${viewKey.version}`)
      .then(setDetail)
      .catch((err) => setDetailError(err.message));
  }, [viewKey]);

  function loadClauses() {
    if (clauses) return;
    api.get('/api/settings/policy-clauses').then(setClauses).catch(() => setClauses([]));
  }

  const isDraftView = detail?.rubric?.status === '초안';

  function openItem(item) {
    if (openItemId === item.itemId) { setOpenItemId(null); setEdit(null); setDirty(false); return; }
    setOpenItemId(item.itemId);
    setEdit({ ...item });
    setDirty(false);
    setClauseInput(''); setSourceInput('');
    if (isDraftView) loadClauses();
  }

  function updateField(field, value) {
    setEdit((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  function addSource() {
    const v = sourceInput.trim();
    if (!v || edit.evidenceSources.includes(v)) return;
    updateField('evidenceSources', [...edit.evidenceSources, v]);
    setSourceInput('');
  }
  function removeSource(v) {
    updateField('evidenceSources', edit.evidenceSources.filter((x) => x !== v));
  }
  function addClause(clauseId) {
    if (!clauseId || edit.relatedClauses.includes(clauseId)) return;
    updateField('relatedClauses', [...edit.relatedClauses, clauseId]);
  }
  function removeClause(clauseId) {
    updateField('relatedClauses', edit.relatedClauses.filter((x) => x !== clauseId));
  }

  function resetToCurrent() {
    if (!currentEntry) return;
    api.get(`/api/settings/rubrics/${currentEntry.docId}/${currentEntry.version}`)
      .then((d) => {
        const cur = d.items.find((it) => it.itemId === openItemId);
        if (cur) { setEdit({ ...cur }); setDirty(true); toast('현재 적용 중인 기준 값을 불러왔어요 — 저장을 눌러야 반영돼요'); }
      })
      .catch((err) => toast(err.message));
  }

  async function saveItem() {
    const original = detail.items.find((it) => it.itemId === openItemId);
    const fields = ['criterion', 'score2', 'score1', 'score0', 'unobserved', 'needsReview', 'evidenceSources', 'relatedClauses'];
    const payload = {};
    fields.forEach((f) => {
      const a = edit[f], b = original[f];
      const changed = Array.isArray(a) ? JSON.stringify(a) !== JSON.stringify(b) : a !== b;
      if (changed) payload[f] = a;
    });
    if (!Object.keys(payload).length) { toast('변경된 내용이 없어요'); return; }
    setBusy(true);
    try {
      await api.patch(`/api/settings/rubrics/${viewKey.docId}/${viewKey.version}/items/${openItemId}`, payload);
      const fresh = await api.get(`/api/settings/rubrics/${viewKey.docId}/${viewKey.version}`);
      setDetail(fresh);
      setEdit(fresh.items.find((it) => it.itemId === openItemId));
      setDirty(false);
      toast('항목을 저장했어요');
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  function cancelEdit() {
    const original = detail.items.find((it) => it.itemId === openItemId);
    setEdit({ ...original });
    setDirty(false);
  }

  async function createDraft() {
    setBusy(true);
    try {
      await api.post('/api/settings/rubrics/drafts', { workTypes: [wt] });
      toast('수정 초안을 만들었어요');
      reload();
    } catch (err) {
      toast(err.status === 503 ? '평가 기준 서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.' : err.message);
    } finally {
      setBusy(false);
    }
  }
  async function discardDraft() {
    setBusy(true);
    try {
      await api.post('/api/settings/rubrics/discard', { workTypes: [wt] });
      toast('초안을 폐기했어요');
      reload();
    } catch (err) {
      toast(err.status === 503 ? '평가 기준 서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.' : err.message);
    } finally {
      setBusy(false);
    }
  }
  async function approveDraft() {
    if (dirty) { toast('저장하지 않은 수정이 있어요. 항목을 먼저 저장하거나 취소하세요'); return; }
    setBusy(true);
    try {
      await api.post('/api/settings/rubrics/approve', { workTypes: [wt] });
      toast('승인해서 적용했어요');
      reload();
    } catch (err) {
      toast(err.status === 503 ? '평가 기준 서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.' : err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!rubrics) return <div className="settings-panel active"><p className="task-sub">불러오는 중…</p></div>;

  return (
    <div className="settings-panel active">
      <div className="card rb-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select value={viewKey ? `${viewKey.docId}|${viewKey.version}` : ''} onChange={(e) => {
            const [docId, version] = e.target.value.split('|');
            setViewKey({ docId, version });
          }}>
            {draftEntry && <option value={`${draftEntry.docId}|${draftEntry.version}`}>{draftEntry.version} 초안 · 승인 대기</option>}
            {currentEntry && <option value={`${currentEntry.docId}|${currentEntry.version}`}>{currentEntry.version} · 현재 적용</option>}
            {[...archivedEntries].reverse().map((v) => (
              <option key={v.version} value={`${v.docId}|${v.version}`}>{v.version} · 이전 버전</option>
            ))}
          </select>
          {detail && <span><span className={`badge ${STATUS_BADGE[detail.rubric.status] || 'badge-gray'}`}>{detail.rubric.status === '초안' ? '승인 대기' : detail.rubric.status === '현행' ? '적용 중' : '읽기 전용'}</span></span>}
          {detail && <span className="rb-meta">{detail.rubric.note || `적용일 ${detail.rubric.effectiveFrom || '—'}`}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isDraftView ? (
            <>
              <button className="btn" disabled={busy} onClick={discardDraft}>초안 폐기</button>
              <button className="btn btn-primary" disabled={busy} onClick={approveDraft}>승인 후 적용</button>
            </>
          ) : draftEntry ? (
            <button className="btn" onClick={() => setViewKey({ docId: draftEntry.docId, version: draftEntry.version })}>{draftEntry.version} 초안 보기</button>
          ) : (
            <button className="btn" disabled={busy} onClick={createDraft}>수정 초안 만들기</button>
          )}
        </div>
      </div>

      <div className="rb-grid">
        <div className="card wt-list">
          <div className="field-label" style={{ padding: '6px 10px 2px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.03em', color: 'var(--text-faint)' }}>업무 유형</div>
          {workTypes.map((w) => {
            const hasDraft = rubrics.some((r) => r.workType === w.key && r.status === '초안');
            return (
              <button key={w.key} className={`wt-item${w.key === wt ? ' on' : ''}`} onClick={() => setWt(w.key)}>
                <span>{w.label}</span>{hasDraft && <span className="wt-count">초안</span>}
              </button>
            );
          })}
        </div>

        <div>
          {detailError && <p className="task-sub" style={{ color: 'var(--red)' }}>{detailError}</p>}
          {!detailError && !detail && <p className="task-sub">불러오는 중…</p>}
          {detail && (
            <>
              <div className="crit-list-head">
                <div><b>{detail.rubric.workTypeLabel}</b><span> · {detail.rubric.itemCount}개 항목</span></div>
                <span className="task-sub">{isDraftView ? '항목을 눌러 검토·수정' : '읽기 전용'}</span>
              </div>
              {detail.items.map((item) => (
                <RubricItemCard
                  key={item.itemId}
                  item={item}
                  open={openItemId === item.itemId}
                  edit={openItemId === item.itemId ? edit : null}
                  isDraftView={isDraftView}
                  dirty={dirty}
                  busy={busy}
                  clauses={clauses}
                  clauseInput={clauseInput}
                  setClauseInput={setClauseInput}
                  sourceInput={sourceInput}
                  setSourceInput={setSourceInput}
                  onToggle={() => openItem(item)}
                  onField={updateField}
                  onAddSource={addSource}
                  onRemoveSource={removeSource}
                  onAddClause={addClause}
                  onRemoveClause={removeClause}
                  onSave={saveItem}
                  onCancel={cancelEdit}
                  onResetToCurrent={currentEntry && currentEntry.version !== viewKey?.version ? resetToCurrent : null}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RubricItemCard({
  item, open, edit, isDraftView, dirty, busy, clauses, clauseInput, setClauseInput, sourceInput, setSourceInput,
  onToggle, onField, onAddSource, onRemoveSource, onAddClause, onRemoveClause, onSave, onCancel, onResetToCurrent,
}) {
  const c = open && edit ? edit : item;
  return (
    <div className={`card crit${open ? ' open' : ''}`}>
      <div className="crit-head" onClick={onToggle}>
        <span className="mono" style={{ flex: 'none', width: 112, fontSize: 12 }}>{item.itemId}</span>
        <div style={{ minWidth: 0 }}><div className="crit-title">{item.item}</div><div className="crit-focus">{item.criterion}</div></div>
        <ChevIcon />
      </div>

      {open && (
        <div className="crit-body-wrap">
          <div className="crit-body">
            <div className="ed-row"><label>평가 질문</label>
              <textarea disabled={!isDraftView} rows={Math.max(2, Math.ceil((c.criterion || '').length / 62))} value={c.criterion} onChange={(e) => onField('criterion', e.target.value)} />
            </div>
            <div className="ed-row"><label>점수 조건</label>
              <div>
                {['2', '1', '0'].map((sc) => (
                  <div className="lvl" key={sc}>
                    <span className={`lvl-score s${sc}`}>{sc}점</span>
                    <textarea disabled={!isDraftView} rows={Math.max(2, Math.ceil((c[`score${sc}`] || '').length / 62))} value={c[`score${sc}`]} onChange={(e) => onField(`score${sc}`, e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
            <details className="ed-more">
              <summary>미관측·검토 조건</summary>
              <div className="ed-row"><label>미관측 조건</label><textarea disabled={!isDraftView} rows={Math.max(2, Math.ceil((c.unobserved || '').length / 62))} value={c.unobserved} onChange={(e) => onField('unobserved', e.target.value)} /></div>
              <div className="ed-row"><label>검토 필요 조건</label><textarea disabled={!isDraftView} rows={Math.max(2, Math.ceil((c.needsReview || '').length / 62))} value={c.needsReview} onChange={(e) => onField('needsReview', e.target.value)} /></div>
            </details>
            <div className="ed-row"><label>근거 자료</label>
              <div className="ev-list">
                {c.evidenceSources.map((src) => (
                  <div className="ev" key={src}>
                    <span>{src}</span>
                    {isDraftView && <button onClick={() => onRemoveSource(src)} title="제거">×</button>}
                  </div>
                ))}
                {isDraftView && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="text" value={sourceInput} onChange={(e) => setSourceInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddSource(); } }}
                      placeholder="예: AI 대화 — Enter로 추가" style={{ flex: 1, padding: '7px 10px', border: '1px solid var(--border-strong)', borderRadius: 8, fontSize: 13 }} />
                    <button className="btn btn-sm" type="button" onClick={onAddSource}>추가</button>
                  </div>
                )}
              </div>
            </div>
            <div className="ed-row"><label>관련 내규 조항</label>
              <div className="ev-list">
                {c.relatedClauses.length ? c.relatedClauses.map((cid) => {
                  const found = clauses?.find((cl) => cl.clauseId === cid);
                  return (
                    <div className="ev" key={cid}>
                      <span className="mono">{cid}</span><span>{found ? found.label : ''}</span>
                      {isDraftView && <button onClick={() => onRemoveClause(cid)} title="제거">×</button>}
                    </div>
                  );
                }) : <div className="task-sub" style={{ color: 'var(--red)' }}>연결된 조항 없음 — 1건 이상 필요</div>}
                {isDraftView && (
                  <select className="ev-add" value={clauseInput} onChange={(e) => { onAddClause(e.target.value); setClauseInput(''); }}>
                    <option value="">+ 내규 조항 연결…</option>
                    {(clauses || []).filter((cl) => !c.relatedClauses.includes(cl.clauseId)).map((cl) => (
                      <option key={cl.clauseId} value={cl.clauseId}>{cl.clauseId} — {cl.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {isDraftView && (
            <div className="crit-foot">
              <button className="btn btn-ghost btn-sm" disabled={!onResetToCurrent} onClick={onResetToCurrent || undefined}>현재 적용 기준으로 되돌리기</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm" disabled={!dirty || busy} onClick={onCancel}>취소</button>
                <button className="btn btn-primary btn-sm" disabled={!dirty || busy} onClick={onSave}>항목 저장</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
