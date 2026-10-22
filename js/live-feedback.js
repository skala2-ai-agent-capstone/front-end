/* ---------- AI 업무 공간 — 실시간 프롬프팅 피드백 ---------- */
const LF_COOLDOWN_MS = 5 * 60 * 1000;

const LF_ITEM_SETS = [
  [
    {label:'지시 품질', state:'good', note:'조건(수량·기간·범위)을 구체적으로 전달했어요.'},
    {label:'결과 검증', state:'warn', note:'AI 결과를 참조 자료와 아직 대조하지 않았어요.'},
    {label:'보안 준수', state:'pending', note:'민감정보 입력 여부를 확인할 대화가 아직 없어요.'},
  ],
  [
    {label:'문제 정의', state:'good', note:'업무 목적과 범위가 대화에 잘 드러나 있어요.'},
    {label:'지시 품질', state:'warn', note:'형식·제약 조건을 조금 더 구체적으로 전달해보세요.'},
    {label:'결과 검증', state:'pending', note:'AI 산출물을 검토한 기록이 아직 없어요.'},
  ],
];
const LF_COACHING = [
  '다음 메시지에서 가격 정책 문서와 금액을 한 번 더 대조해보세요.',
  '참조 자료의 버전을 명시해서 전달하면 더 정확한 결과를 받을 수 있어요.',
  '필수 요구사항 중 아직 언급하지 않은 항목이 있는지 확인해보세요.',
];
const LF_STATE_META = {
  good:{color:'var(--green)', text:'양호'},
  warn:{color:'var(--amber)', text:'보완 필요'},
  pending:{color:'var(--text-faint)', text:'관측 전'},
};
let lfSetIndex = 0;
let lfToken = 0;

function lfCooldownRemainingSec(){
  const last = Number(sessionStorage.getItem('liveFeedbackRequestedAt') || 0);
  const remain = LF_COOLDOWN_MS - (Date.now() - last);
  return remain > 0 ? Math.ceil(remain / 1000) : 0;
}

function hasUserMessages(){
  const task = TASKS[currentTaskId];
  return !!task && task.messages.some(m => m.role === 'user');
}

function renderLfItem(item){
  const meta = LF_STATE_META[item.state];
  return `
    <div class="lf-item">
      <span class="dot" style="background:${meta.color};"></span>
      <div>
        <div class="lf-item-label">${esc(item.label)} <span style="color:${meta.color}; font-weight:600; font-size:12px;">· ${meta.text}</span></div>
        <div class="lf-item-note">${esc(item.note)}</div>
      </div>
    </div>`;
}

function renderLfIdle(){
  const body = document.getElementById('liveFeedbackBody');
  const btn = document.getElementById('liveFeedbackBtn');
  const remainSec = lfCooldownRemainingSec();

  if (remainSec > 0){
    const min = Math.ceil(remainSec / 60);
    body.innerHTML = `<p class="task-sub">대화 중 프롬프팅 품질을 바로 확인해보세요.</p><p class="lf-cooldown">${min}분 후 다시 요청할 수 있어요.</p>`;
    btn.disabled = true;
  } else if (!hasUserMessages()){
    body.innerHTML = `<p class="task-sub">대화를 먼저 나눠보세요. 보낸 메시지가 있어야 피드백을 받을 수 있어요.</p>`;
    btn.disabled = true;
  } else {
    body.innerHTML = `<p class="task-sub">대화 중 프롬프팅 품질을 바로 확인해보세요.</p>`;
    btn.disabled = false;
  }
}

function resetLiveFeedbackPanel(){
  lfToken++;
  renderLfIdle();
}

function requestLiveFeedback(){
  if (lfCooldownRemainingSec() > 0 || !hasUserMessages()) return;

  const token = ++lfToken;
  sessionStorage.setItem('liveFeedbackRequestedAt', String(Date.now()));
  document.getElementById('liveFeedbackBtn').disabled = true;

  const body = document.getElementById('liveFeedbackBody');
  body.innerHTML = `
    <div class="step run">
      <div class="step-ico"></div>
      <div><b>대기 중…</b><small>최근 대화 5개 범위를 확인하고 있어요.</small></div>
    </div>`;

  setTimeout(() => {
    if (token !== lfToken) return;
    body.innerHTML = `
      <div class="step run">
        <div class="step-ico"></div>
        <div><b>생성 중…</b><small>프롬프팅 피드백을 만들고 있어요.</small></div>
      </div>`;
  }, 900);

  setTimeout(() => {
    if (token !== lfToken) return;
    const items = LF_ITEM_SETS[lfSetIndex % LF_ITEM_SETS.length];
    const coaching = LF_COACHING[lfSetIndex % LF_COACHING.length];
    lfSetIndex++;
    body.innerHTML = items.map(renderLfItem).join('')
      + `<div class="lf-coach">코칭 · ${esc(coaching)}</div>`
      + `<p class="lf-cooldown">5분 동안 추가 요청은 제한돼요.</p>`;
  }, 2400);
}

document.getElementById('liveFeedbackBtn').addEventListener('click', requestLiveFeedback);
renderLfIdle();
