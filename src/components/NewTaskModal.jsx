import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';

export default function NewTaskModal({ onClose, onCreated, workTypes }) {
  const { toast } = useApp();
  const [typeKey, setTypeKey] = useState(workTypes[0]?.workType || '');
  const [title, setTitle] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [extraFields, setExtraFields] = useState({});
  const [customers, setCustomers] = useState([]);
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get('/api/customers').then(setCustomers).catch(() => setCustomers([]));
  }, []);

  const selectedType = workTypes.find((t) => t.workType === typeKey);
  const extraRegFields = (selectedType?.registrationFields || []).filter((f) => f.key !== 'purpose');

  function addFiles(fileList) {
    setFiles((prev) => [...prev, ...Array.from(fileList)]);
  }

  function removeFile(i) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleCreate() {
    if (!title.trim()) { toast('업무명을 입력하세요'); return; }
    setBusy(true);
    try {
      const registration = { ...extraFields };
      const body = {
        title: title.trim(),
        workType: typeKey || undefined,
        customerId: customerId || undefined,
        purpose: purpose.trim() || undefined,
        registration: Object.keys(registration).length ? registration : undefined,
      };
      const detail = await api.post('/api/works', body);
      const workId = detail.summary.workId;

      for (const file of files) {
        const form = new FormData();
        form.append('file', file);
        await api.postForm(`/api/works/${workId}/source-documents`, form);
      }

      onCreated(workId);
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div className="modal-head">
          <h2>새 업무 생성</h2>
          <button className="icon-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label>업무 유형</label>
            <select value={typeKey} onChange={(e) => setTypeKey(e.target.value)}>
              <option value="">유형 미정 (나중에 분류)</option>
              {workTypes.map((t) => <option key={t.workType} value={t.workType}>{t.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>업무명</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 카카오엔터프라이즈향 RFP 분석" />
          </div>
          <div className="field">
            <label>고객사</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">고객 미지정</option>
              {customers.map((c) => <option key={c.customerId} value={c.customerId}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>목적 · 요구사항</label>
            <textarea rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="업무 목적, 예산, 필수 요구사항 등을 입력하세요" />
          </div>
          {extraRegFields.map((f) => (
            <div className="field" key={f.key}>
              <label>{f.label}</label>
              <input type="text" value={extraFields[f.key] || ''}
                onChange={(e) => setExtraFields((prev) => ({ ...prev, [f.key]: e.target.value }))} />
            </div>
          ))}
          <div className="field">
            <label>고객 자료</label>
            <p className="task-sub" style={{ margin: '-6px 0 8px' }}>RFP 원문, 정정 공고, 회의록 등 고객이 보낸 자료를 올려주세요. 사내 자료는 AI가 자동으로 참고해요.</p>
            <div
              className={`card dropzone${dragging ? ' drag' : ''}`}
              style={{ padding: 18 }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
              onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
              <b style={{ fontSize: 13.5 }}>파일을 끌어다 놓거나 선택하세요</b>
              <button className="btn btn-sm" type="button" onClick={() => fileInputRef.current.click()} style={{ marginTop: 8 }}>파일 선택</button>
              <input ref={fileInputRef} type="file" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            </div>
            <div className="nt-file-list">
              {files.map((file, i) => (
                <div key={`${file.name}-${i}`} className="nt-file-chip">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                  <span>{file.name}</span>
                  <button onClick={() => removeFile(i)} title="제거">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose} disabled={busy}>취소</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={busy}>{busy ? '생성 중…' : '생성하고 작업 시작'}</button>
        </div>
      </div>
    </div>
  );
}
