import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';

// 운영 설정 > 자료. 내규(.pdf·.txt)를 올리면 백엔드가 business-mcp에 새 버전으로 적재하고(바로 현행)
// 평가 기준 초안 생성을 큐에 넣는다. Agent가 업무 유형별 초안을 저장하면 생성 건이 '완료'가 된다.
// 초안은 '평가 기준 관리' 탭에서 승인해야 현행이 된다.

const POLL_MS = 3000;
const COLLECTION = { policies: '내규·정책', references: '제품·가격 자료' };
const STATUS_BADGE = { 현행: 'badge-green', 초안: 'badge-amber', 폐기: 'badge-gray' };
const TYPE_NAME = { rfp_analysis: 'RFP 분석', proposal: '제안서', quote: '견적서', inquiry_reply: '질의 답변' };

const AiIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></svg>;
const DocIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>;

/** 현행 내규 버전의 마지막 숫자를 하나 올린 값(v1.1 → v1.2). 형식이 다르면 빈 칸 */
function nextVersion(docs) {
  const current = docs.find((d) => d.collection === 'policies' && d.status === '현행');
  const m = current && /^(.*?)(\d+)$/.exec(current.version);
  return m ? `${m[1]}${Number(m[2]) + 1}` : '';
}

const minutesSince = (iso) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));

/** 생성 건(gen)과 이번에 올린 내규 결과(upload, 같은 버전일 때만)로 에이전트 단계 표시를 만든다 */
function stepsOf(gen, upload) {
  const doc = gen && upload && upload.docId === gen.policyDocId && upload.version === gen.policyVersion ? upload : null;
  const st = gen?.status;
  const diff = doc?.diff;
  return [
    {
      name: '내규 적재·색인', state: gen ? 'done' : 'wait',
      detail: doc ? `${doc.chunks}개 구간 · ${doc.clauses}개 조항${doc.ragReloaded ? '' : ' · 검색 사본 갱신 지연'}`
        : gen ? `${gen.policyDocId} ${gen.policyVersion} 현행` : '대기 중',
    },
    {
      name: '이전 버전 대조', state: gen ? 'done' : 'wait',
      detail: !doc ? (gen ? '완료' : '대기 중')
        : diff ? `${diff.base} 대비 추가 ${diff.added.length} · 변경 ${diff.changed.length} · 삭제 ${diff.removed.length}` : '첫 내규',
    },
    {
      name: '평가 기준 설계', state: !gen ? 'wait' : st === '대기' ? 'run' : st === '완료' ? 'done' : 'fail',
      detail: !gen ? '대기 중'
        : st === '대기' ? `${gen.workTypes.length}개 업무 유형 생성·검사 중 · ${minutesSince(gen.createdAt)}분 경과`
          : st === '완료' ? '형식·근거 조항 검사 통과' : gen.errorMessage,
    },
    {
      name: '초안 저장', state: st === '완료' ? 'done' : 'wait',
      detail: st === '완료' ? gen.drafts.map((d) => `${TYPE_NAME[d.workType] || d.workType} ${d.version}`).join(' · ') : '대기 중',
    },
  ];
}

export default function PolicyUploadPanel({ draftCount, onGenerated, onReview }) {
  const { toast } = useApp();
  const [docs, setDocs] = useState(null);
  const [generation, setGeneration] = useState(null);
  const [upload, setUpload] = useState(null);       // 이번 화면에서 올린 내규 적재 결과
  const [version, setVersion] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const lastStatus = useRef(null);

  const loadDocs = useCallback(async () => {
    const list = await api.get('/api/settings/documents');
    setDocs(list);
    setVersion((v) => v || nextVersion(list));
  }, []);

  useEffect(() => {
    loadDocs().catch((err) => toast(err.message));
    api.get('/api/settings/rubric-generations/latest')
      .then((g) => { lastStatus.current = g?.status ?? null; setGeneration(g ?? null); })
      .catch((err) => toast(err.message));
  }, [loadDocs, toast]);

  // 대기 중인 동안만 폴링한다. 대기 → 완료·실패로 바뀌면 알리고 기준 목록을 다시 읽게 한다
  useEffect(() => {
    if (generation?.status !== '대기') return undefined;
    const timer = setTimeout(() => {
      api.get('/api/settings/rubric-generations/latest')
        .then((g) => setGeneration(g ?? null))
        .catch(() => setGeneration((prev) => (prev ? { ...prev } : prev)));   // 일시 오류면 다음 주기에 다시
    }, POLL_MS);
    return () => clearTimeout(timer);
  }, [generation]);

  useEffect(() => {
    const status = generation?.status ?? null;
    if (lastStatus.current === '대기' && status === '완료') {
      toast(`평가 기준 초안 ${generation.drafts.length}건이 저장되었습니다`);
      onGenerated();
      loadDocs().catch(() => {});
    } else if (lastStatus.current === '대기' && status === '실패') {
      toast(generation.errorMessage || '평가 기준 초안을 만들지 못했습니다');
    }
    lastStatus.current = status;
  }, [generation, toast, onGenerated, loadDocs]);

  const running = generation?.status === '대기';

  /** 초안이 이미 있으면 새로 만든 초안이 덮어쓴다(관리자 수정 포함) */
  const confirmOverwrite = () => draftCount === 0
    || window.confirm(`평가 기준 초안 ${draftCount}건이 있습니다. 새로 만드는 초안이 덮어씁니다(관리자 수정 포함). 계속할까요?`);

  async function startUpload(file) {
    if (busy || running) { toast('진행 중인 기준 설계가 끝난 뒤 다시 올려 주세요'); return; }
    if (!/\.(pdf|txt)$/i.test(file.name)) { toast('내규는 .pdf 또는 .txt 파일만 올릴 수 있어요'); return; }
    if (!version.trim()) { toast('버전을 입력하세요 (예: v1.2)'); return; }
    if (!confirmOverwrite()) return;
    const form = new FormData();
    form.append('file', file);
    form.append('version', version.trim());
    setBusy(true);
    try {
      const res = await api.postForm('/api/settings/documents', form);
      setUpload(res.document);
      if (res.generation) {
        lastStatus.current = res.generation.status;
        setGeneration(res.generation);
        toast(`${res.document.docId} ${res.document.version}을 현행으로 적재했어요. 평가 기준 초안을 만듭니다`);
      } else {
        toast('같은 버전·같은 내용이 이미 현행이에요. 초안을 다시 만들려면 [다시 생성]을 누르세요');
      }
      setVersion('');
      await loadDocs();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function regenerate() {
    if (!confirmOverwrite()) return;
    setBusy(true);
    try {
      const g = await api.post('/api/settings/rubric-generations');
      lastStatus.current = g.status;
      setGeneration(g);
      toast('현행 내규로 평가 기준 초안을 다시 만듭니다');
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handlePick(e) {
    const f = e.target.files[0];
    if (f) startUpload(f);
    e.target.value = '';
  }
  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) startUpload(f);
  }

  const sameDoc = (d) => generation && d.docId === generation.policyDocId && d.version === generation.policyVersion;
  const steps = stepsOf(generation, upload);
  const canRegenerate = !running && !busy && docs?.some((d) => d.collection === 'policies' && d.status === '현행');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 업로드 영역과 에이전트 진행 상황을 한 줄에 두고, 등록 자료 표는 아래에 전체 폭으로 둔다 */}
      <div className="upload-grid">
        <div className={`card dropzone${dragging ? ' drag' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
          onDrop={handleDrop}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
          <b>내규 파일을 끌어다 놓으세요</b>
          <p>올리면 새 버전이 바로 현행이 되고, AI가 업무 유형별 평가 기준 초안을 만들어요</p>
          <div className="upload-opts">
            <input aria-label="새 버전" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="버전 (예: v1.2)" style={{ width: 130 }} />
            <button className="btn btn-primary btn-sm" disabled={busy || running} onClick={() => inputRef.current.click()}>
              {busy ? '올리는 중…' : '파일 선택'}
            </button>
            <input ref={inputRef} type="file" hidden accept=".pdf,.txt" onChange={handlePick} />
          </div>
          <p style={{ margin: '12px 0 0' }}>내규·정책(.pdf, .txt)만 올릴 수 있어요. 제N조·별표 N. 형식이어야 조항으로 나뉩니다.</p>
        </div>

        <div className="card agent-card">
          <div className="agent-title">
            <div className="agent-icon"><AiIcon /></div><b>평가 기준 설계 에이전트</b>
            {generation?.status === '대기' && <span className="badge badge-amber" style={{ marginLeft: 'auto' }}>설계 중</span>}
            {generation?.status === '완료' && <span className="badge badge-green" style={{ marginLeft: 'auto' }}>초안 저장됨</span>}
            {generation?.status === '실패' && <span className="badge badge-red" style={{ marginLeft: 'auto' }}>실패</span>}
          </div>
          {generation ? (
            <div className="agent-file"><DocIcon /><span className="name">{generation.sourceFile || `${generation.policyDocId} ${generation.policyVersion}`}</span><span className="chip chip-xs">내규</span></div>
          ) : (
            <div className="agent-sub">내규를 올리면 자동 실행돼요</div>
          )}
          <div>
            {steps.map((step) => (
              <div className={`step ${step.state}`} key={step.name}>
                <span className="step-ico"></span>
                <div><b>{step.name}</b><small>{step.detail}</small></div>
              </div>
            ))}
          </div>
          {generation?.status === '완료' && (
            <div className="agent-result">
              <b>초안 {generation.drafts.length}건 저장 완료</b> · 승인 전까지는 적용되지 않아요
              <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={onReview}>초안 검토하기 →</button>
            </div>
          )}
          {generation?.status === '실패' && (
            <div className="agent-result fail">
              <b>초안을 만들지 못했어요</b>{generation.error ? ` (${generation.error})` : ''}
              <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} disabled={!canRegenerate} onClick={regenerate}>현행 내규로 다시 생성</button>
            </div>
          )}
          {(!generation || generation.status === '대기') && (
            <div className="agent-note">승인 전까지는 적용되지 않아요</div>
          )}
          {upload?.duplicate && generation?.status !== '대기' && generation?.status !== '실패' && (
            <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} disabled={!canRegenerate} onClick={regenerate}>현행 내규로 다시 생성</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="sec-head">
          <h3>등록 자료</h3>
          <span>{docs ? `${docs.length}건 · 현행 ${docs.filter((d) => d.status === '현행').length}건` : '불러오는 중…'}</span>
        </div>
        <table>
          <thead><tr><th>자료</th><th>유형</th><th>버전</th><th>상태</th><th>시행일</th><th>평가 기준</th></tr></thead>
          <tbody>
            {(docs || []).map((d) => (
              <tr key={`${d.docId}@${d.version}`}>
                <td><div className="task-name">{d.title || d.sourceFile || d.docId}</div><div className="task-sub">{d.sourceFile ? `${d.docId} · ${d.sourceFile}` : d.docId}</div></td>
                <td>{d.indexed ? COLLECTION[d.collection] || '기타' : '기밀(색인 안 함)'}</td>
                <td className="mono">{d.version}</td>
                <td><span className={`badge ${STATUS_BADGE[d.status] || 'badge-gray'}`}>{d.status}</span></td>
                <td className="mono">{d.effectiveFrom || '—'}</td>
                <td>
                  {d.collection !== 'policies' ? <span className="task-sub">—</span>
                    : d.status !== '현행' ? <span className="task-sub">근거 제외</span>
                      : !sameDoc(d) ? <span className="task-sub">미반영</span>
                        : generation.status === '대기' ? <span className="badge badge-amber">초안 생성 중</span>
                          : generation.status === '완료'
                            ? <button className="badge badge-ai" style={{ border: 'none' }} onClick={onReview}>초안 검토 →</button>
                            : <span className="badge badge-red">생성 실패</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
