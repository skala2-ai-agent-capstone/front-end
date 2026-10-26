export const REPORT_STATUS_LABEL = { generated: '생성됨', insufficient_data: '데이터 부족', withheld: '보류' };
export const REPORT_STATUS_BADGE = { generated: 'badge-green', insufficient_data: 'badge-gray', withheld: 'badge-amber' };
// 팀 리포트의 공통 평가 항목(표시 순서)과 업무 유형 이름. 팀 대시보드의 이름과 같다
export const CRITERION_LABEL = {
  problem_definition: '문제 정의', instruction_quality: '지시 품질', verification: '결과 검증',
  security: '보안 준수', output_quality: '결과물 품질',
};
export const CRITERIA_ORDER = Object.keys(CRITERION_LABEL);
export const WORK_TYPE_LABEL = {
  rfp_analysis: 'RFP 요구사항 분석', proposal: '고객 맞춤 제안서 작성', quote: '견적서 작성', inquiry_reply: '고객 질의 답변 작성',
};
