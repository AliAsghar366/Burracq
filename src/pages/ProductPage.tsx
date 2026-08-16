import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getProduct,
  getCategory,
  productsByCategory,
  variantsFor,
  variantNameOf,
  uniqueProducts,
  type Product,
} from '../data/catalog';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { fullImageOf } from '../lib/images';

const PLACEHOLDER = '/placeholder.svg';

function AccordionSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`accordion-item${open ? ' open' : ''}`}>
      <button type="button" className="accordion-head" onClick={onToggle} aria-expanded={open}>
        <span>{title}</span>
        <span className="accordion-icon" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && <div className="accordion-body">{children}</div>}
    </div>
  );
}

export default function ProductPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [openSection, setOpenSection] = useState<string>('details');
  const [selectedSlug, setSelectedSlug] = useState(slug);

  const product = getProduct(slug);

  if (!product) {
    return (
      <section className="container section">
        <h1>Product not found</h1>
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </section>
    );
  }

  const category = getCategory(product.category);
  const variants = variantsFor(product);

  // The variation currently being viewed. Clicking a swatch/thumbnail swaps
  // the main image in place; the picked variation is what gets added to cart.
  const selected: Product = (() => {
    if (selectedSlug === product.slug) return product;
    const v = variants.find((x) => x.slug === selectedSlug);
    if (v) {
      const p = getProduct(v.slug);
      if (p) return p;
    }
    return product;
  })();
  const selectedName = selectedSlug === product.slug ? '' : variantNameOf(selected);
  const related = uniqueProducts(productsByCategory(product.category))
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);

  const handleAdd = () => {
    addToCart(
      {
        slug: selected.slug,
        name: selectedName ? `${selected.name} — ${selectedName}` : selected.name,
        price: selected.price,
        image: selected.image,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(
      {
        slug: selected.slug,
        name: selectedName ? `${selected.name} — ${selectedName}` : selected.name,
        price: selected.price,
        image: selected.image,
      },
      qty
    );
    navigate('/cart');
  };

  const toggle = (key: string) => setOpenSection((cur) => (cur === key ? '' : key));

  const selectVariant = (vSlug: string) => {
    setSelectedSlug(vSlug);
    setAdded(false);
  };

  return (
    <section className="container section">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        {category && <Link to={`/category/${category.slug}`}>{category.name}</Link>}
        <span>/</span>
        <span>{product.name}</span>
      </nav>

      <div className="product-view">
        <div className="product-media">
          <img
            key={selected.slug}
            src={fullImageOf(selected.image)}
            alt={selectedName ? `${product.name} — ${selectedName}` : product.name}
            loading="eager"
            decoding="async"
            onError={(e) => {
              if (e.currentTarget.src !== PLACEHOLDER) e.currentTarget.src = PLACEHOLDER;
            }}
          />
          {variants.length > 1 && (
            <div className="product-thumbs" aria-label="All variations">
              {variants.map((v) => (
                <button
                  key={v.slug}
                  type="button"
                  className={`product-thumb${v.slug === selected.slug ? ' is-active' : ''}`}
                  title={v.name}
                  aria-label={`View ${v.name}`}
                  aria-pressed={v.slug === selected.slug}
                  onClick={() => selectVariant(v.slug)}
                >
                  <img
                    src={fullImageOf(v.image)}
                    alt={v.name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      if (e.currentTarget.src !== PLACEHOLDER) e.currentTarget.src = PLACEHOLDER;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="product-info">
          <h1>{product.name}</h1>
          {product.sku && <p className="product-sku">Style #{product.sku}</p>}
          <p className="product-price">
            {selected.compareAtPrice != null && (
              <s
                className="price-compare"
                aria-label={`Was $${selected.compareAtPrice.toFixed(2)}`}
              >
                ${selected.compareAtPrice.toFixed(2)}
              </s>
            )}
            <span className="price-now">${selected.price.toFixed(2)}</span>
          </p>
          <p className="product-price-note">
            Free U.S. shipping on orders over $100 • Easy 30-day returns
          </p>

          {variants.length > 1 && (
            <div className="variant-picker">
              <div className="variant-picker-label">
                <span>Color:</span>
                <strong>{selectedName || variantNameOf(product)}</strong>
              </div>
              <div className="variant-swatches" role="listbox" aria-label="Color">
                {variants.map((v) => (
                  <button
                    key={v.slug}
                    type="button"
                    role="option"
                    aria-selected={v.slug === selected.slug}
                    className={`variant-swatch${v.slug === selected.slug ? ' is-active' : ''}`}
                    title={v.name}
                    onClick={() => selectVariant(v.slug)}
                  >
                    <img
                      src={fullImageOf(v.image)}
                      alt={v.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        if (e.currentTarget.src !== PLACEHOLDER) e.currentTarget.src = PLACEHOLDER;
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="qty-row">
            <label htmlFor="qty">Quantity</label>
            <div className="stepper">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                −
              </button>
              <input
                id="qty"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              />
              <button type="button" onClick={() => setQty((q) => q + 1)}>
                +
              </button>
            </div>
          </div>

          <div className="buy-row">
            <button type="button" className="btn btn-primary btn-lg" onClick={handleAdd}>
              {added ? 'Added to Cart ✓' : 'Add to Cart'}
            </button>
            <button type="button" className="btn btn-outline-dark btn-lg" onClick={handleBuyNow}>
              Buy Now
            </button>
          </div>

          <div className="accordion">
            <AccordionSection
              title="Product Details"
              open={openSection === 'details'}
              onToggle={() => toggle('details')}
            >
              <p dangerouslySetInnerHTML={{ __html: product.description }} />
            </AccordionSection>
            <AccordionSection
              title="Shipping & Returns"
              open={openSection === 'shipping'}
              onToggle={() => toggle('shipping')}
            >
              <p>
                Orders are processed within 1–2 business days and typically arrive in 3–7 business
                days within the U.S. Shipping is free on orders over $100; otherwise a flat $8
                applies.
              </p>
              <p>
                Not quite right? Unworn items in original condition can be returned within 30 days
                of delivery. See our <Link to="/shipping-policy">Shipping Policy</Link> and{' '}
                <Link to="/returns">Return &amp; Refund Policy</Link> for details.
              </p>
            </AccordionSection>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="section">
          <h2 className="section-title">You May Also Like</h2>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
