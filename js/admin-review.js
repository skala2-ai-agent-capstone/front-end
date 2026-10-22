/* ---------- 평가 검토 — 보류 · 기존 점수 유지 · 수정 확정 ---------- */
function lockReviewActions(){
  document.getElementById('reviewHoldBtn').disabled = true;
  document.getElementById('reviewKeepBtn').disabled = true;
  document.getElementById('reviewOverrideBtn').disabled = true;
}

function setReviewStatus(text, badgeClass){
  const badge = document.getElementById('reviewStatusBadge');
  badge.className = 'badge ' + badgeClass;
  badge.textContent = text;
}

function holdReview(){
  setReviewStatus('보류 중', 'badge-gray');
  document.getElementById('reviewFootNote').textContent = '자료 보완 또는 추가 확인이 필요해 보류 상태를 유지합니다.';
  lockReviewActions();
  toast('보류 상태를 유지했어요.');
}

function keepReviewScore(){
  setReviewStatus('확정', 'badge-green');
  document.getElementById('reviewFootNote').textContent = '기존 채점을 유지한 채로 확정됐습니다.';
  lockReviewActions();
  toast('기존 점수로 확정했어요.');
}

function overrideReviewScore(){
  setReviewStatus('확정', 'badge-green');
  document.getElementById('reviewFootNote').textContent = '검토자 의견대로 점수를 수정해 확정됐습니다.';
  document.getElementById('reviewFinalScore').textContent = '2점';
  document.getElementById('reviewFinalNote').hidden = false;
  lockReviewActions();
  toast('2점으로 수정해 확정했어요.');
}

document.getElementById('reviewHoldBtn').addEventListener('click', holdReview);
document.getElementById('reviewKeepBtn').addEventListener('click', keepReviewScore);
document.getElementById('reviewOverrideBtn').addEventListener('click', overrideReviewScore);
