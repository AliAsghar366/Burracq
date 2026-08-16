import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { categories, productsByCategory, getCategory, uniqueProducts } from '../data/catalog';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import { SORT_OPTIONS, type SortKey } from '../data/sort';

// The original site shows 72 products per page.
const PAGE_SIZE = 72;

export default function CategoryPage() {
  const { slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState<SortKey>('newest');
  const category = getCategory(slug) ?? categories[0];

  const products = useMemo(() => {
    const list = uniqueProducts(productsByCategory(category.slug));
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
        // featured / newest / best selling / by review keep the
        // original site's page order (newest first).
        return list;
    }
  }, [category.slug, sort]);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const rawPage = parseInt(params.get('page') || '1', 10);
  const page = Number.isFinite(rawPage) ? Math.min(Math.max(rawPage, 1), totalPages) : 1;

  // Reset to page 1 when switching categories.
  useEffect(() => {
    if (page !== 1) setParams({}, { replace: true });
  }, [category.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const pageItems = useMemo(
    () => products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [products, page]
  );

  const pageHref = (p: number) => `/category/${category.slug}?page=${p}`;

  return (
    <section className="container section">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <span>{category.name}</span>
      </nav>

      <div className="category-head">
        <h1>{category.name}</h1>
        <p>{category.tagline}</p>
        <p className="product-count">{products.length} products</p>
      </div>

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
    </section>
  );
}
