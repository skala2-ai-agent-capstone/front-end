/* ---------- 로그인 / 회사 신규가입 폼 ---------- */
function enterApp(role, landingId){
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appShell').style.display = 'flex';
  setRole(role, landingId);
}

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

document.querySelectorAll('.auth-tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.auth-tab').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.auth-panel').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  document.getElementById('auth-' + t.dataset.auth).classList.add('active');
}));

/* ---------- 세션 복원 (새로고침해도 로그인 유지) ---------- */
(function restoreSession(){
  const role = sessionStorage.getItem('role');
  if (!role) return;
  const hashPage = location.hash.slice(1);
  const lastPage = (hashPage && document.getElementById(hashPage)) ? hashPage : sessionStorage.getItem('lastPage');
  enterApp(role, lastPage || undefined);
})();
