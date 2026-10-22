/* ---------- 개인 평가 리포트 — 확인 완료 · 이의 제기 ---------- */
function lockReportActions(){
  document.getElementById('reportAppealBtn').disabled = true;
  document.getElementById('reportConfirmBtn').disabled = true;
}

function setReportStatus(text, badgeClass){
  const badge = document.getElementById('reportStatusBadge');
  badge.className = 'badge ' + badgeClass;
  badge.textContent = text;
}

function confirmReport(){
  setReportStatus('확인 완료', 'badge-green');
  lockReportActions();
  toast('평가 결과를 확인했어요.');
}

function openAppealForm(){
  document.getElementById('appealForm').hidden = false;
  document.getElementById('reportAppealBtn').disabled = true;
  document.getElementById('reportConfirmBtn').disabled = true;
  document.getElementById('appealReason').focus();
}

function cancelAppealForm(){
  document.getElementById('appealForm').hidden = true;
  document.getElementById('appealReason').value = '';
  document.getElementById('appealReasonError').classList.remove('show');
  document.getElementById('reportAppealBtn').disabled = false;
  document.getElementById('reportConfirmBtn').disabled = false;
}

function submitAppeal(){
  const textarea = document.getElementById('appealReason');
  const errorEl = document.getElementById('appealReasonError');
  const reason = textarea.value.trim();
  if (!reason){
    errorEl.textContent = '이의 제기 사유를 입력하세요';
    errorEl.classList.add('show');
    return;
  }
  errorEl.classList.remove('show');
  document.getElementById('appealForm').hidden = true;
  setReportStatus('이의 제기됨', 'badge-red');
  lockReportActions();
  toast('이의 제기가 접수됐어요. 검토 결과를 알려드릴게요.');
}

document.getElementById('reportConfirmBtn').addEventListener('click', confirmReport);
document.getElementById('reportAppealBtn').addEventListener('click', openAppealForm);
document.getElementById('appealCancelBtn').addEventListener('click', cancelAppealForm);
document.getElementById('appealSubmitBtn').addEventListener('click', submitAppeal);
