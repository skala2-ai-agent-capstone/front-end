/* ---------- 역할 전환 · 페이지 네비게이션 ---------- */
function setRole(role){
  const isSales = role === 'sales';
  document.querySelectorAll('.admin-only').forEach(el => { el.style.display = isSales ? 'none' : ''; });
  document.querySelectorAll('.sales-only').forEach(el => { el.style.display = isSales ? '' : 'none'; });
  document.getElementById('btnRoleSales').classList.toggle('active', isSales);
  document.getElementById('btnRoleAdmin').classList.toggle('active', !isSales);
  document.getElementById('userAvatar').textContent = isSales ? '강' : '권';
  document.getElementById('userName').textContent = isSales ? '강근혜' : '권하림';
  document.getElementById('userRole').textContent = isSales ? '영업1팀 · 직원' : '영업1팀 · 관리자';
  document.getElementById('taskSub').textContent = isSales
    ? '진행 중인 영업 업무와 자동 평가 상태를 확인하세요.'
    : '전체 업무 목록을 확인하세요. 관리자 업무는 평가·코칭 대상이 아닙니다.';
  goTo(isSales ? 'page-tasklist' : 'page-review');
}

function goTo(id){
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === id));
  const navId = id === 'page-workspace' ? 'page-workspace-list' : id;
  document.querySelectorAll('.nav-item').forEach(p => p.classList.toggle('active', p.dataset.page === navId));
}
document.querySelectorAll('.nav-item').forEach(p => p.addEventListener('click', () => goTo(p.dataset.page)));
