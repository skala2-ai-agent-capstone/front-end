/* ---------- 운영 설정 — 사용자·권한 ---------- */
function toggleMasking(){
  const toggle = document.getElementById('maskingToggle');
  const statusText = document.getElementById('maskingStatusText');
  const isOn = toggle.classList.toggle('off') === false;
  toggle.setAttribute('aria-checked', String(isOn));
  statusText.textContent = isOn ? '사전 정의 규칙 적용 중' : '마스킹 해제됨';
  toast(isOn ? '민감정보 마스킹을 켰어요.' : '민감정보 마스킹을 껐어요.');
}

document.getElementById('maskingToggle').addEventListener('click', toggleMasking);
document.getElementById('maskingToggle').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' '){
    e.preventDefault();
    toggleMasking();
  }
});

document.getElementById('accessScopeSelect').addEventListener('change', e => {
  toast('접근 범위가 "' + e.target.value + '"로 변경됐어요.');
});
