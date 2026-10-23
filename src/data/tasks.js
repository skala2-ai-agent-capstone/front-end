export const TYPE_META = {
  rfp: { type: 'RFP 요구사항 분석', artifactTitle: '요구사항 대응표' },
  proposal: { type: '고객 맞춤 제안서 작성', artifactTitle: '최종 제안서' },
  quote: { type: '견적서 작성', artifactTitle: '견적서' },
  reply: { type: '고객 질의 답변 작성', artifactTitle: '회신 메일' },
};

export const TYPE_FILTERS = [
  ['all', '전체'],
  ['rfp', 'RFP 분석'],
  ['proposal', '제안서'],
  ['quote', '견적서'],
  ['reply', '질의응답'],
];

export const TASK_INITIALS = { rfp: 'RF', proposal: 'PR', quote: 'QT', reply: 'IQ' };

export const INITIAL_TASKS = {
  rfp: {
    title: '삼성SDS향 RFP 분석', type: 'RFP 요구사항 분석', typeKey: 'rfp', status: '작성 중', statusClass: 'badge-gray', updated: '10분 전',
    purpose: '목적: SI 제안 사전 분석<br/>예산: 비공개 · 필수 요구 12건',
    customerRefs: ['RFP_원문_v2.pdf'],
    internalRefs: ['제품_서비스_제공범위.pdf'],
    artifactTitle: '요구사항 대응표', artifactVersion: '초안 v3',
    artifactBody: '<p><b>1. 보안</b><br/>ISMS-P 인증 보유 — 충족<br/>전송구간 암호화 — 충족 (TLS 1.3)</p><p><b>2. 배포</b><br/>자체 데이터센터 배포 옵션 — 충족</p>',
    messages: [
      { role: 'user', text: '이 RFP에서 보안 요구사항만 뽑아서 정리해줘' },
      { role: 'ai', text: '<b>보안 요구사항 3건</b>을 확인했습니다. ① ISMS-P 인증 보유 ② 전송구간 암호화 ③ 접근 로그 6개월 보관' },
      { role: 'user', text: '좋아, 이 내용으로 대응표 초안 만들어줘' },
      { role: 'ai', text: '요구사항 대응표 초안 v3을 작성했습니다. 오른쪽 패널에서 확인해보세요.' },
    ],
  },
  proposal: {
    title: 'LG CNS 맞춤 제안서', type: '고객 맞춤 제안서 작성', typeKey: 'proposal', status: '평가 중', statusClass: 'badge-amber', updated: '1시간 전',
    purpose: '목적: 챗봇 플랫폼 고도화 제안<br/>예산: 3억 내외 · 필수 요구 8건',
    customerRefs: ['고객_요구사항_정리.docx'],
    internalRefs: ['표준_제안서_템플릿.pptx', '확정_견적_LGCNS.pdf'],
    artifactTitle: '최종 제안서', artifactVersion: '최종본',
    artifactBody: '<p><b>1. 제안 개요</b><br/>AI 상담 자동화로 응대시간 40% 단축</p><p><b>2. 가격</b><br/>확정 견적 기준 3.2억 (VAT 별도)</p>',
    messages: [
      { role: 'user', text: '지난 번 견적서 기준으로 제안서 가격 섹션 채워줘' },
      { role: 'ai', text: '확정 견적 QUOTE-1188 기준으로 가격 섹션을 작성했습니다. 금액은 확정 견적과 동일하게 인용했습니다.' },
    ],
  },
  quote: {
    title: '현대오토에버 견적서', type: '견적서 작성', typeKey: 'quote', status: '확인 대기', statusClass: 'badge-blue', updated: '어제',
    purpose: '목적: 라이선스 갱신 견적<br/>예산: 1.5억 · 사용자 120명',
    customerRefs: [],
    internalRefs: ['2026_가격정책_표준.xlsx', '할인_승인_기준.pdf'],
    artifactTitle: '견적서', artifactVersion: '승인 요청됨',
    artifactBody: '<p><b>상품</b><br/>Doc AI 120 사용자 · 12개월</p><p><b>금액</b><br/>단가 25,000원 × 120명 × 12개월 = 36,000,000원 (VAT 별도)</p>',
    messages: [
      { role: 'user', text: '120명 기준으로 1년 견적 뽑아줘, 할인정책 적용해서' },
      { role: 'ai', text: '표준 가격표 2026.2 기준으로 계산했습니다. 합산 할인율이 15%를 넘어 팀장 승인이 필요합니다.' },
    ],
  },
  reply: {
    title: 'SK C&C 질의 응답', type: '고객 질의 답변 작성', typeKey: 'reply', status: '확정', statusClass: 'badge-green', updated: '2일 전',
    purpose: '목적: 기술 문의 회신<br/>관련 업무: 견적서 QUOTE-1172',
    customerRefs: [],
    internalRefs: ['제품_서비스_제공범위_v4.pdf', '확정_견적_SKC&C.pdf'],
    artifactTitle: '회신 메일', artifactVersion: '발송 완료',
    artifactBody: '<p>문의하신 SSO 연동은 SAML 2.0 기반으로 지원되며, OIDC는 현재 지원하지 않습니다.</p><p>가격 문의는 보내드린 확정 견적(QUOTE-1172) 범위 내에서 답변드립니다.</p>',
    messages: [
      { role: 'user', text: 'OIDC 지원 여부 질문 들어왔는데 답변 초안 써줘' },
      { role: 'ai', text: '제품 설명서 v4 §4.1 기준으로는 SAML 2.0만 지원하고 OIDC는 미지원입니다. 이 내용으로 회신 초안을 작성했습니다.' },
    ],
  },
};

export const AI_REPLIES = [
  '확인했습니다. 요청하신 내용을 반영해 오른쪽 패널의 산출물을 업데이트했어요.',
  '말씀하신 조건으로 다시 정리했습니다. 추가로 확인이 필요한 부분이 있으면 말씀해주세요.',
  '참조 자료와 대조한 결과를 반영했습니다. 변경된 내용은 산출물 패널에서 확인할 수 있어요.',
];
