import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { products, getCategory, uniqueProducts } from '../data/catalog';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import { SORT_OPTIONS, type SortKey } from '../data/sort';

// The original site shows 72 products per page.
const PAGE_SIZE = 72;

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState<SortKey>('newest');
  const q = (params.get('q') || '').trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return [];
    const matched = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (getCategory(p.category)?.name || '').toLowerCase().includes(q)
    );
    const list = uniqueProducts(matched);
    switch (sort) {
      case 'alphaasc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'alphadesc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'priceasc':
        return list.sort((a, b) => a.price - b.price);
      case 'pricedesc':
        return list.sort((a, b) => b.price - a.price);
      default:
        return list;
    }
  }, [q, sort]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const rawPage = parseInt(params.get('page') || '1', 10);
  const page = Number.isFinite(rawPage) ? Math.min(Math.max(rawPage, 1), totalPages) : 1;

  // Reset to page 1 when the search term changes.
  useEffect(() => {
    if (page !== 1) setParams({ q: params.get('q') || '' }, { replace: true });
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageHref = (p: number) => `/search?q=${encodeURIComponent(q)}&page=${p}`;

  return (
    <section className="container section">
      <h1>Search results{q ? ` for "${q}"` : ''}</h1>
      <p className="product-count">{results.length} products found</p>
      {results.length > 0 ? (
        <>
          <div className="product-grid">
            {pageItems.map((p) => (
              <ProductCard key={`${p.category}-${p.slug}`} product={p} />
            ))}
          </div>

          <div className="sort-and-pagination">
            <form className="sort-products" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="sort">Sort By:</label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </form>

            <Pagination page={page} totalPages={totalPages} to={pageHref} />
          </div>
        </>
      ) : (
        <p>No products match your search. Try a different keyword.</p>
      )}
    </section>
  );
}
