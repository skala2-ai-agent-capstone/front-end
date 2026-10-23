import { useReducer, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { clone, nowStr } from '../utils/misc';
import {
  ME, STEPS, STEP_MS, TYPE_LABEL, WORK_TYPES, ITEMS,
  createInitialState, currentVer, nextId, isDraftView, viewData, findCrit, scoresOf, norm,
  detectType, detectVer, planChanges, stepDetail, scanWarnings, newDraft, applyDesign, wtName,
} from '../data/settingsEngine';

const AiIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></svg>;
const DocIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>;
const WarnIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>;
const ChevIcon = () => <svg className="crit-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>;

function diffText(o, n) {
  if (o && n.startsWith(o)) return <>{o}<span className="diff-add">{n.slice(o.length)}</span></>;
  if (n && o.startsWith(n)) return <>{n}<span className="diff-del">{o.slice(n.length)}</span></>;
  return <><span className="diff-del">{o}</span><br /><span className="diff-add">{n}</span></>;
}

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

  // --- 문서 업로드 · 에이전트 시뮬레이션 ---
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

  // --- 평가 기준 관리 ---
  function resetEdit() { s.open = null; s.work = null; s.dirty = false; }
  function setWork(key) { s.work = isDraftView(s) ? clone(findCrit(s, key)) : null; s.dirty = false; }

  function handleToggleCard(key) {
    if (s.open === key) resetEdit(); else { s.open = key; setWork(key); }
    rerender();
  }
  function handleFieldChange(field, value) {
    if (!s.work) return;
    if (field.startsWith('lv')) s.work.levels[field.slice(2)] = value;
    else s.work[field] = value;
    s.dirty = true;
    rerender();
  }
  function handleAddEvidence(value) {
    if (!value) return;
    const [doc, sec] = value.split('|');
    s.work.evidence.push({ ...findCritEvidenceSource(doc, sec), isNew: true });
    s.dirty = true;
    rerender();
  }
  function findCritEvidenceSource(docId, sec) {
    const d = s.docs.find((x) => x.id === docId);
    const sObj = d && d.sections.find((x) => x[0] === sec);
    return { doc: docId, ver: d ? d.ver : '', sec, quote: sObj ? sObj[1] : '' };
  }
  function handleRemoveEvidence(i) {
    s.work.evidence.splice(i, 1);
    s.dirty = true;
    rerender();
  }

  function actSave(key) {
    const w = s.work, d = s.draft;
    if (!w.focus.trim() || scoresOf(w).some((sc) => !w.levels[sc].trim()) || !w.unobserved.trim()) { toast('평가 질문·점수 조건·미관측 조건은 비울 수 없습니다'); return; }
    if (!w.evidence.length) { toast('근거 인용이 1건 이상 필요합니다'); return; }
    const [wt, item] = key.split('|');
    const arr = d.data[wt], idx = arr.findIndex((c) => c.title === item);
    const before = d.changes[key] ? d.changes[key].before : clone(arr[idx]);
    arr[idx] = clone(w);
    if (norm(arr[idx]) === norm(before)) delete d.changes[key];
    else if (!d.changes[key]) d.changes[key] = { by: 'admin', reasons: [`${ME} 직접 수정`], before };
    else if (d.changes[key].by === 'ai') d.changes[key].edited = true;
    scanWarnings(s, key);
    s.history.unshift({ t: nowStr(), who: ME, text: `${wtName(wt)} > ${item} 수정` });
    setWork(key);
    rerender();
    const w2 = d.warnings.filter((x) => x.key === key).length;
    toast(w2 ? `저장했습니다 · 검토 경고 ${w2}건이 남아 있습니다` : `${d.id} 초안에 저장했습니다`);
  }
  function actCancel(key) { setWork(key); rerender(); }
  function actRevert(key) {
    const d = s.draft, [wt, item] = key.split('|');
    const arr = d.data[wt], idx = arr.findIndex((c) => c.title === item);
    arr[idx] = clone(d.changes[key].before);
    delete d.changes[key];
    scanWarnings(s, key);
    s.history.unshift({ t: nowStr(), who: ME, text: `${wtName(wt)} > ${item}을 ${d.base} 기준으로 되돌림` });
    setWork(key);
    rerender();
    toast(`${d.base} 기준으로 되돌렸습니다`);
  }
  function actAck(key) {
    s.draft.warnings.filter((w) => w.key === key).forEach((w) => { w.ack = true; });
    s.history.unshift({ t: nowStr(), who: ME, text: `${wtName(key.split('|')[0])} > ${key.split('|')[1]} 검토 경고 확인` });
    rerender();
  }

  function handleVersionChange(v) { s.view = v; resetEdit(); rerender(); }
  function handleWtChange(key) { s.wt = key; resetEdit(); rerender(); }

  function handleToolbarAction(action) {
    const d = s.draft;
    if (action === 'toDraft') { s.view = d.id; resetEdit(); rerender(); return; }
    if (action === 'fork') {
      s.draft = newDraft(s, ME);
      s.view = s.draft.id;
      s.history.unshift({ t: nowStr(), who: ME, text: `${s.draft.id} 수정 초안 생성 (${s.draft.base} 복사)` });
      resetEdit();
      rerender();
      return;
    }
    if (action === 'discard') {
      if (s.job && !s.job.done) { toast('에이전트 설계가 끝난 뒤 폐기할 수 있습니다'); return; }
      s.docs.forEach((doc) => { if (doc.rubric === 'draft') doc.rubric = 'none'; });
      s.history.unshift({ t: nowStr(), who: ME, text: `${d.id} 초안 폐기` });
      s.draft = null; s.job = null; s.view = currentVer(s).id;
      resetEdit();
      rerender();
      toast(`${d.id} 초안을 폐기했습니다`);
      return;
    }
    if (action === 'approve') {
      if (s.dirty) { toast('저장하지 않은 수정이 있습니다. 항목 저장 또는 취소 후 승인하세요'); return; }
      const pending = d.warnings.filter((w) => !w.ack);
      if (pending.length) {
        s.wt = pending[0].key.split('|')[0];
        s.open = pending[0].key;
        setWork(s.open);
        rerender();
        toast(`검토 경고 ${pending.length}건을 먼저 확인하세요`);
        return;
      }
      const n = Object.keys(d.changes).length;
      if (!n) { toast('변경된 항목이 없습니다'); return; }
      const t = nowStr();
      s.versions.forEach((v) => { if (v.status === 'current') v.status = 'archived'; });
      s.versions.push({ id: d.id, status: 'current', by: ME, date: t });
      s.rubrics[d.id] = d.data;
      s.docs.forEach((doc) => {
        if (doc.rubric === 'draft') doc.rubric = 'linked';
        else if (doc.status === 'old' && doc.rubric === 'linked') doc.rubric = 'excluded';
      });
      s.history.unshift({ t, who: ME, text: `${d.id} 승인 · ${n}개 항목 변경, 다음 평가부터 적용` });
      s.draft = null; s.job = null; s.view = d.id;
      resetEdit();
      rerender();
      toast(`${d.id} 기준이 승인되어 적용되었습니다`);
    }
  }

  const draftView = isDraftView(s);
  const cur = currentVer(s);

  return (
    <section className="page active">
      <div className="topheader"><h1>운영 설정</h1></div>
      <div className="page-sub"><p>제품·가격 자료, 평가 기준을 관리합니다.</p></div>

      <div className="utabs">
        <button className={`utab${tab === 'tab-b' ? ' active' : ''}`} onClick={() => setTab('tab-b')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
          제품·가격·정책 자료
        </button>
        <button className={`utab${tab === 'tab-c' ? ' active' : ''}`} onClick={() => setTab('tab-c')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
          평가 기준 관리
          {s.draft && <span className="tab-count">{s.draft.id} 초안</span>}
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
                          {d.rubric === 'draft' && s.draft
                            ? <button className="badge badge-ai" style={{ border: 'none' }} onClick={() => setTab('tab-c')}>{s.draft.id} 초안 검토 →</button>
                            : d.rubric === 'linked' ? <span className="mono">{cur.id} 근거</span>
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
                  <b>{s.job.draftId} 초안 저장 완료</b> · {s.job.changedCount}개 항목 수정
                  <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={() => setTab('tab-c')}>초안 검토하기 →</button>
                </div>
              ) : (
                <div className="agent-note">승인 전까지는 적용되지 않아요</div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'tab-c' && (
        <div className="settings-panel active">
          <div className="card rb-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <select value={s.view} onChange={(e) => handleVersionChange(e.target.value)}>
                {s.draft && <option value={s.draft.id}>{s.draft.id} 초안 · 승인 대기</option>}
                {[...s.versions].reverse().map((v) => (
                  <option key={v.id} value={v.id}>{v.id} · {v.status === 'current' ? '현재 적용' : '이전 버전'}</option>
                ))}
              </select>
              <span>
                {draftView
                  ? <span className="badge badge-amber">승인 대기</span>
                  : s.versions.find((v) => v.id === s.view).status === 'current'
                    ? <span className="badge badge-green">적용 중</span>
                    : <span className="badge badge-gray">읽기 전용</span>}
              </span>
              <span className="rb-meta">
                {draftView
                  ? `기반 ${s.draft.base} · 작성 ${s.draft.by} · ${s.draft.createdAt} · 변경 ${Object.keys(s.draft.changes).length}개 항목`
                  : `승인 ${s.versions.find((v) => v.id === s.view).by} · ${s.versions.find((v) => v.id === s.view).date}`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {draftView ? (
                <>
                  <button className="btn" onClick={() => handleToolbarAction('discard')}>초안 폐기</button>
                  <button className="btn btn-primary" onClick={() => handleToolbarAction('approve')}>승인 후 적용</button>
                </>
              ) : s.versions.find((v) => v.id === s.view).status !== 'current' ? null
                : s.draft ? <button className="btn" onClick={() => handleToolbarAction('toDraft')}>{s.draft.id} 초안 보기</button>
                  : <button className="btn" onClick={() => handleToolbarAction('fork')}>수정 초안 만들기</button>}
            </div>
          </div>

          {draftView ? (
            <div className="ai-banner">
              <AiIcon />
              <div>
                {s.draft.sources.length
                  ? <>
                    <b>AI 초안</b> · {s.draft.sources.join(', ')} 반영 · {Object.keys(s.draft.changes).length}개 항목 수정
                    {s.draft.warnings.filter((w) => !w.ack).length > 0 && <> · <b style={{ color: 'var(--amber)' }}>경고 {s.draft.warnings.filter((w) => !w.ack).length}건</b></>}
                  </>
                  : <><b>관리자 수정 초안</b> · {s.draft.base} 기반 · {Object.keys(s.draft.changes).length}개 항목 수정</>}
              </div>
            </div>
          ) : (s.view === cur.id && s.draft) ? (
            <div className="ai-banner" style={{ background: 'var(--gray-soft)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <DocIcon /><div>적용 중 · {s.draft.id} 초안 승인 대기</div>
            </div>
          ) : s.view !== cur.id ? (
            <div className="ai-banner" style={{ background: 'var(--gray-soft)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <DocIcon /><div>읽기 전용 · 이전 버전</div>
            </div>
          ) : null}

          <div className="rb-grid">
            <div className="card wt-list">
              <div className="field-label" style={{ padding: '6px 10px 2px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.03em', color: 'var(--text-faint)' }}>업무 유형</div>
              {WORK_TYPES.map((wt) => {
                const n = draftView ? ITEMS.filter((i) => s.draft.changes[`${wt.key}|${i}`]).length : 0;
                return (
                  <button key={wt.key} className={`wt-item${wt.key === s.wt ? ' on' : ''}`} onClick={() => handleWtChange(wt.key)}>
                    <span>{wt.name}</span>{n > 0 && <span className="wt-count">변경 {n}</span>}
                  </button>
                );
              })}
            </div>

            <div>
              {(() => {
                const wt = WORK_TYPES.find((w) => w.key === s.wt);
                const crits = viewData(s)[wt.key];
                return (
                  <>
                    <div className="crit-list-head">
                      <div><b>{wt.name}</b><span> · 산출물: {wt.artifact} · {ITEMS.length}개 항목</span></div>
                      <span className="task-sub">{draftView ? '항목을 눌러 검토·수정' : '읽기 전용'}</span>
                    </div>
                    {crits.map((saved) => (
                      <CritCard
                        key={saved.title}
                        saved={saved}
                        wtKey={wt.key}
                        s={s}
                        draftView={draftView}
                        onToggle={handleToggleCard}
                        onFieldChange={handleFieldChange}
                        onAddEvidence={handleAddEvidence}
                        onRemoveEvidence={handleRemoveEvidence}
                        onSave={actSave}
                        onCancel={actCancel}
                        onRevert={actRevert}
                        onAck={actAck}
                      />
                    ))}
                  </>
                );
              })()}
            </div>
          </div>

          <div className="rb-bottom">
            <div className="card" style={{ padding: '4px 20px' }}>
              <div className="form-row"><label>항목별 배점</label><span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>0 / 1 / 2점 · 보안 준수는 0 또는 2점만</span></div>
              <div className="form-row"><label>미관측 처리</label><span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>0점이 아닌 미관측으로 분류, 점수 계산에서 제외</span></div>
              <div className="form-row"><label>최소 집계 인원</label><input type="text" defaultValue="5명" style={{ maxWidth: 100 }} /></div>
            </div>
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ fontSize: 15, marginBottom: 6 }}>변경 이력</h3>
              <div>
                {s.history.slice(0, 7).map((h, i) => (
                  <div className="hist-row" key={i}><span className="mono">{h.t.slice(5)}</span><div><b>{h.who}</b> · {h.text}</div></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CritCard({ saved, wtKey, s, draftView, onToggle, onFieldChange, onAddEvidence, onRemoveEvidence, onSave, onCancel, onRevert, onAck }) {
  const key = `${wtKey}|${saved.title}`;
  const open = s.open === key;
  const d = s.draft;
  const c = open && s.work ? s.work : saved;
  const ch = draftView && d && d.changes[key];
  const warns = draftView && d ? d.warnings.filter((w) => w.key === key) : [];
  const scores = scoresOf(c);

  return (
    <div className={`card crit${open ? ' open' : ''}`}>
      <div className="crit-head" onClick={() => onToggle(key)}>
        <span className="mono" style={{ flex: 'none', width: 46 }}>{c.id}</span>
        <div style={{ minWidth: 0 }}><div className="crit-title">{c.title}</div><div className="crit-focus">{saved.focus}</div></div>
        <div className="crit-tags">
          <span className="chip chip-xs">{c.dim}</span>
          <span className="mono" style={{ fontSize: 11.5 }}>{[...scores].reverse().join('·')}점</span>
          {ch && (ch.by === 'ai' && !ch.edited ? <span className="badge badge-ai">AI 제안</span> : <span className="badge badge-blue">관리자 수정</span>)}
          {warns.some((w) => !w.ack) && <span className="badge badge-amber">검토 경고</span>}
        </div>
        <ChevIcon />
      </div>

      {open && (
        <div className="crit-body-wrap">
          <div className="crit-body">
            <div className="ed-row"><label>평가 질문</label>
              <textarea disabled={!draftView} rows={Math.max(2, Math.ceil(c.focus.length / 62))} value={c.focus} onChange={(e) => onFieldChange('focus', e.target.value)} />
            </div>
            <div className="ed-row"><label>점수 조건</label>
              <div>
                {scores.map((sc) => (
                  <div className="lvl" key={sc}>
                    <span className={`lvl-score s${sc}`}>{sc}점</span>
                    <textarea disabled={!draftView} rows={Math.max(2, Math.ceil(c.levels[sc].length / 62))} value={c.levels[sc]} onChange={(e) => onFieldChange(`lv${sc}`, e.target.value)} />
                  </div>
                ))}
                {c.title === '보안 준수' && !('1' in c.levels) && <div className="task-sub">보안 준수는 0·2점만 판정</div>}
              </div>
            </div>
            <details className="ed-more">
              <summary>미관측·검토 조건</summary>
              <div className="ed-row"><label>미관측 조건</label><textarea disabled={!draftView} rows={Math.max(2, Math.ceil(c.unobserved.length / 62))} value={c.unobserved} onChange={(e) => onFieldChange('unobserved', e.target.value)} /></div>
              <div className="ed-row"><label>검토 필요 조건</label><textarea disabled={!draftView} rows={Math.max(2, Math.ceil(c.review.length / 62))} value={c.review} onChange={(e) => onFieldChange('review', e.target.value)} /></div>
            </details>
            <div className="ed-row"><label>근거 자료</label>
              <div className="ev-list">
                {c.evidence.length ? c.evidence.map((e, i) => (
                  <div className={`ev${e.isNew ? ' new' : ''}`} key={i}>
                    <span className="mono">{e.doc} · {e.ver} · {e.sec}</span><span>{e.quote}</span>
                    {draftView && <button onClick={() => onRemoveEvidence(i)} title="근거 제거">×</button>}
                  </div>
                )) : <div className="task-sub" style={{ color: 'var(--red)' }}>근거 없음 — 1건 이상 연결 필요</div>}
                {draftView && (
                  <select className="ev-add" onChange={(e) => { onAddEvidence(e.target.value); e.target.value = ''; }} defaultValue="">
                    <option value="">+ 근거 인용 연결…</option>
                    {s.docs.filter((doc) => doc.status === 'current').flatMap((doc) => doc.sections
                      .filter(([sec]) => !c.evidence.some((e) => e.doc === doc.id && e.sec === sec))
                      .map(([sec, q]) => <option key={`${doc.id}|${sec}`} value={`${doc.id}|${sec}`}>{doc.id} · {sec} — {q.length > 32 ? `${q.slice(0, 32)}…` : q}</option>))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {ch && <ChangeBox ch={ch} saved={saved} />}

          {warns.map((w, i) => (
            w.ack
              ? <div className="warn-done" key={i}>✓ 확인됨 — {w.field} "{w.term}"</div>
              : (
                <div className="warn-box" key={i}>
                  <WarnIcon />
                  <div style={{ flex: 1 }}>
                    <b>검토 경고</b> — {w.field}에 "{w.term}"
                    <div className="warn-quote">…{w.excerpt}…</div>
                    {w.message}
                  </div>
                  {draftView && <button className="btn btn-sm" onClick={() => onAck(key)}>확인함</button>}
                </div>
              )
          ))}

          {draftView && (
            <div className="crit-foot">
              <button className="btn btn-ghost btn-sm" disabled={!ch} onClick={() => onRevert(key)}>{d.base} 기준으로 되돌리기</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm" disabled={!s.dirty} onClick={() => onCancel(key)}>취소</button>
                <button className="btn btn-primary btn-sm" disabled={!s.dirty} onClick={() => onSave(key)}>항목 저장</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChangeBox({ ch, saved }) {
  const b = ch.before;
  const lines = [];
  const add = (lbl, o = '', n = '') => { if (o !== n) lines.push({ lbl, o, n }); };
  add('평가 질문', b.focus, saved.focus);
  ['2', '1', '0'].forEach((sc) => add(`${sc}점 조건`, b.levels[sc], saved.levels[sc]));
  add('미관측 조건', b.unobserved, saved.unobserved);
  add('검토 필요 조건', b.review, saved.review);
  const k = (e) => `${e.doc} · ${e.sec}`;
  const bk = b.evidence.map(k), nk = saved.evidence.map(k);
  const evRemoved = bk.filter((x) => !nk.includes(x));
  const evAdded = nk.filter((x) => !bk.includes(x));
  const ai = ch.by === 'ai';

  return (
    <div className={`change-box${ai ? '' : ' admin'}`}>
      <b>{ai ? 'AI 변경 사유' : '관리자 수정'}</b>{ai && ch.edited && ' · 이후 직접 수정함'}
      <ul>{ch.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
      <details>
        <summary>변경 내용 보기</summary>
        {lines.length === 0 && evRemoved.length === 0 && evAdded.length === 0 && <div className="chg-line">내용 변경 없음</div>}
        {lines.map((l, i) => <div className="chg-line" key={i}><span className="lbl">{l.lbl}</span>{diffText(l.o, l.n)}</div>)}
        {(evRemoved.length > 0 || evAdded.length > 0) && (
          <div className="chg-line">
            <span className="lbl">근거 자료</span>
            {evRemoved.map((x, i) => <span className="diff-del" key={`r${i}`}>{x} </span>)}
            {evAdded.map((x, i) => <span className="diff-add" key={`a${i}`}>{x} </span>)}
          </div>
        )}
      </details>
    </div>
  );
}
