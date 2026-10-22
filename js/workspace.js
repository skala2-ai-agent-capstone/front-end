/* ---------- 업무 데이터 · AI 업무 공간(목록/테이블/채팅) ---------- */
const TASKS = {
  rfp:{
    title:'삼성SDS향 RFP 분석', type:'RFP 요구사항 분석', typeKey:'rfp', status:'작성 중', statusClass:'badge-gray', updated:'10분 전',
    purpose:'목적: SI 제안 사전 분석<br/>예산: 비공개 · 필수 요구 12건',
    refs:['RFP_원문_v2.pdf','제품_서비스_제공범위.pdf'],
    artifactTitle:'요구사항 대응표', artifactVersion:'초안 v3',
    artifactBody:'<p><b>1. 보안</b><br/>ISMS-P 인증 보유 — 충족<br/>전송구간 암호화 — 충족 (TLS 1.3)</p><p><b>2. 배포</b><br/>자체 데이터센터 배포 옵션 — 충족</p>',
    messages:[
      {role:'user', text:'이 RFP에서 보안 요구사항만 뽑아서 정리해줘'},
      {role:'ai', text:'<b>보안 요구사항 3건</b>을 확인했습니다. ① ISMS-P 인증 보유 ② 전송구간 암호화 ③ 접근 로그 6개월 보관'},
      {role:'user', text:'좋아, 이 내용으로 대응표 초안 만들어줘'},
      {role:'ai', text:'요구사항 대응표 초안 v3을 작성했습니다. 오른쪽 패널에서 확인해보세요.'}
    ]
  },
  proposal:{
    title:'LG CNS 맞춤 제안서', type:'고객 맞춤 제안서 작성', typeKey:'proposal', status:'평가 중', statusClass:'badge-amber', updated:'1시간 전',
    purpose:'목적: 챗봇 플랫폼 고도화 제안<br/>예산: 3억 내외 · 필수 요구 8건',
    refs:['고객_요구사항_정리.docx','표준_제안서_템플릿.pptx','확정_견적_LGCNS.pdf'],
    artifactTitle:'최종 제안서', artifactVersion:'최종본',
    artifactBody:'<p><b>1. 제안 개요</b><br/>AI 상담 자동화로 응대시간 40% 단축</p><p><b>2. 가격</b><br/>확정 견적 기준 3.2억 (VAT 별도)</p>',
    messages:[
      {role:'user', text:'지난 번 견적서 기준으로 제안서 가격 섹션 채워줘'},
      {role:'ai', text:'확정 견적 QUOTE-1188 기준으로 가격 섹션을 작성했습니다. 금액은 확정 견적과 동일하게 인용했습니다.'}
    ]
  },
  quote:{
    title:'현대오토에버 견적서', type:'견적서 작성', typeKey:'quote', status:'확인 대기', statusClass:'badge-blue', updated:'어제',
    purpose:'목적: 라이선스 갱신 견적<br/>예산: 1.5억 · 사용자 120명',
    refs:['2026_가격정책_표준.xlsx','할인_승인_기준.pdf'],
    artifactTitle:'견적서', artifactVersion:'승인 요청됨',
    artifactBody:'<p><b>상품</b><br/>Doc AI 120 사용자 · 12개월</p><p><b>금액</b><br/>단가 25,000원 × 120명 × 12개월 = 36,000,000원 (VAT 별도)</p>',
    messages:[
      {role:'user', text:'120명 기준으로 1년 견적 뽑아줘, 할인정책 적용해서'},
      {role:'ai', text:'표준 가격표 2026.2 기준으로 계산했습니다. 합산 할인율이 15%를 넘어 팀장 승인이 필요합니다.'}
    ]
  },
  reply:{
    title:'SK C&C 질의 응답', type:'고객 질의 답변 작성', typeKey:'reply', status:'확정', statusClass:'badge-green', updated:'2일 전',
    purpose:'목적: 기술 문의 회신<br/>관련 업무: 견적서 QUOTE-1172',
    refs:['제품_서비스_제공범위_v4.pdf','확정_견적_SKC&C.pdf'],
    artifactTitle:'회신 메일', artifactVersion:'발송 완료',
    artifactBody:'<p>문의하신 SSO 연동은 SAML 2.0 기반으로 지원되며, OIDC는 현재 지원하지 않습니다.</p><p>가격 문의는 보내드린 확정 견적(QUOTE-1172) 범위 내에서 답변드립니다.</p>',
    messages:[
      {role:'user', text:'OIDC 지원 여부 질문 들어왔는데 답변 초안 써줘'},
      {role:'ai', text:'제품 설명서 v4 §4.1 기준으로는 SAML 2.0만 지원하고 OIDC는 미지원입니다. 이 내용으로 회신 초안을 작성했습니다.'}
    ]
  }
};

function switchTask(id){
  const t = TASKS[id];
  document.getElementById('wsTitle').textContent = t.title;
  document.getElementById('wsSubtitle').textContent = '업무 유형: ' + t.type;
  const badge = document.getElementById('wsStatusBadge');
  badge.className = 'badge ' + t.statusClass;
  badge.textContent = t.status;
  document.getElementById('wsPurpose').innerHTML = t.purpose;
  document.getElementById('wsRefs').innerHTML = t.refs.map(r => `<div class="ref-item">${FILE_ICON}${r}</div>`).join('');
  document.getElementById('artifactTitle').textContent = t.artifactTitle;
  document.getElementById('artifactVersion').textContent = t.artifactVersion;
  document.getElementById('artifactBody').innerHTML = t.artifactBody;
  document.getElementById('chatThread').innerHTML = t.messages.map(m =>
    m.role === 'user'
      ? `<div class="turn user"><div class="user-bubble">${m.text}</div></div>`
      : `<div class="turn assistant"><div class="assistant-avatar">✦</div><div class="assistant-body">${m.text}</div></div>`
  ).join('');
}

function openWorkspace(id){
  switchTask(id);
  goTo('page-workspace');
}

function renderRecentCards(){
  $('#recentCardRow').innerHTML = Object.entries(TASKS).map(([id, t]) => `
    <button class="ws-card" onclick="openWorkspace('${id}')">
      <div class="ws-card-top"><span class="badge ${t.statusClass}">${t.status}</span><span class="mono">${t.updated}</span></div>
      <div class="ws-card-title">${esc(t.title)}</div>
      <div class="ws-card-type">${esc(t.type)}</div>
    </button>
  `).join('');
}

const TYPE_FILTERS = [
  ['all', '전체'], ['rfp', 'RFP 분석'], ['proposal', '제안서'], ['quote', '견적서'], ['reply', '질의응답'],
];
let wsFilter = 'all';

function renderWsFilters(){
  $('#wsFilters').innerHTML = TYPE_FILTERS.map(([key, label]) =>
    `<span class="chip ${wsFilter === key ? 'on' : ''}" data-filter="${key}">${label}</span>`
  ).join('');
}
function setWsFilter(key){
  wsFilter = key;
  renderWsFilters();
  renderWsTable();
}

function initialOf(id, t){
  return {rfp:'RF', proposal:'PR', quote:'QT', reply:'IQ'}[t.typeKey] || id.slice(0, 2).toUpperCase();
}

function renderWsTable(){
  const rows = Object.entries(TASKS).filter(([id, t]) => wsFilter === 'all' || t.typeKey === wsFilter);
  $('#wsTableBody').innerHTML = rows.map(([id, t]) => `
    <tr>
      <td><div class="task-name-cell"><div class="avatar" style="background:var(--gray-soft); color:var(--text-muted);">${initialOf(id, t)}</div><div><div class="task-name">${esc(t.title)}</div><div class="task-sub">${id.toUpperCase()}</div></div></div></td>
      <td>${esc(t.type)}</td>
      <td><span class="badge ${t.statusClass}">${t.status}</span></td>
      <td class="mono">${t.updated}</td>
      <td style="text-align:right;"><button class="btn-open" onclick="openWorkspace('${id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg>열기</button></td>
    </tr>
  `).join('');
}

renderRecentCards();
renderWsFilters();
renderWsTable();
document.getElementById('wsFilters').addEventListener('click', e => {
  const chip = e.target.closest('[data-filter]');
  if (chip) setWsFilter(chip.dataset.filter);
});
