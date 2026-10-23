import { clone, nowStr } from '../utils/misc';

export const TYPE_LABEL = { product: '제품 설명서', price: '가격표', policy: '내규·정책' };

export const WORK_TYPES = [
  { key: 'rfp', code: 'RF', name: 'RFP 요구사항 분석', artifact: '요구사항 대응표' },
  { key: 'proposal', code: 'PR', name: '고객 맞춤 제안서 작성', artifact: '최종 제안서' },
  { key: 'quote', code: 'QT', name: '견적서 작성', artifact: '견적서' },
  { key: 'reply', code: 'IQ', name: '고객 질의 답변 작성', artifact: '회신 메일' },
];
export const wtName = (k) => WORK_TYPES.find((w) => w.key === k).name;
export const ITEMS = ['문제 정의', '지시 품질', '결과 검증', '보안 준수', '결과물 품질'];

export const ITEM_BASE = {
  '문제 정의': {
    dim: '직원 행동',
    levels: { 2: '필수 기재 사항을 모두 기재했다. 고객이 제시하지 않은 사항을 "고객 미제시"로 표시한 것도 기재로 본다.', 1: '필수 기재 사항 중 1~2개가 빠졌다.', 0: '필수 기재 사항이 3개 이상 빠졌거나 등록 내용이 비어 있다.' },
    unobserved: '업무 등록 기록 자체가 수집되지 않은 경우. 등록은 되었으나 비어 있으면 미관측이 아니라 0점이다.',
    review: '등록된 조건과 고객 제출 자료(RFP·질문 원문 등)가 서로 다를 때.',
  },
  '지시 품질': {
    dim: '직원 행동',
    levels: { 2: '평가 질문의 전달 요소(조건·자료·형식·제약)를 대화 전체에서 모두 전달했다.', 1: '전달 요소 중 일부가 빠졌다.', 0: '조건·자료 없이 결과물만 요청했다.' },
    unobserved: '해당 업무의 AI 대화 기록 자체가 수집되지 않은 경우.',
    review: '대화에서 전달한 조건이 업무 등록 조건과 충돌할 때.',
  },
  '결과 검증': {
    dim: '직원 행동',
    levels: { 2: '참조 자료와 대조해 오류 지적, 직접 수정, 근거 연결 중 하나 이상이 확인된다.', 1: '일부 항목만 대조했거나 확인된 오류 일부가 남았다.', 0: 'AI 결과에 오류가 있었으나 대조·수정 기록이 없다.' },
    unobserved: 'AI 초안에 오류가 없었고 대조·수정 기록도 없어 검증 대상이 드러나지 않은 경우.',
    review: '참조 자료 버전 간 내용이 달라 어느 쪽이 맞는지 판단할 수 없을 때.',
  },
  '보안 준수': {
    dim: '정보 처리',
    levels: { 2: '관측 범위에서 정책 위반이 없다.', 0: '입력 금지·노출 금지 정보 위반이 1건 이상 있다.' },
    unobserved: '정책 검사 결과가 없거나 해당 입력·산출물이 수집 범위 밖인 경우.',
    review: '탐지된 정보가 공개 승인된 레퍼런스인지 등 등급 판단이 필요한 경우.',
  },
  '결과물 품질': {
    dim: '산출물',
    levels: { 2: '필수 기재 사항 누락과 사실 오류가 없다.', 1: '필수 기재 사항 누락 또는 사실 오류가 1~2건 있다.', 0: '누락·사실 오류가 3건 이상이거나 핵심 요구에 대응하지 않았다.' },
    unobserved: '최종본이 업무 공간에 저장되지 않은 경우.',
    review: '고객 자료와 내부 참조 자료가 상충하거나, 참조 자료가 최신 버전인지 확인할 수 없을 때.',
  },
};

export const FOCUS = {
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
  rfp: [[[GL, 'ART-11'], [GL, 'ART-17']], [[GL, 'ART-12'], [GL, 'ART-17']], [[GL, 'ART-13'], [PROD, '§1.2']], [[GL, 'ART-06'], [GL, 'ART-07']], [[GL, 'ART-17']]],
  proposal: [[[GL, 'ART-11']], [[GL, 'ART-12']], [[GL, 'ART-18'], [PROD, '§8.1']], [[GL, 'ART-06'], [GL, 'ART-09']], [[GL, 'ART-18'], [GL, 'APX-3']]],
  quote: [[[GL, 'ART-11'], [GL, 'ART-19']], [[GL, 'ART-12'], [PRICE, 'L2']], [[GL, 'ART-19'], [PRICE, 'L2'], [GL, 'APX-2']], [[GL, 'ART-09']], [[GL, 'ART-19'], [PRICE, 'L1']]],
  reply: [[[GL, 'ART-11']], [[GL, 'ART-12'], [GL, 'ART-21']], [[GL, 'ART-13'], [PROD, '§4.1']], [[GL, 'ART-06'], [GL, 'ART-09']], [[GL, 'ART-21'], [PRICE, 'L2'], [GL, 'APX-3']]],
};

export const SCOPE_TERMS = ['단가 계산', '금액 계산', '금액 산출', '금액 재계산', '총액 계산', '할인율 계산', '할인율을 적용'];
export const SCOPE_MSG = {
  rfp: 'RFP 분석 업무에 견적 계산 표현 — 예산 조건 추출만 대상인지 확인',
  proposal: '제안서 업무에 금액 산출 표현 — 확정 견적 인용 여부만 확인(제18조④)',
  reply: '질의 답변 업무에 금액 계산 표현 — 확정 견적 범위 내 답변인지만 확인(제21조⑤)',
};

export const ME = '권하림';

export const STEPS = [
  ['자료 색인', '대기 중'],
  ['이전 버전 대조', '대기 중'],
  ['영향 범위 분석', '대기 중'],
  ['평가 기준 설계', '대기 중'],
  ['범위·형식 검사', '대기 중'],
  ['초안 저장', '대기 중'],
];
export const STEP_MS = [900, 800, 1000, 1500, 800, 600];

export function sectionOf(state, docId, sec) {
  const d = state.docs.find((x) => x.id === docId);
  const s = d && d.sections.find((x) => x[0] === sec);
  return { doc: docId, ver: d ? d.ver : '', sec, quote: s ? s[1] : '' };
}

export function buildRubric(state, securityLevels) {
  const data = {};
  WORK_TYPES.forEach((wt) => {
    data[wt.key] = ITEMS.map((item, i) => {
      const b = ITEM_BASE[item];
      return {
        id: `${wt.code}-0${i + 1}`, title: item, dim: b.dim, focus: FOCUS[wt.key][i],
        levels: clone(item === '보안 준수' && securityLevels ? securityLevels : b.levels),
        unobserved: b.unobserved, review: b.review,
        evidence: EVID[wt.key][i].map(([d, s]) => sectionOf(state, d, s)),
      };
    });
  });
  return data;
}

export function createInitialState() {
  const state = {
    docs: [
      { id: PROD, file: '제품_서비스_제공범위_v4.pdf', type: 'product', ver: 'v4', status: 'current', indexed: '2026-10-20 09:14', rubric: 'linked',
        sections: [['§1.2', '제공 방식: 클라우드(SaaS) 전용, 온프레미스 설치 미지원'], ['§4.1', '인증: SAML 2.0 기반 SSO 지원, OIDC 미지원'], ['§8.1', 'SLA: 월 가용성 99.9%, 장애 접수 후 4시간 이내 1차 응답']] },
      { id: PRICE, file: '2026_가격정책_표준.xlsx', type: 'price', ver: '2026.2', status: 'current', indexed: '2026-10-20 09:14', rubric: 'linked',
        sections: [['L1', 'P-100 스마트 문서 AI (Doc AI): 25,000원 / 사용자·월'], ['L2', 'P-200 AI 컨택센터 (Contact AI): 90,000원 / 상담석·월'], ['L3', 'P-300 데이터 분석 플랫폼 (Insight Hub): 3,000,000원 / 테넌트·월']] },
      { id: GL, file: '영업_AI활용지침_v1.0.pdf', type: 'policy', ver: 'v1.0', status: 'current', indexed: '2026-09-01 10:02', rubric: 'linked',
        sections: [
          ['ART-06', '담당자는 승인 AI 도구를 포함한 어떠한 AI 도구에도 다음 각 호의 정보를 입력하지 않는다.'],
          ['ART-07', '고객 담당자의 휴대전화 번호, 개인 이메일 주소는 AI에 입력하기 전에 삭제한다.'],
          ['ART-09', '대외 산출물에는 다음 각 호의 정보를 포함하지 않는다.'],
          ['ART-11', '담당자는 업무 건을 생성할 때 다음 각 호의 사항을 기재한다.'],
          ['ART-12', '담당자는 AI에 작업을 요청할 때 다음 각 호의 내용을 전달한다.'],
          ['ART-13', '담당자는 AI가 생성한 내용 중 다음 각 호의 사항을 참조 자료와 대조한다.'],
          ['ART-17', '요구사항 대응표에는 RFP의 요구사항을 빠짐없이 옮기고, 항목마다 다음 사항을 적는다.'],
          ['ART-18', '제안서의 성능·효과·기능에 관한 주장은 참조 자료로 뒷받침되어야 하며, 근거 자료를 업무 공간에 연결한다.'],
          ['ART-19', 'AI가 산출한 금액은 표준 가격표와 할인 정책을 기준으로 다시 계산하여 확인한다.'],
          ['ART-21', '답변의 근거는 현재 버전의 제품 설명서, 표준 가격표, 확정 견적 등 참조 자료로 한다.'],
          ['APX-2', '별표 2 — 표준가 대비 합산 할인율에 따른 할인 승인 단계'],
          ['APX-3', '별표 3 — 근거 없는 보장·비교 등 금지 표현과 권장 표현'],
        ] },
    ],
    versions: [
      { id: 'v1.2', status: 'archived', by: ME, date: '2026-08-11 10:30' },
      { id: 'v1.3', status: 'current', by: ME, date: '2026-09-02 15:20' },
    ],
    rubrics: {},
    draft: null,
    job: null,
    view: 'v1.3', wt: 'quote', open: null, work: null, dirty: false,
    history: [
      { t: '2026-09-02 15:20', who: ME, text: 'v1.3 승인 · 보안 준수를 0/2점으로 이원화' },
      { t: '2026-08-11 10:30', who: ME, text: 'v1.2 승인 · 4개 업무 유형 기준 최초 적용' },
    ],
  };
  state.rubrics['v1.3'] = buildRubric(state);
  state.rubrics['v1.2'] = buildRubric(state, { 2: '관측 범위에서 정책 위반이 없다.', 1: '경미한 위반(연락처 비식별 누락 등)이 1건 있다.', 0: '입력 금지·노출 금지 정보 위반이 있다.' });
  return state;
}

export const currentVer = (state) => state.versions.find((v) => v.status === 'current');
export const nextId = (id) => { const [maj, min] = id.slice(1).split('.').map(Number); return `v${maj}.${min + 1}`; };
export const isDraftView = (state) => !!state.draft && state.view === state.draft.id;
export const viewData = (state) => (isDraftView(state) ? state.draft.data : state.rubrics[state.view]);
export const findCrit = (state, key, data = viewData(state)) => { const [wt, item] = key.split('|'); return data[wt].find((c) => c.title === item); };
export const scoresOf = (c) => Object.keys(c.levels).sort((a, b) => b - a);
export const norm = (c) => JSON.stringify({ ...c, evidence: c.evidence.map(({ isNew, ...e }) => e) });

export function detectType(selectedType, file) {
  if (selectedType !== 'auto') return selectedType;
  if (/가격|단가|요금|price/i.test(file)) return 'price';
  if (/지침|정책|내규|규정|policy|guide/i.test(file)) return 'policy';
  return 'product';
}
export function detectVer(file) {
  const m = file.match(/\d{4}\.\d+/) || file.match(/v\d+(\.\d+)*/i);
  return m ? m[0] : 'v1.0';
}

export function planChanges(type, doc) {
  if (type === 'price') return [
    { key: 'quote|지시 품질', focusAdd: ` 적용 가격표는 현행 ${doc.ver} 버전으로 지정해야 하며, 이전 버전을 지정하면 전달하지 않은 것으로 본다.`, reason: `가격표 버전을 ${doc.ver}로 갱신` },
    { key: 'quote|결과 검증', focusAdd: ` 특히 ${doc.highlight}처럼 바뀐 단가를 이전 단가로 산출한 오류를 바로잡았는지 본다.`, levelAdd: { 0: ' 이전 버전 단가를 그대로 사용한 경우를 포함한다.' }, reason: `단가 변경 구간(${doc.hsec}) 감지 · 0점 조건 구체화` },
    { key: 'quote|결과물 품질', focusAdd: ` 견적서에 기재한 가격표 버전이 ${doc.ver} 기준과 일치해야 한다.`, reason: `기재 기준 가격표 버전을 ${doc.ver}로 갱신` },
    { key: 'reply|결과물 품질', focusAdd: ` 가격 답변의 단가 계산이 ${doc.ver} 가격표와 일치하는가.`, reason: `근거 가격표를 ${doc.ver}로 갱신` },
  ];
  if (type === 'product') return [
    { key: 'rfp|결과 검증', focusAdd: ` 대응 가능 여부는 현행 제품 설명서(${doc.ver}) 사양과 대조해야 한다.`, reason: `대조 기준을 제품 설명서 ${doc.ver}로 갱신` },
    { key: 'proposal|결과 검증', focusAdd: ' 이전 버전 사양을 인용한 기능·성능 주장은 오류로 본다.', levelAdd: { 0: ' 이전 버전 사양을 그대로 인용한 경우를 포함한다.' }, reason: `제품 사양 변경(${doc.highlight}) 반영` },
    { key: 'reply|결과 검증', focusAdd: ` 제품 사양 답변은 제품 설명서 ${doc.ver} 버전과 대조한다.`, reason: `대조 기준을 제품 설명서 ${doc.ver}로 갱신` },
  ];
  return WORK_TYPES.map((wt) => ({
    key: `${wt.key}|보안 준수`,
    focusAdd: ` 정보 등급 판단은 ${doc.file.replace(/\.[^.]+$/, '')}(${doc.ver}) 기준을 함께 적용한다.`,
    reason: `보안 준수 근거를 내규 ${doc.ver}로 갱신`,
  }));
}

export function stepDetail(state, job, i) {
  const { doc, prev, plan } = job;
  const keys = new Set(plan.map((p) => p.key));
  let swaps = 0;
  if (prev) {
    const data = state.draft ? state.draft.data : state.rubrics[currentVer(state).id];
    WORK_TYPES.forEach((wt) => data[wt.key].forEach((c) => {
      const n = c.evidence.filter((e) => e.doc === prev.id).length;
      if (n) { swaps += n; keys.add(`${wt.key}|${c.title}`); }
    }));
  }
  const wts = [...new Set([...keys].map((k) => k.split('|')[0]))].map(wtName);
  const warnN = plan.filter((p) => SCOPE_MSG[p.key.split('|')[0]] && SCOPE_TERMS.some((t) => (p.focusAdd + Object.values(p.levelAdd || {}).join('')).includes(t))).length;
  const baseLabel = state.draft ? `${state.draft.id} 초안` : currentVer(state).id;
  return [
    `${doc.sections.length > 3 ? doc.sections.length : 6 + doc.file.length % 12}개 구간으로 분할 · 검색 색인 완료`,
    prev ? `${prev.file}(${prev.ver}) 대비 변경 감지 — ${doc.highlight}` : '같은 유형의 기존 자료 없음 — 신규 근거로 등록',
    `${wts.join(' · ')} — ${keys.size}개 평가 항목이 이 자료를 근거로 사용`,
    `${baseLabel} 대비 ${keys.size}개 항목 수정 · 근거 인용 ${swaps}건 교체`,
    warnN ? `점수 형식·근거 ID 검증 통과 · 업무 범위 검토 경고 ${warnN}건` : '점수 형식·근거 ID·업무 범위 검사 통과',
    `평가 기준 ${state.draft ? state.draft.id : nextId(currentVer(state).id)} 초안으로 저장 · 관리자 승인 대기`,
  ][i];
}

export function scanWarnings(state, key) {
  const d = state.draft;
  d.warnings = d.warnings.filter((w) => w.key !== key);
  const wt = key.split('|')[0];
  if (!SCOPE_MSG[wt]) return;
  const c = findCrit(state, key, d.data);
  const fields = [['평가 질문', c.focus], ...scoresOf(c).map((s) => [`${s}점 조건`, c.levels[s]])];
  fields.forEach(([field, text]) => {
    const term = SCOPE_TERMS.find((t) => text.includes(t));
    if (!term) return;
    const i = text.indexOf(term);
    d.warnings.push({ key, field, term, excerpt: text.slice(Math.max(0, i - 30), i + term.length + 20), message: SCOPE_MSG[wt], ack: false });
  });
}

export function newDraft(state, by) {
  const cur = currentVer(state);
  return { id: nextId(cur.id), base: cur.id, by, createdAt: nowStr(), data: clone(state.rubrics[cur.id]), changes: {}, warnings: [], sources: [] };
}

export function applyDesign(state, job) {
  if (!state.draft) state.draft = newDraft(state, 'AI 에이전트');
  const d = state.draft, { doc, prev } = job;
  d.sources.push(doc.file);
  const touched = new Set();
  const touch = (key, reason) => {
    const c = findCrit(state, key, d.data);
    if (!d.changes[key]) d.changes[key] = { by: 'ai', reasons: [], before: clone(c) };
    d.changes[key].reasons.push(reason);
    touched.add(key);
    return c;
  };
  job.plan.forEach((p) => {
    const c = touch(p.key, p.reason);
    c.focus += p.focusAdd;
    Object.entries(p.levelAdd || {}).forEach(([s, t]) => { if (s in c.levels) c.levels[s] += t; });
    if (!prev) c.evidence.push({ ...sectionOf(state, doc.id, doc.hsec), isNew: true });
  });
  if (prev) WORK_TYPES.forEach((wt) => d.data[wt.key].forEach((c) => {
    const hits = c.evidence.filter((e) => e.doc === prev.id);
    if (!hits.length) return;
    touch(`${wt.key}|${c.title}`, `근거 인용 교체: ${prev.id} → ${doc.id} (${hits.map((e) => e.sec).join(', ')})`);
    c.evidence = c.evidence.map((e) => (e.doc === prev.id ? { ...sectionOf(state, doc.id, e.sec), isNew: true } : e));
  }));
  touched.forEach((key) => scanWarnings(state, key));
  doc.rubric = 'draft';
  job.draftId = d.id;
  job.changedCount = touched.size;
  state.view = d.id;
  state.wt = [...touched][0].split('|')[0];
  state.open = null; state.work = null; state.dirty = false;
  state.history.unshift({ t: nowStr(), who: 'AI 에이전트', text: `${doc.file} 반영 · ${d.id} 초안 저장 (${touched.size}개 항목 수정)` });
}
