/* ---------- 팀 대시보드 — 집계 승인 · 리포트 내보내기 ---------- */
function approveDashboard(){
  const banner = document.getElementById('dashboardBanner');
  banner.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
    <b>이번 주 집계가 승인됐습니다.</b>&nbsp;이번 주 수치가 팀원에게 공개됩니다.
  `;
  const btn = document.getElementById('dashboardApproveBtn');
  btn.disabled = true;
  btn.textContent = '승인 완료';
  toast('이번 주 집계를 승인했어요.');
}

function exportDashboardReport(){
  const rows = [
    ['항목', '값'],
    ['팀', '영업1팀'],
    ['기간', '10.14 - 10.20'],
    ['수집 건수', '248'],
    ['평가 처리율', '92%'],
    ['미관측 비율', '11%'],
    ['집계 대상', '34명'],
    ['반복 보완점 1위', '결과 검증 누락 (18건)'],
    ['반복 보완점 2위', '가격 정책 대조 오류 (12건)'],
    ['반복 보완점 3위', '요구사항 누락 표시 (9건)'],
  ];
  const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '팀대시보드_2026-10-14_10-20.csv';
  a.click();
  URL.revokeObjectURL(url);
  toast('리포트를 내보냈어요.');
}

document.getElementById('dashboardApproveBtn').addEventListener('click', approveDashboard);
document.getElementById('dashboardExportBtn').addEventListener('click', exportDashboardReport);
