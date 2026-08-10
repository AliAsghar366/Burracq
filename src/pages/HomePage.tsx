import { Link } from 'react-router-dom';
import { getProduct, homeSections } from '../data/catalog';
import ProductCard from '../components/ProductCard';

const CAROUSEL_SLIDES = [
  {
    image: 'https://cdn11.bigcommerce.com/s-3bk8jm/images/stencil/original/carousel/474/LETTERCAP-2026.jpg?c=2',
    to: '/category/baseball-cap',
  },
];

const FREE_SHIPPING_BANNER =
  'https://cdn11.bigcommerce.com/s-3bk8jm/images/stencil/original/image-manager/freeshipping-300.jpg?t=1711465537';

function ProductSection({ title, slugs }: { title: string; slugs: string[] }) {
  const items = slugs.map((s) => getProduct(s)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  if (items.length === 0) return null;
  return (
    <section className="container section home-section">
      <h2 className="section-title center">{title}</h2>
      <div className="product-grid">
        {items.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="carousel" aria-label="Featured banners">
        {CAROUSEL_SLIDES.map((slide, i) => (
          <Link key={i} to={slide.to} className="carousel-slide">
            <img src={slide.image} alt="" />
          </Link>
        ))}
      </section>

      <div className="fs-strip">
        <img src={FREE_SHIPPING_BANNER} alt="Free shipping on qualifying orders" />
      </div>

      <ProductSection title="Featured Products" slugs={homeSections.featured} />
      <ProductSection title="Most Popular Products" slugs={homeSections.popular} />
      <ProductSection title="New Products" slugs={homeSections.new} />
    </>
  );
}
