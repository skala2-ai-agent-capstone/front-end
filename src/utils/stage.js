export const STAGE_BADGE = {
  '작성 중': 'badge-gray',
  '평가 대기': 'badge-amber',
  '평가 중': 'badge-amber',
  '확인 대기': 'badge-blue',
  '검토 중': 'badge-blue',
  '확정': 'badge-green',
  '자료 보류': 'badge-red',
  '평가 실패': 'badge-red',
};

export function stageBadgeClass(stage) {
  return STAGE_BADGE[stage] || 'badge-gray';
}
