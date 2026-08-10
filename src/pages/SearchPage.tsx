import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { products, getCategory } from '../data/catalog';
import ProductCard from '../components/ProductCard';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') || '').trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (getCategory(p.category)?.name || '').toLowerCase().includes(q)
    );
  }, [q]);

  return (
    <section className="container section">
      <h1>Search results{q ? ` for "${q}"` : ''}</h1>
      <p className="product-count">{results.length} products found</p>
      {results.length > 0 ? (
        <div className="product-grid">
          {results.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      ) : (
        <p>No products match your search. Try a different keyword.</p>
      )}
    </section>
  );
}
