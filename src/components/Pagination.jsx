export const PAGE_SIZE = 20;

export default function Pagination({ page, total, pageSize = PAGE_SIZE, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const delta = 1;
  const pages = [1];
  for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) pages.push(i);
  if (page - delta > 2) pages.splice(1, 0, '…');
  if (page + delta < totalPages - 1) pages.push('…');
  if (totalPages > 1) pages.push(totalPages);

  return (
    <div className="pagination">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="이전 페이지">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      {pages.map((p, i) => (
        p === '…'
          ? <span key={`e${i}`} className="pagination-ellipsis">…</span>
          : <button type="button" key={p} className={p === page ? 'active' : ''} onClick={() => onChange(p)}>{p}</button>
      ))}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="다음 페이지">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </div>
  );
}
