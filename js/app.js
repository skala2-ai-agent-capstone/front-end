function enterApp(role){
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appShell').style.display = 'flex';
    setRole(role);
  }

  /* ---------- 로그인 / 회사 신규가입 폼 ---------- */
  function isValidEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function setFieldError(inputId, errorId, message){
    const input = document.getElementById(inputId);
    const err = document.getElementById(errorId);
    const field = input.closest('.field');
    if (message){
      field.classList.add('invalid');
      err.textContent = message;
      err.classList.add('show');
    } else {
      field.classList.remove('invalid');
      err.textContent = '';
      err.classList.remove('show');
    }
  }

  function handleLoginSubmit(e){
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    let valid = true;

    if (!email){ setFieldError('loginEmail', 'loginEmailError', '이메일을 입력하세요'); valid = false; }
    else if (!isValidEmail(email)){ setFieldError('loginEmail', 'loginEmailError', '올바른 이메일 형식이 아니에요'); valid = false; }
    else setFieldError('loginEmail', 'loginEmailError', '');

    if (!password){ setFieldError('loginPassword', 'loginPasswordError', '비밀번호를 입력하세요'); valid = false; }
    else setFieldError('loginPassword', 'loginPasswordError', '');

    if (!valid) return;

    const btn = document.getElementById('loginSubmitBtn');
    btn.disabled = true;
    btn.classList.add('is-loading');
    btn.textContent = '로그인 중…';
    setTimeout(() => {
      btn.disabled = false;
      btn.classList.remove('is-loading');
      btn.textContent = '로그인';
      enterApp('sales');
    }, 600);
  }

  function handleSignupSubmit(e){
    e.preventDefault();
    const company = document.getElementById('signupCompany').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    let valid = true;

    if (!company){ setFieldError('signupCompany', 'signupCompanyError', '회사명을 입력하세요'); valid = false; }
    else setFieldError('signupCompany', 'signupCompanyError', '');

    if (!email){ setFieldError('signupEmail', 'signupEmailError', '관리자 이메일을 입력하세요'); valid = false; }
    else if (!isValidEmail(email)){ setFieldError('signupEmail', 'signupEmailError', '올바른 이메일 형식이 아니에요'); valid = false; }
    else setFieldError('signupEmail', 'signupEmailError', '');

    if (!password){ setFieldError('signupPassword', 'signupPasswordError', '비밀번호를 입력하세요'); valid = false; }
    else if (password.length < 8){ setFieldError('signupPassword', 'signupPasswordError', '8자 이상 입력하세요'); valid = false; }
    else setFieldError('signupPassword', 'signupPasswordError', '');

    if (!valid) return;

    const btn = document.getElementById('signupSubmitBtn');
    btn.disabled = true;
    btn.classList.add('is-loading');
    btn.textContent = '생성 중…';
    setTimeout(() => {
      const escaped = email.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
      document.getElementById('auth-signup').innerHTML =
        '<div class="auth-success">'
        + '<b>인증 메일을 보냈어요</b>'
        + '<p>' + escaped + '로 전송된 링크를 눌러 회사 워크스페이스 생성을 완료하세요.</p>'
        + '</div>';
    }, 700);
  }

  function handleForgotPassword(){
    const email = document.getElementById('loginEmail').value.trim();
    const notice = document.getElementById('forgotPasswordNotice');
    if (!email || !isValidEmail(email)){
      setFieldError('loginEmail', 'loginEmailError', '비밀번호 재설정을 위해 이메일을 먼저 입력하세요');
      notice.classList.remove('show');
      return;
    }
    notice.textContent = email + '로 재설정 링크를 보냈어요';
    notice.classList.add('show');
  }

  document.getElementById('loginForm').addEventListener('submit', handleLoginSubmit);
  document.getElementById('signupForm').addEventListener('submit', handleSignupSubmit);
  document.getElementById('forgotPasswordBtn').addEventListener('click', handleForgotPassword);

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

  document.querySelectorAll('.auth-tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.auth-panel').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById('auth-' + t.dataset.auth).classList.add('active');
  }));

  const FILE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>';

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

  document.querySelectorAll('.utab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.utab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.settings-panel').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById(t.dataset.tab).classList.add('active');
  }));

  function openSettingsTab(id){
    document.querySelectorAll('.utab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.toggle('active', p.id === id));
  }
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-go]');
    if (go) openSettingsTab(go.dataset.go);
  });

  /* ======================================================================
     운영 설정 · 자료 업로드 → AI 에이전트 기준 설계 → 관리자 검토·승인 (목업 상태)
     ====================================================================== */
  const $ = s => document.querySelector(s);
  const clone = o => JSON.parse(JSON.stringify(o));
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pad = n => String(n).padStart(2, '0');
  const nowStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const ME = '권하림';

  const ICON = {
    ai:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
    doc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    chev:'<svg class="crit-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>',
  };

  const TYPE_LABEL = {product:'제품 설명서', price:'가격표', policy:'내규·정책'};
  const WORK_TYPES = [
    {key:'rfp',      code:'RF', name:'RFP 요구사항 분석',   artifact:'요구사항 대응표'},
    {key:'proposal', code:'PR', name:'고객 맞춤 제안서 작성', artifact:'최종 제안서'},
    {key:'quote',    code:'QT', name:'견적서 작성',         artifact:'견적서'},
    {key:'reply',    code:'IQ', name:'고객 질의 답변 작성',  artifact:'회신 메일'},
  ];
  const wtName = k => WORK_TYPES.find(w => w.key === k).name;
  const ITEMS = ['문제 정의', '지시 품질', '결과 검증', '보안 준수', '결과물 품질'];

  const ITEM_BASE = {
    '문제 정의': {dim:'직원 행동',
      levels:{2:'필수 기재 사항을 모두 기재했다. 고객이 제시하지 않은 사항을 "고객 미제시"로 표시한 것도 기재로 본다.', 1:'필수 기재 사항 중 1~2개가 빠졌다.', 0:'필수 기재 사항이 3개 이상 빠졌거나 등록 내용이 비어 있다.'},
      unobserved:'업무 등록 기록 자체가 수집되지 않은 경우. 등록은 되었으나 비어 있으면 미관측이 아니라 0점이다.',
      review:'등록된 조건과 고객 제출 자료(RFP·질문 원문 등)가 서로 다를 때.'},
    '지시 품질': {dim:'직원 행동',
      levels:{2:'평가 질문의 전달 요소(조건·자료·형식·제약)를 대화 전체에서 모두 전달했다.', 1:'전달 요소 중 일부가 빠졌다.', 0:'조건·자료 없이 결과물만 요청했다.'},
      unobserved:'해당 업무의 AI 대화 기록 자체가 수집되지 않은 경우.',
      review:'대화에서 전달한 조건이 업무 등록 조건과 충돌할 때.'},
    '결과 검증': {dim:'직원 행동',
      levels:{2:'참조 자료와 대조해 오류 지적, 직접 수정, 근거 연결 중 하나 이상이 확인된다.', 1:'일부 항목만 대조했거나 확인된 오류 일부가 남았다.', 0:'AI 결과에 오류가 있었으나 대조·수정 기록이 없다.'},
      unobserved:'AI 초안에 오류가 없었고 대조·수정 기록도 없어 검증 대상이 드러나지 않은 경우.',
      review:'참조 자료 버전 간 내용이 달라 어느 쪽이 맞는지 판단할 수 없을 때.'},
    '보안 준수': {dim:'정보 처리',
      levels:{2:'관측 범위에서 정책 위반이 없다.', 0:'입력 금지·노출 금지 정보 위반이 1건 이상 있다.'},
      unobserved:'정책 검사 결과가 없거나 해당 입력·산출물이 수집 범위 밖인 경우.',
      review:'탐지된 정보가 공개 승인된 레퍼런스인지 등 등급 판단이 필요한 경우.'},
    '결과물 품질': {dim:'산출물',
      levels:{2:'필수 기재 사항 누락과 사실 오류가 없다.', 1:'필수 기재 사항 누락 또는 사실 오류가 1~2건 있다.', 0:'누락·사실 오류가 3건 이상이거나 핵심 요구에 대응하지 않았다.'},
      unobserved:'최종본이 업무 공간에 저장되지 않은 경우.',
      review:'고객 자료와 내부 참조 자료가 상충하거나, 참조 자료가 최신 버전인지 확인할 수 없을 때.'},
  };

  const FOCUS = {
    rfp: [
      'RFP 문서명·버전, 제출 기한, 평가 방식(알려진 경우)과 고객의 목적·필수 요구사항이 업무 등록에 기재되었는가. 예산은 RFP에 제시된 경우에만 기재 대상이다.',
      'RFP 원문과 제품 설명서를 지정하고, 추출 기준(전수 추출, 필수/선택 구분, 대응 수준, 원문 위치 기재)과 대응표 형식을 AI에 전달했는가.',
      'AI가 추출한 요구사항을 RFP 원문과 대조해 누락·중복·원문 위치·필수/선택 구분 오류를 지적하거나 직접 수정한 기록이 있는가. 대응 가능 여부를 제품 근거와 대조했는가.',
      '대외비인 RFP를 해당 업무 공간 안에서만 입력했는가, 고객 담당자 연락처를 비식별 처리했는가, 기밀 정보(원가·타 고객 조건·미발표 로드맵)를 입력하거나 대응표에 노출하지 않았는가.',
      '대응표가 RFP 요구사항을 누락·중복 없이 담고, 항목마다 요구사항 번호·원문 위치·필수/선택 구분·대응 수준과 근거를 기재했는가. 불가 항목은 사유나 대안을 적었는가.',
    ],
    proposal: [
      '고객의 목적·규모(사용자 수 등)·필수 요구사항·제약 조건이 업무 등록에 기재되었는가. RFP가 있으면 상위 RFP 분석 건의 대응표가 연결되었는가.',
      '고객 조건, 근거로 쓸 대응표·제품 설명서와 버전, 제안서 구성, 제약(가격은 확정 견적 인용, 별표 3 금지 표현, 타 고객 정보 제외)을 AI에 전달했는가.',
      '기능·성능·효과 주장을 참조 자료와 대조해 근거를 연결했는가, 기존 자료 재사용 시 타 고객명·이전 가격·구버전 사양을 제거했는가, 과장 표현을 수정했는가.',
      '타 고객사의 정보·계약 조건, 원가·마진, 할인 승인 기준, 미발표 로드맵을 AI에 입력하거나 제안서에 노출하지 않았는가.',
      '최종 제안서가 필수 요구사항에 대응하고 대응표와 일치하며, 주장마다 근거가 있고, 가격이 확정 견적의 견적 번호·금액과 일치하며, 별표 3의 금지 표현이 없는가.',
    ],
    quote: [
      '견적 대상 상품, 수량(사용자 수·라이선스 수), 계약 기간, 고객 요청 조건(결제 조건·SLA 등)과 예산·가격 조건이 업무 등록에 기재되었는가.',
      '적용할 표준 가격표 버전과 할인 정책, 상품·수량·기간·요청 조건, 견적서 기재 항목(단가·수량·기간·할인율·소계·합계·부가세·유효 기간)을 AI에 전달했는가.',
      'AI가 산출한 금액을 표준 가격표·할인 정책으로 다시 계산해 단가·수량·기간·할인율 오류를 바로잡았는가, 합산 할인율과 예외 조건의 승인 필요 여부를 별표 2로 확인했는가.',
      '할인 승인 한도·승인 단계 등 내부 가격 기준, 원가·마진, 타 고객 할인율을 AI에 입력하거나 고객용 견적서에 기재하지 않았는가.',
      '견적 금액이 가격표·할인 정책 기준 계산값과 일치하고, 가격표 버전·단가·수량·기간·할인율·소계·합계(부가세 별도)·유효 기간 30일이 기재되었으며, 승인 필요 항목이 승인 요청에 표시되었는가.',
    ],
    reply: [
      '고객 질문 원문이 업무 등록에 기재되고, 질문이 여러 개면 항목별로 나뉘어 기재되었는가. 관련 제안·견적 건이 있으면 연결되었는가.',
      '질문 항목, 근거로 쓸 현재 버전 제품 설명서·확정 견적, 답변 범위와 형식, 제약(미확정 사항 표기, 별표 3 금지 표현)을 AI에 전달했는가.',
      'AI 답변을 현재 버전 참조 자료와 대조해 틀린 내용을 고쳤는가, 확인되지 않은 내용을 미확정 표현으로 바꿨는가, 과장 표현을 수정했는가.',
      '미발표 로드맵, 내부 할인 기준, 타 고객 사례의 식별 정보를 회신에 노출하지 않았는가, 고객 담당자 연락처를 비식별 처리했는가.',
      '모든 질문 항목에 답변했는가, 답변이 현재 자료와 일치하는가, 미확정 사항에 회신 예정 시점을 적었는가, 가격 답변이 확정 견적 범위 안인가.',
    ],
  };

  const GL = 'SALES-AI-GL-001', PRICE = 'PRICE-2026.2', PROD = 'PROD-SCOPE';
  const EVID = {
    rfp:      [[[GL,'ART-11'],[GL,'ART-17']], [[GL,'ART-12'],[GL,'ART-17']], [[GL,'ART-13'],[PROD,'§1.2']], [[GL,'ART-06'],[GL,'ART-07']], [[GL,'ART-17']]],
    proposal: [[[GL,'ART-11']], [[GL,'ART-12']], [[GL,'ART-18'],[PROD,'§8.1']], [[GL,'ART-06'],[GL,'ART-09']], [[GL,'ART-18'],[GL,'APX-3']]],
    quote:    [[[GL,'ART-11'],[GL,'ART-19']], [[GL,'ART-12'],[PRICE,'L2']], [[GL,'ART-19'],[PRICE,'L2'],[GL,'APX-2']], [[GL,'ART-09']], [[GL,'ART-19'],[PRICE,'L1']]],
    reply:    [[[GL,'ART-11']], [[GL,'ART-12'],[GL,'ART-21']], [[GL,'ART-13'],[PROD,'§4.1']], [[GL,'ART-06'],[GL,'ART-09']], [[GL,'ART-21'],[PRICE,'L2'],[GL,'APX-3']]],
  };

  const SCOPE_TERMS = ['단가 계산', '금액 계산', '금액 산출', '금액 재계산', '총액 계산', '할인율 계산', '할인율을 적용'];
  const SCOPE_MSG = {
    rfp:'RFP 분석 업무에 견적 계산 표현 — 예산 조건 추출만 대상인지 확인',
    proposal:'제안서 업무에 금액 산출 표현 — 확정 견적 인용 여부만 확인(제18조④)',
    reply:'질의 답변 업무에 금액 계산 표현 — 확정 견적 범위 내 답변인지만 확인(제21조⑤)',
  };

  const state = {
    docs: [
      {id:PROD, file:'제품_서비스_제공범위_v4.pdf', type:'product', ver:'v4', status:'current', indexed:'2026-10-20 09:14', rubric:'linked',
        sections:[['§1.2','제공 방식: 클라우드(SaaS) 전용, 온프레미스 설치 미지원'], ['§4.1','인증: SAML 2.0 기반 SSO 지원, OIDC 미지원'], ['§8.1','SLA: 월 가용성 99.9%, 장애 접수 후 4시간 이내 1차 응답']]},
      {id:PRICE, file:'2026_가격정책_표준.xlsx', type:'price', ver:'2026.2', status:'current', indexed:'2026-10-20 09:14', rubric:'linked',
        sections:[['L1','P-100 스마트 문서 AI (Doc AI): 25,000원 / 사용자·월'], ['L2','P-200 AI 컨택센터 (Contact AI): 90,000원 / 상담석·월'], ['L3','P-300 데이터 분석 플랫폼 (Insight Hub): 3,000,000원 / 테넌트·월']]},
      {id:GL, file:'영업_AI활용지침_v1.0.pdf', type:'policy', ver:'v1.0', status:'current', indexed:'2026-09-01 10:02', rubric:'linked',
        sections:[
          ['ART-06','담당자는 승인 AI 도구를 포함한 어떠한 AI 도구에도 다음 각 호의 정보를 입력하지 않는다.'],
          ['ART-07','고객 담당자의 휴대전화 번호, 개인 이메일 주소는 AI에 입력하기 전에 삭제한다.'],
          ['ART-09','대외 산출물에는 다음 각 호의 정보를 포함하지 않는다.'],
          ['ART-11','담당자는 업무 건을 생성할 때 다음 각 호의 사항을 기재한다.'],
          ['ART-12','담당자는 AI에 작업을 요청할 때 다음 각 호의 내용을 전달한다.'],
          ['ART-13','담당자는 AI가 생성한 내용 중 다음 각 호의 사항을 참조 자료와 대조한다.'],
          ['ART-17','요구사항 대응표에는 RFP의 요구사항을 빠짐없이 옮기고, 항목마다 다음 사항을 적는다.'],
          ['ART-18','제안서의 성능·효과·기능에 관한 주장은 참조 자료로 뒷받침되어야 하며, 근거 자료를 업무 공간에 연결한다.'],
          ['ART-19','AI가 산출한 금액은 표준 가격표와 할인 정책을 기준으로 다시 계산하여 확인한다.'],
          ['ART-21','답변의 근거는 현재 버전의 제품 설명서, 표준 가격표, 확정 견적 등 참조 자료로 한다.'],
          ['APX-2','별표 2 — 표준가 대비 합산 할인율에 따른 할인 승인 단계'],
          ['APX-3','별표 3 — 근거 없는 보장·비교 등 금지 표현과 권장 표현'],
        ]},
    ],
    versions: [
      {id:'v1.2', status:'archived', by:'권하림', date:'2026-08-11 10:30'},
      {id:'v1.3', status:'current',  by:'권하림', date:'2026-09-02 15:20'},
    ],
    rubrics: {},
    draft: null,
    job: null,
    view: 'v1.3', wt: 'quote', open: null, work: null, dirty: false,
    history: [
      {t:'2026-09-02 15:20', who:'권하림', text:'v1.3 승인 · 보안 준수를 0/2점으로 이원화'},
      {t:'2026-08-11 10:30', who:'권하림', text:'v1.2 승인 · 4개 업무 유형 기준 최초 적용'},
    ],
  };

  function sectionOf(docId, sec){
    const d = state.docs.find(x => x.id === docId);
    const s = d && d.sections.find(x => x[0] === sec);
    return {doc:docId, ver:d ? d.ver : '', sec, quote:s ? s[1] : ''};
  }
  function buildRubric(securityLevels){
    const data = {};
    WORK_TYPES.forEach(wt => {
      data[wt.key] = ITEMS.map((item, i) => {
        const b = ITEM_BASE[item];
        return {id:`${wt.code}-0${i+1}`, title:item, dim:b.dim, focus:FOCUS[wt.key][i],
          levels:clone(item === '보안 준수' && securityLevels ? securityLevels : b.levels),
          unobserved:b.unobserved, review:b.review,
          evidence:EVID[wt.key][i].map(([d, s]) => sectionOf(d, s))};
      });
    });
    return data;
  }
  state.rubrics['v1.3'] = buildRubric();
  state.rubrics['v1.2'] = buildRubric({2:'관측 범위에서 정책 위반이 없다.', 1:'경미한 위반(연락처 비식별 누락 등)이 1건 있다.', 0:'입력 금지·노출 금지 정보 위반이 있다.'});

  const currentVer = () => state.versions.find(v => v.status === 'current');
  const nextId = id => { const [maj, min] = id.slice(1).split('.').map(Number); return `v${maj}.${min + 1}`; };
  const isDraftView = () => !!state.draft && state.view === state.draft.id;
  const viewData = () => isDraftView() ? state.draft.data : state.rubrics[state.view];
  const findCrit = (key, data = viewData()) => { const [wt, item] = key.split('|'); return data[wt].find(c => c.title === item); };
  const scoresOf = c => Object.keys(c.levels).sort((a, b) => b - a);
  const norm = c => JSON.stringify({...c, evidence:c.evidence.map(({isNew, ...e}) => e)});

  let toastTimer;
  function toast(msg){
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  const STEPS = [
    ['자료 색인', '대기 중'],
    ['이전 버전 대조', '대기 중'],
    ['영향 범위 분석', '대기 중'],
    ['평가 기준 설계', '대기 중'],
    ['범위·형식 검사', '대기 중'],
    ['초안 저장', '대기 중'],
  ];
  const STEP_MS = [900, 800, 1000, 1500, 800, 600];

  function detectType(file){
    const sel = $('#docType').value;
    if (sel !== 'auto') return sel;
    if (/가격|단가|요금|price/i.test(file)) return 'price';
    if (/지침|정책|내규|규정|policy|guide/i.test(file)) return 'policy';
    return 'product';
  }
  function detectVer(file){
    const m = file.match(/\d{4}\.\d+/) || file.match(/v\d+(\.\d+)*/i);
    return m ? m[0] : 'v1.0';
  }

  function planChanges(type, doc, prev){
    if (type === 'price') return [
      {key:'quote|지시 품질', focusAdd:` 적용 가격표는 현행 ${doc.ver} 버전으로 지정해야 하며, 이전 버전을 지정하면 전달하지 않은 것으로 본다.`,
        reason:`가격표 버전을 ${doc.ver}로 갱신`},
      {key:'quote|결과 검증', focusAdd:` 특히 ${doc.highlight}처럼 바뀐 단가를 이전 단가로 산출한 오류를 바로잡았는지 본다.`,
        levelAdd:{0:' 이전 버전 단가를 그대로 사용한 경우를 포함한다.'},
        reason:`단가 변경 구간(${doc.hsec}) 감지 · 0점 조건 구체화`},
      {key:'quote|결과물 품질', focusAdd:` 견적서에 기재한 가격표 버전이 ${doc.ver} 기준과 일치해야 한다.`,
        reason:`기재 기준 가격표 버전을 ${doc.ver}로 갱신`},
      {key:'reply|결과물 품질', focusAdd:` 가격 답변의 단가 계산이 ${doc.ver} 가격표와 일치하는가.`,
        reason:`근거 가격표를 ${doc.ver}로 갱신`},
    ];
    if (type === 'product') return [
      {key:'rfp|결과 검증', focusAdd:` 대응 가능 여부는 현행 제품 설명서(${doc.ver}) 사양과 대조해야 한다.`,
        reason:`대조 기준을 제품 설명서 ${doc.ver}로 갱신`},
      {key:'proposal|결과 검증', focusAdd:' 이전 버전 사양을 인용한 기능·성능 주장은 오류로 본다.',
        levelAdd:{0:' 이전 버전 사양을 그대로 인용한 경우를 포함한다.'},
        reason:`제품 사양 변경(${doc.highlight}) 반영`},
      {key:'reply|결과 검증', focusAdd:` 제품 사양 답변은 제품 설명서 ${doc.ver} 버전과 대조한다.`,
        reason:`대조 기준을 제품 설명서 ${doc.ver}로 갱신`},
    ];
    return WORK_TYPES.map(wt => ({key:`${wt.key}|보안 준수`,
      focusAdd:` 정보 등급 판단은 ${doc.file.replace(/\.[^.]+$/, '')}(${doc.ver}) 기준을 함께 적용한다.`,
      reason:`보안 준수 근거를 내규 ${doc.ver}로 갱신`}));
  }

  function startUpload(file, isSample){
    if (state.job && !state.job.done){ toast('진행 중인 기준 설계가 끝난 뒤 다시 올려주세요'); return; }
    const type = isSample ? 'price' : detectType(file);
    const ver = detectVer(file);
    const prev = state.docs.find(d => d.type === type && d.status === 'current');
    let id = `${{product:'PROD', price:'PRICE', policy:'POLICY'}[type]}-${ver}`;
    if (state.docs.some(d => d.id === id)) id += `-${state.docs.length + 1}`;
    const doc = {id, file, type, ver, status:'indexing', indexed:'—', rubric:'none', sections:[], highlight:'', hsec:''};
    if (isSample){
      doc.sections = [['L1','P-100 스마트 문서 AI (Doc AI): 25,000원 / 사용자·월'], ['L2','P-200 AI 컨택센터 (Contact AI): 95,000원 / 상담석·월'],
        ['L3','P-300 데이터 분석 플랫폼 (Insight Hub): 3,000,000원 / 테넌트·월'], ['L4','S-10 전용 기술지원: 500,000원 / 월'], ['L5','S-20 온보딩 교육: 2,000,000원 / 회']];
      doc.hsec = 'L2';
      doc.highlight = 'P-200 Contact AI 단가 90,000 → 95,000원';
      $('#sampleUpload').disabled = true;
    } else if (prev){
      doc.sections = clone(prev.sections);
      doc.hsec = prev.sections[0][0];
      doc.highlight = `${doc.hsec} 구간 내용 변경`;
    } else {
      doc.sections = [['§1', `${file.replace(/\.[^.]+$/, '')} 1절`]];
      doc.hsec = '§1';
      doc.highlight = '신규 자료';
    }
    state.docs.unshift(doc);
    state.job = {doc, prev, plan:planChanges(type, doc, prev), step:0, done:false, details:[]};
    renderDocs();
    runStep();
  }

  function stepDetail(job, i){
    const {doc, prev, plan} = job;
    const keys = new Set(plan.map(p => p.key));
    let swaps = 0;
    if (prev){
      const data = state.draft ? state.draft.data : state.rubrics[currentVer().id];
      WORK_TYPES.forEach(wt => data[wt.key].forEach(c => {
        const n = c.evidence.filter(e => e.doc === prev.id).length;
        if (n){ swaps += n; keys.add(`${wt.key}|${c.title}`); }
      }));
    }
    const wts = [...new Set([...keys].map(k => k.split('|')[0]))].map(wtName);
    const warnN = plan.filter(p => SCOPE_MSG[p.key.split('|')[0]] &&
      SCOPE_TERMS.some(t => (p.focusAdd + Object.values(p.levelAdd || {}).join('')).includes(t))).length;
    const baseLabel = state.draft ? `${state.draft.id} 초안` : currentVer().id;
    return [
      `${doc.sections.length > 3 ? doc.sections.length : 6 + doc.file.length % 12}개 구간으로 분할 · 검색 색인 완료`,
      prev ? `${prev.file}(${prev.ver}) 대비 변경 감지 — ${doc.highlight}` : '같은 유형의 기존 자료 없음 — 신규 근거로 등록',
      `${wts.join(' · ')} — ${keys.size}개 평가 항목이 이 자료를 근거로 사용`,
      `${baseLabel} 대비 ${keys.size}개 항목 수정 · 근거 인용 ${swaps}건 교체`,
      warnN ? `점수 형식·근거 ID 검증 통과 · 업무 범위 검토 경고 ${warnN}건` : '점수 형식·근거 ID·업무 범위 검사 통과',
      `평가 기준 ${state.draft ? state.draft.id : nextId(currentVer().id)} 초안으로 저장 · 관리자 승인 대기`,
    ][i];
  }

  function runStep(){
    const job = state.job;
    renderAgent();
    setTimeout(() => {
      job.details[job.step] = stepDetail(job, job.step);
      if (job.step === 0){
        job.doc.status = 'current';
        job.doc.indexed = nowStr();
        if (job.prev) job.prev.status = 'old';
        renderDocs();
      }
      if (job.step === STEPS.length - 1){
        applyDesign(job);
        job.done = true;
        renderAll();
        toast(`평가 기준 ${job.draftId} 초안이 저장되었습니다`);
        return;
      }
      job.step++;
      runStep();
    }, STEP_MS[job.step]);
  }

  function scanWarnings(key){
    const d = state.draft;
    d.warnings = d.warnings.filter(w => w.key !== key);
    const wt = key.split('|')[0];
    if (!SCOPE_MSG[wt]) return;
    const c = findCrit(key, d.data);
    const fields = [['평가 질문', c.focus], ...scoresOf(c).map(s => [`${s}점 조건`, c.levels[s]])];
    fields.forEach(([field, text]) => {
      const term = SCOPE_TERMS.find(t => text.includes(t));
      if (!term) return;
      const i = text.indexOf(term);
      d.warnings.push({key, field, term, excerpt:text.slice(Math.max(0, i - 30), i + term.length + 20), message:SCOPE_MSG[wt], ack:false});
    });
  }

  function newDraft(by){
    const cur = currentVer();
    return {id:nextId(cur.id), base:cur.id, by, createdAt:nowStr(), data:clone(state.rubrics[cur.id]), changes:{}, warnings:[], sources:[]};
  }

  function applyDesign(job){
    if (!state.draft) state.draft = newDraft('AI 에이전트');
    const d = state.draft, {doc, prev} = job;
    d.sources.push(doc.file);
    const touched = new Set();
    const touch = (key, reason) => {
      const c = findCrit(key, d.data);
      if (!d.changes[key]) d.changes[key] = {by:'ai', reasons:[], before:clone(c)};
      d.changes[key].reasons.push(reason);
      touched.add(key);
      return c;
    };
    job.plan.forEach(p => {
      const c = touch(p.key, p.reason);
      c.focus += p.focusAdd;
      Object.entries(p.levelAdd || {}).forEach(([s, t]) => { if (s in c.levels) c.levels[s] += t; });
      if (!prev) c.evidence.push({...sectionOf(doc.id, doc.hsec), isNew:true});
    });
    if (prev) WORK_TYPES.forEach(wt => d.data[wt.key].forEach(c => {
      const hits = c.evidence.filter(e => e.doc === prev.id);
      if (!hits.length) return;
      touch(`${wt.key}|${c.title}`, `근거 인용 교체: ${prev.id} → ${doc.id} (${hits.map(e => e.sec).join(', ')})`);
      c.evidence = c.evidence.map(e => e.doc === prev.id ? {...sectionOf(doc.id, e.sec), isNew:true} : e);
    }));
    touched.forEach(scanWarnings);
    doc.rubric = 'draft';
    job.draftId = d.id;
    job.changedCount = touched.size;
    state.view = d.id;
    state.wt = [...touched][0].split('|')[0];
    state.open = null; state.work = null; state.dirty = false;
    state.history.unshift({t:nowStr(), who:'AI 에이전트', text:`${doc.file} 반영 · ${d.id} 초안 저장 (${touched.size}개 항목 수정)`});
  }

  function renderDocs(){
    const cur = currentVer().id;
    $('#docRows').innerHTML = state.docs.map(d => {
      const st = d.status === 'indexing' ? '<span class="badge badge-amber">색인 중</span>'
        : d.status === 'current' ? '<span class="badge badge-green">현행</span>' : '<span class="badge badge-gray">이전 버전</span>';
      const rb = d.rubric === 'draft' && state.draft ? `<button class="badge badge-ai" data-go="tab-c" style="border:none;">${state.draft.id} 초안 검토 →</button>`
        : d.rubric === 'linked' ? `<span class="mono">${cur} 근거</span>`
        : d.rubric === 'excluded' ? '<span class="task-sub">근거 제외</span>'
        : d.status === 'indexing' ? '<span class="task-sub">설계 대기</span>' : '<span class="task-sub">미반영</span>';
      return `<tr><td><div class="task-name">${esc(d.file)}</div><div class="task-sub">${esc(d.id)}</div></td><td>${TYPE_LABEL[d.type]}</td>`
        + `<td class="mono">${esc(d.ver)}</td><td>${st}</td><td class="mono">${d.indexed}</td><td>${rb}</td></tr>`;
    }).join('');
    $('#docCount').textContent = `${state.docs.length}건 · 현행 ${state.docs.filter(d => d.status === 'current').length}건`;
  }

  function renderAgent(){
    const job = state.job;
    const running = job && !job.done;
    const head = `<div class="agent-title"><div class="agent-icon">${ICON.ai}</div><b>평가 기준 설계 에이전트</b>`
      + (running ? '<span class="badge badge-amber" style="margin-left:auto;">설계 중</span>' : job ? '<span class="badge badge-green" style="margin-left:auto;">초안 저장됨</span>' : '')
      + '</div>';
    const file = job
      ? `<div class="agent-file">${ICON.doc}<span class="name">${esc(job.doc.file)}</span><span class="chip chip-xs">${TYPE_LABEL[job.doc.type]}</span></div>`
      : '<div class="agent-sub">자료 업로드 시 자동 실행돼요</div>';
    const steps = STEPS.map(([name, desc], i) => {
      const st = !job ? 'wait' : job.done || i < job.step ? 'done' : i === job.step ? 'run' : 'wait';
      return `<div class="step ${st}"><span class="step-ico"></span><div><b>${name}</b><small>${esc(job && job.details[i] || desc)}</small></div></div>`;
    }).join('');
    const foot = job && job.done
      ? `<div class="agent-result"><b>${job.draftId} 초안 저장 완료</b> · ${job.changedCount}개 항목 수정`
        + `<button class="btn btn-primary btn-sm" data-go="tab-c" style="width:100%; justify-content:center; margin-top:10px;">초안 검토하기 →</button></div>`
      : `<div class="agent-note">승인 전까지는 적용되지 않아요</div>`;
    $('#agentCard').innerHTML = head + file + `<div>${steps}</div>` + foot;
  }

  function renderToolbar(){
    const d = state.draft, draftView = isDraftView();
    const opts = [];
    if (d) opts.push([d.id, `${d.id} 초안 · 승인 대기`]);
    [...state.versions].reverse().forEach(v => opts.push([v.id, `${v.id} · ${v.status === 'current' ? '현재 적용' : '이전 버전'}`]));
    $('#rbVersion').innerHTML = opts.map(([v, l]) => `<option value="${v}" ${v === state.view ? 'selected' : ''}>${l}</option>`).join('');
    const ver = state.versions.find(v => v.id === state.view);
    $('#rbStatus').innerHTML = draftView ? '<span class="badge badge-amber">승인 대기</span>'
      : ver.status === 'current' ? '<span class="badge badge-green">적용 중</span>' : '<span class="badge badge-gray">읽기 전용</span>';
    $('#rbMeta').textContent = draftView
      ? `기반 ${d.base} · 작성 ${d.by} · ${d.createdAt} · 변경 ${Object.keys(d.changes).length}개 항목`
      : `승인 ${ver.by} · ${ver.date}`;
    $('#rbActions').innerHTML = draftView
      ? '<button class="btn" data-rb="discard">초안 폐기</button><button class="btn btn-primary" data-rb="approve">승인 후 적용</button>'
      : ver.status !== 'current' ? ''
      : d ? `<button class="btn" data-rb="toDraft">${d.id} 초안 보기</button>`
      : '<button class="btn" data-rb="fork">수정 초안 만들기</button>';
  }

  function renderBanner(){
    const d = state.draft;
    if (!isDraftView()){
      $('#rbBanner').innerHTML = state.view === currentVer().id && !d ? ''
        : `<div class="ai-banner" style="background:var(--gray-soft); border-color:var(--border); color:var(--text-muted);">${ICON.doc}<div>${
          state.view === currentVer().id ? `적용 중 · ${d.id} 초안 승인 대기` : '읽기 전용 · 이전 버전'}</div></div>`;
      return;
    }
    const n = Object.keys(d.changes).length, w = d.warnings.filter(x => !x.ack).length;
    $('#rbBanner').innerHTML = `<div class="ai-banner">${ICON.ai}<div>` + (d.sources.length
      ? `<b>AI 초안</b> · ${d.sources.map(esc).join(', ')} 반영 · ${n}개 항목 수정${w ? ` · <b style="color:var(--amber);">경고 ${w}건</b>` : ''}`
      : `<b>관리자 수정 초안</b> · ${d.base} 기반 · ${n}개 항목 수정`) + '</div></div>';
  }

  function renderWtList(){
    const d = state.draft, draftView = isDraftView();
    $('#wtList').innerHTML = '<div class="field-label" style="padding:6px 10px 2px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.03em; color:var(--text-faint);">업무 유형</div>' + WORK_TYPES.map(wt => {
      const n = draftView ? ITEMS.filter(i => d.changes[`${wt.key}|${i}`]).length : 0;
      return `<button class="wt-item ${wt.key === state.wt ? 'on' : ''}" data-wt="${wt.key}"><span>${wt.name}</span>${n ? `<span class="wt-count">변경 ${n}</span>` : ''}</button>`;
    }).join('');
  }

  function diffText(o, n){
    if (o && n.startsWith(o)) return `${esc(o)}<span class="diff-add">${esc(n.slice(o.length))}</span>`;
    if (n && o.startsWith(n)) return `${esc(n)}<span class="diff-del">${esc(o.slice(n.length))}</span>`;
    return `<span class="diff-del">${esc(o)}</span><br/><span class="diff-add">${esc(n)}</span>`;
  }

  function changeBox(ch, saved){
    const b = ch.before, lines = [];
    const add = (lbl, o = '', n = '') => { if (o !== n) lines.push(`<div class="chg-line"><span class="lbl">${lbl}</span>${diffText(o, n)}</div>`); };
    add('평가 질문', b.focus, saved.focus);
    ['2', '1', '0'].forEach(s => add(`${s}점 조건`, b.levels[s], saved.levels[s]));
    add('미관측 조건', b.unobserved, saved.unobserved);
    add('검토 필요 조건', b.review, saved.review);
    const k = e => `${e.doc} · ${e.sec}`;
    const bk = b.evidence.map(k), nk = saved.evidence.map(k);
    const ev = [...bk.filter(x => !nk.includes(x)).map(x => `<span class="diff-del">${esc(x)}</span>`),
                ...nk.filter(x => !bk.includes(x)).map(x => `<span class="diff-add">${esc(x)}</span>`)];
    if (ev.length) lines.push(`<div class="chg-line"><span class="lbl">근거 자료</span>${ev.join(' ')}</div>`);
    const ai = ch.by === 'ai';
    return `<div class="change-box ${ai ? '' : 'admin'}"><b>${ai ? 'AI 변경 사유' : '관리자 수정'}</b>${ai && ch.edited ? ' · 이후 직접 수정함' : ''}`
      + `<ul>${ch.reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>`
      + `<details><summary>변경 내용 보기</summary>${lines.join('') || '<div class="chg-line">내용 변경 없음</div>'}</details></div>`;
  }

  function evPicker(c){
    const opts = state.docs.filter(d => d.status === 'current').flatMap(doc => doc.sections
      .filter(([s]) => !c.evidence.some(e => e.doc === doc.id && e.sec === s))
      .map(([s, q]) => `<option value="${esc(doc.id)}|${esc(s)}">${esc(doc.id)} · ${esc(s)} — ${esc(q.length > 32 ? q.slice(0, 32) + '…' : q)}</option>`));
    return `<select class="ev-add" data-ev-add><option value="">+ 근거 인용 연결…</option>${opts.join('')}</select>`;
  }

  function critCard(saved, wtKey){
    const key = `${wtKey}|${saved.title}`, open = state.open === key, d = state.draft, draftView = isDraftView();
    const c = open && state.work ? state.work : saved;
    const ch = draftView && d.changes[key];
    const warns = draftView ? d.warnings.filter(w => w.key === key) : [];
    const scores = scoresOf(c);
    const tags = `<span class="chip chip-xs">${c.dim}</span><span class="mono" style="font-size:11.5px;">${[...scores].reverse().join('·')}점</span>`
      + (ch ? (ch.by === 'ai' && !ch.edited ? '<span class="badge badge-ai">AI 제안</span>' : '<span class="badge badge-blue">관리자 수정</span>') : '')
      + (warns.some(w => !w.ack) ? '<span class="badge badge-amber">검토 경고</span>' : '');
    let html = `<div class="card crit ${open ? 'open' : ''}" data-key="${esc(key)}">`
      + `<div class="crit-head"><span class="mono" style="flex:none; width:46px;">${c.id}</span>`
      + `<div style="min-width:0;"><div class="crit-title">${c.title}</div><div class="crit-focus">${esc(saved.focus)}</div></div>`
      + `<div class="crit-tags">${tags}</div>${ICON.chev}</div>`;
    if (!open) return html + '</div>';

    const dis = draftView ? '' : 'disabled';
    const ta = (f, v) => `<textarea data-f="${f}" rows="${Math.max(2, Math.ceil(v.length / 62))}" ${dis}>${esc(v)}</textarea>`;
    html += '<div class="crit-body">'
      + `<div class="ed-row"><label>평가 질문</label>${ta('focus', c.focus)}</div>`
      + `<div class="ed-row"><label>점수 조건</label><div>${scores.map(s => `<div class="lvl"><span class="lvl-score s${s}">${s}점</span>${ta('lv' + s, c.levels[s])}</div>`).join('')}`
      + (c.title === '보안 준수' && !('1' in c.levels) ? '<div class="task-sub">보안 준수는 0·2점만 판정</div>' : '') + '</div></div>'
      + `<details class="ed-more"><summary>미관측·검토 조건</summary>`
      + `<div class="ed-row"><label>미관측 조건</label>${ta('unobserved', c.unobserved)}</div>`
      + `<div class="ed-row"><label>검토 필요 조건</label>${ta('review', c.review)}</div></details>`
      + `<div class="ed-row"><label>근거 자료</label><div class="ev-list">`
      + (c.evidence.map((e, i) => `<div class="ev ${e.isNew ? 'new' : ''}"><span class="mono">${esc(e.doc)} · ${esc(e.ver)} · ${esc(e.sec)}</span><span>${esc(e.quote)}</span>`
          + (draftView ? `<button data-act="rmEv" data-i="${i}" title="근거 제거">×</button>` : '') + '</div>').join('')
        || '<div class="task-sub" style="color:var(--red);">근거 없음 — 1건 이상 연결 필요</div>')
      + (draftView ? evPicker(c) : '') + '</div></div>';
    if (ch) html += changeBox(ch, saved);
    html += warns.map(w => w.ack
      ? `<div class="warn-done">✓ 확인됨 — ${w.field} "${esc(w.term)}"</div>`
      : `<div class="warn-box">${ICON.warn}<div style="flex:1;"><b>검토 경고</b> — ${w.field}에 "${esc(w.term)}"`
        + `<div class="warn-quote">…${esc(w.excerpt)}…</div>${esc(w.message)}</div>`
        + (draftView ? '<button class="btn btn-sm" data-act="ack">확인함</button>' : '') + '</div>').join('');
    if (draftView) html += '<div class="crit-foot">'
      + `<button class="btn btn-ghost btn-sm" data-act="revert" ${ch ? '' : 'disabled'}>${d.base} 기준으로 되돌리기</button>`
      + `<div style="display:flex; gap:8px;"><button class="btn btn-sm" data-act="cancel" ${state.dirty ? '' : 'disabled'}>취소</button>`
      + `<button class="btn btn-primary btn-sm" data-act="save" ${state.dirty ? '' : 'disabled'}>항목 저장</button></div></div>`;
    return html + '</div></div>';
  }

  function renderCrits(){
    const wt = WORK_TYPES.find(w => w.key === state.wt);
    $('#critList').innerHTML = `<div class="crit-list-head"><div><b>${wt.name}</b><span> · 산출물: ${wt.artifact} · ${ITEMS.length}개 항목</span></div>`
      + `<span class="task-sub">${isDraftView() ? '항목을 눌러 검토·수정' : '읽기 전용'}</span></div>`
      + viewData()[wt.key].map(c => critCard(c, wt.key)).join('');
  }

  function renderHistory(){
    $('#histList').innerHTML = state.history.slice(0, 7).map(h =>
      `<div class="hist-row"><span class="mono">${h.t.slice(5)}</span><div><b>${esc(h.who)}</b> · ${esc(h.text)}</div></div>`).join('');
  }

  function renderRubric(){
    renderToolbar(); renderBanner(); renderWtList(); renderCrits(); renderHistory();
    const badge = $('#draftTabBadge');
    badge.hidden = !state.draft;
    badge.textContent = state.draft ? `${state.draft.id} 초안` : '';
  }
  function renderAll(){ renderDocs(); renderAgent(); renderRubric(); }

  function resetEdit(){ state.open = null; state.work = null; state.dirty = false; }
  function setWork(key){ state.work = isDraftView() ? clone(findCrit(key)) : null; state.dirty = false; }

  const ACTS = {
    save(key){
      const w = state.work, d = state.draft;
      if (!w.focus.trim() || scoresOf(w).some(s => !w.levels[s].trim()) || !w.unobserved.trim()){ toast('평가 질문·점수 조건·미관측 조건은 비울 수 없습니다'); return; }
      if (!w.evidence.length){ toast('근거 인용이 1건 이상 필요합니다'); return; }
      const [wt, item] = key.split('|');
      const arr = d.data[wt], idx = arr.findIndex(c => c.title === item);
      const before = d.changes[key] ? d.changes[key].before : clone(arr[idx]);
      arr[idx] = clone(w);
      if (norm(arr[idx]) === norm(before)) delete d.changes[key];
      else if (!d.changes[key]) d.changes[key] = {by:'admin', reasons:[`${ME} 직접 수정`], before};
      else if (d.changes[key].by === 'ai') d.changes[key].edited = true;
      scanWarnings(key);
      state.history.unshift({t:nowStr(), who:ME, text:`${wtName(wt)} > ${item} 수정`});
      setWork(key);
      renderRubric();
      const w2 = d.warnings.filter(x => x.key === key).length;
      toast(w2 ? `저장했습니다 · 검토 경고 ${w2}건이 남아 있습니다` : `${d.id} 초안에 저장했습니다`);
    },
    cancel(key){ setWork(key); renderCrits(); },
    revert(key){
      const d = state.draft, [wt, item] = key.split('|');
      const arr = d.data[wt], idx = arr.findIndex(c => c.title === item);
      arr[idx] = clone(d.changes[key].before);
      delete d.changes[key];
      scanWarnings(key);
      state.history.unshift({t:nowStr(), who:ME, text:`${wtName(wt)} > ${item}을 ${d.base} 기준으로 되돌림`});
      setWork(key);
      renderRubric();
      toast(`${d.base} 기준으로 되돌렸습니다`);
    },
    ack(key){
      state.draft.warnings.filter(w => w.key === key).forEach(w => { w.ack = true; });
      state.history.unshift({t:nowStr(), who:ME, text:`${wtName(key.split('|')[0])} > ${key.split('|')[1]} 검토 경고 확인`});
      renderRubric();
    },
    rmEv(key, btn){
      state.work.evidence.splice(Number(btn.dataset.i), 1);
      state.dirty = true;
      renderCrits();
    },
  };

  $('#critList').addEventListener('click', e => {
    const card = e.target.closest('.crit');
    if (!card) return;
    const key = card.dataset.key;
    if (e.target.closest('.crit-head')){
      if (state.open === key) resetEdit(); else { state.open = key; setWork(key); }
      renderCrits();
      return;
    }
    const btn = e.target.closest('[data-act]');
    if (btn && !btn.disabled) ACTS[btn.dataset.act](key, btn);
  });
  $('#critList').addEventListener('input', e => {
    const f = e.target.dataset.f;
    if (!f || !state.work) return;
    if (f.startsWith('lv')) state.work.levels[f.slice(2)] = e.target.value; else state.work[f] = e.target.value;
    if (!state.dirty){
      state.dirty = true;
      document.querySelectorAll('.crit.open [data-act="save"], .crit.open [data-act="cancel"]').forEach(b => { b.disabled = false; });
    }
  });
  $('#critList').addEventListener('change', e => {
    if (!e.target.matches('[data-ev-add]') || !e.target.value) return;
    const [doc, sec] = e.target.value.split('|');
    state.work.evidence.push({...sectionOf(doc, sec), isNew:true});
    state.dirty = true;
    renderCrits();
  });
  $('#wtList').addEventListener('click', e => {
    const b = e.target.closest('[data-wt]');
    if (!b) return;
    state.wt = b.dataset.wt;
    resetEdit();
    renderRubric();
  });
  $('#rbVersion').addEventListener('change', e => { state.view = e.target.value; resetEdit(); renderRubric(); });
  $('#rbActions').addEventListener('click', e => {
    const b = e.target.closest('[data-rb]');
    if (!b) return;
    const d = state.draft;
    if (b.dataset.rb === 'toDraft'){ state.view = d.id; resetEdit(); renderRubric(); return; }
    if (b.dataset.rb === 'fork'){
      state.draft = newDraft(ME);
      state.view = state.draft.id;
      state.history.unshift({t:nowStr(), who:ME, text:`${state.draft.id} 수정 초안 생성 (${state.draft.base} 복사)`});
      resetEdit();
      renderAll();
      return;
    }
    if (b.dataset.rb === 'discard'){
      if (state.job && !state.job.done){ toast('에이전트 설계가 끝난 뒤 폐기할 수 있습니다'); return; }
      state.docs.forEach(doc => { if (doc.rubric === 'draft') doc.rubric = 'none'; });
      state.history.unshift({t:nowStr(), who:ME, text:`${d.id} 초안 폐기`});
      state.draft = null; state.job = null; state.view = currentVer().id;
      resetEdit();
      renderAll();
      toast(`${d.id} 초안을 폐기했습니다`);
      return;
    }
    if (state.dirty){ toast('저장하지 않은 수정이 있습니다. 항목 저장 또는 취소 후 승인하세요'); return; }
    const pending = d.warnings.filter(w => !w.ack);
    if (pending.length){
      state.wt = pending[0].key.split('|')[0];
      state.open = pending[0].key;
      setWork(state.open);
      renderRubric();
      toast(`검토 경고 ${pending.length}건을 먼저 확인하세요`);
      return;
    }
    const n = Object.keys(d.changes).length;
    if (!n){ toast('변경된 항목이 없습니다'); return; }
    const t = nowStr();
    state.versions.forEach(v => { if (v.status === 'current') v.status = 'archived'; });
    state.versions.push({id:d.id, status:'current', by:ME, date:t});
    state.rubrics[d.id] = d.data;
    state.docs.forEach(doc => {
      if (doc.rubric === 'draft') doc.rubric = 'linked';
      else if (doc.status === 'old' && doc.rubric === 'linked') doc.rubric = 'excluded';
    });
    state.history.unshift({t, who:ME, text:`${d.id} 승인 · ${n}개 항목 변경, 다음 평가부터 적용`});
    state.draft = null; state.job = null; state.view = d.id;
    resetEdit();
    renderAll();
    toast(`${d.id} 기준이 승인되어 적용되었습니다`);
  });

  const dz = $('#dropzone'), fileInput = $('#fileInput');
  $('#pickFile').addEventListener('click', () => fileInput.click());
  $('#sampleUpload').addEventListener('click', () => startUpload('2026.3_표준가격표.xlsx', true));
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) startUpload(fileInput.files[0].name, false);
    fileInput.value = '';
  });
  ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) startUpload(f.name, false); });

  renderAll();
  renderRecentCards();
  renderWsFilters();
  renderWsTable();
  document.getElementById('wsFilters').addEventListener('click', e => {
    const chip = e.target.closest('[data-filter]');
    if (chip) setWsFilter(chip.dataset.filter);
  });
