import { Link } from 'react-router-dom';
import { getCategory, getProduct, homeSections, products, productsByCategory, type Product } from '../data/catalog';
import ProductCard from '../components/ProductCard';
import BannerSlider from '../components/BannerSlider';
import PromoCollage from '../components/PromoCollage';

// ilovehana-style mixed aspect ratios: tall (2 rows) / medium / small panels.
const CATEGORY_TILES: Array<{ slug: string; size: 'tall' | 'medium' | 'small' }> = [
  { slug: 'women', size: 'tall' },
  { slug: 'accessory', size: 'medium' },
  { slug: 'hats', size: 'small' },
  { slug: 'bag', size: 'medium' },
  { slug: 'sale', size: 'small' },
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

// Dedupe by slug, keeping the first occurrence for each product.
function dedupe(list: Product[]): Product[] {
  const seen = new Set<string>();
  return list.filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)));
}

export default function HomePage() {
  const trending = dedupe(homeSections.popular.map((s) => getProduct(s)).filter(Boolean) as Product[]);
  const newArrivals = dedupe(homeSections.new.map((s) => getProduct(s)).filter(Boolean) as Product[]);
  const bestSellers = dedupe(homeSections.featured.map((s) => getProduct(s)).filter(Boolean) as Product[]);
  const under25 = dedupe([...products].sort((a, b) => a.price - b.price))
    .filter((p) => p.price < 25)
    .slice(0, 8);
  const saleItems = dedupe(productsByCategory('sale')).slice(0, 8);

  return (
    <>
      <BannerSlider />

      <div className="trust-bar container" aria-label="Store promises">
        <span>Free U.S. shipping on orders over $100</span>
        <span>Easy 30-day returns</span>
        <span>New styles added weekly</span>
      </div>

      <PromoCollage />

      <section className="container section shop-by">
        <h2 className="section-title center">Shop by Category</h2>
        <div className="category-grid">
          {CATEGORY_TILES.map(({ slug, size }) => {
            const cat = getCategory(slug);
            if (!cat) return null;
            return (
              <Link
                key={slug}
                to={`/category/${slug}`}
                className={`category-tile ${size}`}
              >
                <img src={cat.image} alt={cat.name} loading="lazy" />
                <span className="category-tile-label">
                  <strong>{cat.name}</strong>
                </span>
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
