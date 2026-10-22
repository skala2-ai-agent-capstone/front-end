/* ---------- 새 업무 생성 모달 ---------- */
const TYPE_META = {
  rfp:{type:'RFP 요구사항 분석', artifactTitle:'요구사항 대응표'},
  proposal:{type:'고객 맞춤 제안서 작성', artifactTitle:'최종 제안서'},
  quote:{type:'견적서 작성', artifactTitle:'견적서'},
  reply:{type:'고객 질의 답변 작성', artifactTitle:'회신 메일'},
};
let ntFiles = [];

function openNewTaskModal(){
  document.getElementById('newTaskModal').classList.add('open');
  document.getElementById('ntTitle').value = '';
  document.getElementById('ntPurpose').value = '';
  ntFiles = [];
  renderNtFiles();
}
function closeNewTaskModal(){
  document.getElementById('newTaskModal').classList.remove('open');
}
function renderNtFiles(){
  document.getElementById('ntFileList').innerHTML = ntFiles.map((name, i) => `
    <div class="nt-file-chip">${FILE_ICON}<span>${esc(name)}</span><button onclick="removeNtFile(${i})" title="제거">×</button></div>
  `).join('');
}
function addNtFiles(fileList){
  Array.from(fileList).forEach(f => ntFiles.push(f.name));
  renderNtFiles();
}
function removeNtFile(i){
  ntFiles.splice(i, 1);
  renderNtFiles();
}
document.getElementById('ntFileInput').addEventListener('change', e => { addNtFiles(e.target.files); e.target.value = ''; });
const ntDz = document.getElementById('ntDropzone');
['dragenter', 'dragover'].forEach(ev => ntDz.addEventListener(ev, e => { e.preventDefault(); ntDz.classList.add('drag'); }));
['dragleave', 'drop'].forEach(ev => ntDz.addEventListener(ev, e => { e.preventDefault(); ntDz.classList.remove('drag'); }));
ntDz.addEventListener('drop', e => addNtFiles(e.dataTransfer.files));

function createTask(){
  const typeKey = document.getElementById('ntType').value;
  const title = document.getElementById('ntTitle').value.trim() || TYPE_META[typeKey].type;
  const purpose = document.getElementById('ntPurpose').value.trim();
  const id = 'custom' + Date.now();
  TASKS[id] = {
    title, type: TYPE_META[typeKey].type, typeKey, status:'작성 중', statusClass:'badge-gray', updated:'방금 전',
    purpose: purpose ? esc(purpose).replace(/\n/g, '<br/>') : '등록된 목적·요구사항이 없습니다',
    refs: ntFiles.length ? ntFiles : [],
    artifactTitle: TYPE_META[typeKey].artifactTitle, artifactVersion:'초안 작성 전',
    artifactBody: '<p class="task-sub">AI와 대화를 시작하면 여기에 산출물이 쌓여요.</p>',
    messages: [],
  };
  closeNewTaskModal();
  openWorkspace(id);
  renderWsTable();
  renderRecentCards();
}
