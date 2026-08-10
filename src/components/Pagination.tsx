import { Link } from 'react-router-dom';

interface PaginationProps {
  page: number;
  totalPages: number;
  to: (page: number) => string;
}

export default function Pagination({ page, totalPages, to }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = windowPages(page, totalPages);
  return (
    <nav className="pagination" aria-label="pagination">
      <ul className="pagination-list">
        {page > 1 && (
          <li className="pagination-item pagination-item--previous">
            <Link className="pagination-link" to={to(page - 1)} aria-label="Previous">
              Prev
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path fill="currentColor" d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </Link>
          </li>
        )}

        {pages.map((p, i) =>
          p === '…' ? (
            <li key={`ellipsis-${i}`} className="pagination-item" aria-hidden="true">
              <span className="pagination-ellipsis">…</span>
            </li>
          ) : (
            <li
              key={p}
              className={`pagination-item${p === page ? ' pagination-item--current' : ''}`}
            >
              <Link
                className="pagination-link"
                to={to(p)}
                aria-label={`Page ${p} of ${totalPages}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </Link>
            </li>
          )
        )}

        {page < totalPages && (
          <li className="pagination-item pagination-item--next">
            <Link className="pagination-link" to={to(page + 1)} aria-label="Next">
              Next
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                <path fill="currentColor" d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z" />
              </svg>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

function windowPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('…');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push('…');
  pages.push(total);
  return pages;
}
