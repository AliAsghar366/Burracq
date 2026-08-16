import { Link } from 'react-router-dom';
import {
  getCategory,
  getProduct,
  homeSections,
  products,
  productsByCategory,
  uniqueProducts,
  type Product,
} from '../data/catalog';
import ProductCard from '../components/ProductCard';
import HeroCarousel from '../components/HeroCarousel';

// ilovehana-style collage: mixed aspect ratios (tall / wide / square)
// plus one feature tile with a big bold overlay like the "TRUCKER CAP" banner.
const CATEGORY_TILES: {
  slug: string;
  size: 'tall' | 'wide' | 'square' | 'feature';
  title?: string;
  subtitle?: string;
}[] = [
  // Each column = one tall (3:4) + one square (1:1), so all three
  // columns end at the same height (2.33w + gutter) with no ragged bottom.
  { slug: 'women', size: 'tall' },
  { slug: 'hats', size: 'square' },
  { slug: 'accessory', size: 'feature', title: 'Accessories', subtitle: 'Curated details, effortless style.' },
  { slug: 'bag', size: 'square' },
  { slug: 'sale', size: 'tall' },
  { slug: 'new', size: 'square' },
];

function ProductSection({
  title,
  items,
  viewAll,
  subtitle,
}: {
  title: string;
  items: Product[];
  viewAll?: string;
  subtitle?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="container section home-section">
      <div className="section-head">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
        {viewAll && (
          <Link to={viewAll} className="link-more">
            View all →
          </Link>
        )}
      </div>
      <div className="product-grid">
        {items.map((p) => (
          <ProductCard key={`${p.category}-${p.slug}`} product={p} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  // Curated sections from the original site's homepage grids, deduped so each
  // product (and its color variations) shows as one card.
  const trending = uniqueProducts(
    homeSections.popular.map((s) => getProduct(s)).filter(Boolean) as Product[]
  );
  const newArrivals = uniqueProducts(
    homeSections.new.map((s) => getProduct(s)).filter(Boolean) as Product[]
  );
  const bestSellers = uniqueProducts(
    homeSections.featured.map((s) => getProduct(s)).filter(Boolean) as Product[]
  );
  const under25 = uniqueProducts([...products].sort((a, b) => a.price - b.price))
    .filter((p) => p.price < 25)
    .slice(0, 8);
  const saleItems = uniqueProducts(productsByCategory('sale')).slice(0, 8);

  return (
    <>
      <HeroCarousel />

      <div className="trust-bar container" aria-label="Store promises">
        <span>Free U.S. shipping on orders over $100</span>
        <span>Easy 30-day returns</span>
        <span>New styles added weekly</span>
      </div>

      <section className="container section shop-by">
        <h2 className="section-title center">Shop by Category</h2>
        <div className="category-grid">
          {CATEGORY_TILES.map(({ slug, size, title, subtitle }) => {
            const cat = getCategory(slug);
            if (!cat) return null;
            return (
              <Link
                key={slug}
                to={`/category/${slug}`}
                className={`category-tile category-tile--${size}`}
              >
                <img src={cat.image} alt={cat.name} loading="lazy" />
                {size === 'feature' ? (
                  <span className="category-tile-feature">
                    <strong>{title ?? cat.name}</strong>
                    {subtitle && <small>{subtitle}</small>}
                    <em>Shop the collection →</em>
                  </span>
                ) : (
                  <span className="category-tile-label">
                    <strong>{cat.name}</strong>
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      <ProductSection
        title="Trending Now"
        subtitle="What everyone's reaching for right now."
        items={trending}
        viewAll="/categories"
      />
      <ProductSection
        title="New Arrivals"
        subtitle="Fresh finds added to the lineup."
        items={newArrivals}
        viewAll="/category/new"
      />
      <ProductSection
        title="Best Sellers"
        subtitle="Customer favorites, again and again."
        items={bestSellers}
        viewAll="/categories"
      />
      <ProductSection
        title="Under $25"
        subtitle="Big style, small price."
        items={under25}
      />
      <ProductSection
        title="Sale"
        subtitle="Markdowns on favorite styles — while stock lasts."
        items={saleItems}
        viewAll="/category/sale"
      />
    </>
  );
}
