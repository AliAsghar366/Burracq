import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { categories, productsByCategory, getCategory } from '../data/catalog';
import ProductCard from '../components/ProductCard';

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'name';

export default function CategoryPage() {
  const { slug = '' } = useParams();
  const [sort, setSort] = useState<SortKey>('featured');
  const category = getCategory(slug) ?? categories[0];

  const products = useMemo(() => {
    const list = [...productsByCategory(category.slug)];
    switch (sort) {
      case 'price-asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return list.sort((a, b) => b.price - a.price);
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [category.slug, sort]);

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

      <div className="toolbar">
        <label htmlFor="sort">Sort by</label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="featured">Featured</option>
          <option value="name">Name (A–Z)</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      <div className="product-grid">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
