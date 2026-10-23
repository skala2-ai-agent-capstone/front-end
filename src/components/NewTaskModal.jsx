import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const TYPE_OPTIONS = [
  ['rfp', 'RFP 요구사항 분석'],
  ['proposal', '고객 맞춤 제안서 작성'],
  ['quote', '견적서 작성'],
  ['reply', '고객 질의 답변 작성'],
];

export default function NewTaskModal({ onClose }) {
  const { createTask } = useApp();
  const navigate = useNavigate();
  const [typeKey, setTypeKey] = useState('rfp');
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  function addFiles(fileList) {
    setFiles((prev) => [...prev, ...Array.from(fileList).map((f) => f.name)]);
  }

  function removeFile(i) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleCreate() {
    const id = createTask(typeKey, title.trim(), purpose.trim(), files);
    onClose();
    navigate(`/workspace/${id}`);
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
              {TYPE_OPTIONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>업무명 · 고객사</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 카카오엔터프라이즈향 RFP 분석" />
          </div>
          <div className="field">
            <label>목적 · 요구사항</label>
            <textarea rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="업무 목적, 예산, 필수 요구사항 등을 입력하세요" />
          </div>
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
              {files.map((name, i) => (
                <div key={`${name}-${i}`} className="nt-file-chip">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
                  <span>{name}</span>
                  <button onClick={() => removeFile(i)} title="제거">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={handleCreate}>생성하고 작업 시작</button>
        </div>
      </div>
    </div>
  );
}
