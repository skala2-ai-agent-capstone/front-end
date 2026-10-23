import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { clone, nowStr } from '../utils/misc';
import {
  STEPS, STEP_MS, TYPE_LABEL,
  createInitialState,
  detectType, detectVer, planChanges, stepDetail, applyDesign,
} from '../data/settingsEngine';

const AiIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></svg>;
const DocIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>;
const ChevIcon = () => <svg className="crit-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>;

const STATUS_BADGE = { 초안: 'badge-amber', 현행: 'badge-green', 폐기: 'badge-gray' };

export default function AdminSettingsPage() {
  const { toast } = useApp();
  const stateRef = useRef(createInitialState());
  const [, bump] = useReducer((x) => x + 1, 0);
  const rerender = () => bump();
  const s = stateRef.current;

  const [tab, setTab] = useState('tab-b');
  const [docType, setDocType] = useState('auto');
  const dropInputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const [rubrics, setRubrics] = useState(null);
  const loadRubrics = useCallback(() => {
    api.get('/api/settings/rubrics').then(setRubrics).catch((err) => toast(err.message));
  }, [toast]);
  useEffect(() => { loadRubrics(); }, [loadRubrics]);
  const draftCount = rubrics ? rubrics.filter((r) => r.status === '초안').length : 0;

  // --- 문서 업로드 · 에이전트 시뮬레이션 (목업 — 백엔드에 업로드 API가 아직 없음) ---
  function runStep() {
    const job = s.job;
    rerender();
    setTimeout(() => {
      job.details[job.step] = stepDetail(s, job, job.step);
      if (job.step === 0) {
        job.doc.status = 'current';
        job.doc.indexed = nowStr();
        if (job.prev) job.prev.status = 'old';
        rerender();
      }
      if (job.step === STEPS.length - 1) {
        applyDesign(s, job);
        job.done = true;
        rerender();
        toast(`평가 기준 ${job.draftId} 초안이 저장되었습니다`);
        return;
      }
      job.step += 1;
      runStep();
    }, STEP_MS[job.step]);
  }

  function startUpload(file, isSample) {
    if (s.job && !s.job.done) { toast('진행 중인 기준 설계가 끝난 뒤 다시 올려주세요'); return; }
    const type = isSample ? 'price' : detectType(docType, file);
    const ver = detectVer(file);
    const prev = s.docs.find((d) => d.type === type && d.status === 'current');
    let id = `${{ product: 'PROD', price: 'PRICE', policy: 'POLICY' }[type]}-${ver}`;
    if (s.docs.some((d) => d.id === id)) id += `-${s.docs.length + 1}`;
    const doc = { id, file, type, ver, status: 'indexing', indexed: '—', rubric: 'none', sections: [], highlight: '', hsec: '' };
    if (isSample) {
      doc.sections = [['L1', 'P-100 스마트 문서 AI (Doc AI): 25,000원 / 사용자·월'], ['L2', 'P-200 AI 컨택센터 (Contact AI): 95,000원 / 상담석·월'],
        ['L3', 'P-300 데이터 분석 플랫폼 (Insight Hub): 3,000,000원 / 테넌트·월'], ['L4', 'S-10 전용 기술지원: 500,000원 / 월'], ['L5', 'S-20 온보딩 교육: 2,000,000원 / 회']];
      doc.hsec = 'L2';
      doc.highlight = 'P-200 Contact AI 단가 90,000 → 95,000원';
    } else if (prev) {
      doc.sections = clone(prev.sections);
      doc.hsec = prev.sections[0][0];
      doc.highlight = `${doc.hsec} 구간 내용 변경`;
    } else {
      doc.sections = [['§1', `${file.replace(/\.[^.]+$/, '')} 1절`]];
      doc.hsec = '§1';
      doc.highlight = '신규 자료';
    }
    s.docs.unshift(doc);
    s.job = { doc, prev, plan: planChanges(type, doc), step: 0, done: false, details: [] };
    rerender();
    runStep();
  }

  function handlePickFile(e) {
    const f = e.target.files[0];
    if (f) startUpload(f.name, false);
    e.target.value = '';
  }
  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) startUpload(f.name, false);
  }

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

      {tab === 'tab-b' && (
        <div className="settings-panel active">
          <div className="upload-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className={`card dropzone${dragging ? ' drag' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
                onDrop={handleDrop}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                <b>자료를 끌어다 놓으세요</b>
                <p>업로드하면 AI가 평가 기준 초안을 자동으로 갱신해요</p>
                <div className="upload-opts">
                  <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                    <option value="auto">유형 자동 판별</option>
                    <option value="product">제품 설명서</option>
                    <option value="price">가격표</option>
                    <option value="policy">내규·정책</option>
                  </select>
                  <button className="btn btn-primary btn-sm" onClick={() => dropInputRef.current.click()}>파일 선택</button>
                  <button className="btn btn-sm" disabled={!!s.job && !s.job.done} onClick={() => startUpload('2026.3_표준가격표.xlsx', true)}>샘플로 체험</button>
                  <input ref={dropInputRef} type="file" hidden accept=".pdf,.xlsx,.xls,.docx,.csv,.txt" onChange={handlePickFile} />
                </div>
              </div>

              <div className="card">
                <div className="sec-head"><h3>등록 자료</h3><span>{s.docs.length}건 · 현행 {s.docs.filter((d) => d.status === 'current').length}건</span></div>
                <table>
                  <thead><tr><th>자료</th><th>유형</th><th>버전</th><th>상태</th><th>마지막 색인</th><th>평가 기준</th></tr></thead>
                  <tbody>
                    {s.docs.map((d) => (
                      <tr key={d.id}>
                        <td><div className="task-name">{d.file}</div><div className="task-sub">{d.id}</div></td>
                        <td>{TYPE_LABEL[d.type]}</td>
                        <td className="mono">{d.ver}</td>
                        <td>
                          {d.status === 'indexing' ? <span className="badge badge-amber">색인 중</span>
                            : d.status === 'current' ? <span className="badge badge-green">현행</span>
                              : <span className="badge badge-gray">이전 버전</span>}
                        </td>
                        <td className="mono">{d.indexed}</td>
                        <td>
                          {d.rubric === 'draft'
                            ? <button className="badge badge-ai" style={{ border: 'none' }} onClick={() => setTab('tab-c')}>초안 검토 →</button>
                            : d.rubric === 'linked' ? <span className="mono">근거 연결됨</span>
                              : d.rubric === 'excluded' ? <span className="task-sub">근거 제외</span>
                                : d.status === 'indexing' ? <span className="task-sub">설계 대기</span> : <span className="task-sub">미반영</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card agent-card">
              <div className="agent-title">
                <div className="agent-icon"><AiIcon /></div><b>평가 기준 설계 에이전트</b>
                {s.job && !s.job.done && <span className="badge badge-amber" style={{ marginLeft: 'auto' }}>설계 중</span>}
                {s.job && s.job.done && <span className="badge badge-green" style={{ marginLeft: 'auto' }}>초안 저장됨</span>}
              </div>
              {s.job ? (
                <div className="agent-file"><DocIcon /><span className="name">{s.job.doc.file}</span><span className="chip chip-xs">{TYPE_LABEL[s.job.doc.type]}</span></div>
              ) : (
                <div className="agent-sub">자료 업로드 시 자동 실행돼요</div>
              )}
              <div>
                {STEPS.map(([name, desc], i) => {
                  const job = s.job;
                  const st = !job ? 'wait' : job.done || i < job.step ? 'done' : i === job.step ? 'run' : 'wait';
                  return (
                    <div className={`step ${st}`} key={name}>
                      <span className="step-ico"></span>
                      <div><b>{name}</b><small>{(job && job.details[i]) || desc}</small></div>
                    </div>
                  );
                })}
              </div>
              {s.job && s.job.done ? (
                <div className="agent-result">
                  <b>초안 저장 완료</b> · {s.job.changedCount}개 항목 수정
                  <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={() => setTab('tab-c')}>초안 검토하기 →</button>
                </div>
              ) : (
                <div className="agent-note">⚠ 이 패널은 목업이에요 — 백엔드에 자료 업로드·기준 자동 생성 API가 아직 없어서 실제로 적용되진 않아요.</div>
              )}
            </div>
          </div>
        </div>
      )}

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
