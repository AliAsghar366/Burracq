import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProduct, getCategory, productsByCategory, type ProductVariant } from '../data/catalog';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { sanitizeHtml } from '../lib/sanitize';

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
  // The active (selected) variant — the page swaps its image/price in place.
  const [activeSlug, setActiveSlug] = useState(slug);
  // The exact color option picked (same-product color variants swap only
  // the image; sibling-product variants also swap the price/name).
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const baseProduct = getProduct(slug);

  // Reset to the URL product when navigating between product pages.
  useEffect(() => {
    setActiveSlug(slug);
    setSelectedVariant(null);
    setQty(1);
    setAdded(false);
  }, [slug]);

  if (!baseProduct) {
    return (
      <section className="container section">
        <h1>Product not found</h1>
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </section>
    );
  }

  // Use the selected variant's own data (name/price/image) when one is chosen.
  const product = getProduct(activeSlug) ?? baseProduct;
  const category = getCategory(baseProduct.category);
  const related = productsByCategory(baseProduct.category)
    .filter((p) => p.slug !== baseProduct.slug)
    .slice(0, 4);

  const variants = baseProduct.variants || [];
  const currentVariant = variants.find((v) => v.slug === product.slug);
  const variantLabel =
    selectedVariant?.label || currentVariant?.label || variants[0]?.label || '';
  // A picked color option can carry its own photo (same-product variant).
  const displayImage = selectedVariant?.image || product.image;

  const handleSelectVariant = (v: ProductVariant) => {
    setSelectedVariant(v);
    setActiveSlug(v.slug);
    setAdded(false);
  };

  const handleAdd = () => {
    addToCart({ ...product, image: displayImage }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart({ ...product, image: displayImage }, qty);
    navigate('/cart');
  };

  const toggle = (key: string) => setOpenSection((cur) => (cur === key ? '' : key));

  return (
    <section className="container section">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        {category && <Link to={`/category/${category.slug}`}>{category.name}</Link>}
        <span>/</span>
        <span>{baseProduct.name}</span>
      </nav>

      <div className="product-view">
        <div className="product-media">
          <img
            key={`${product.slug}-${variantLabel}`}
            src={displayImage}
            alt={product.name}
            className="product-main-img"
          />
          {variantLabel && <span className="product-variant-tag">{variantLabel}</span>}
        </div>
        <div className="product-info">
          <h1>{baseProduct.name}</h1>
          {baseProduct.sku && <p className="product-sku">Style #{baseProduct.sku}</p>}
          <p className="product-price">
            {product.compareAtPrice != null && (
              <s
                className="price-compare"
                aria-label={`Was $${product.compareAtPrice.toFixed(2)}`}
              >
                ${product.compareAtPrice.toFixed(2)}
              </s>
            )}
            <span className="price-now">${product.price.toFixed(2)}</span>
          </p>
          <p className="product-price-note">
            Free U.S. shipping on orders over $100 • Easy 30-day returns
          </p>

          {variants.length > 0 && (
            <div className="variant-row">
              <span className="variant-label">
                {variantLabel ? `Color / Style: ${variantLabel}` : 'Color / Style'}
              </span>
              <div className="swatches" role="group" aria-label="Choose color or style">
                {variants.map((v) => {
                  const selected = selectedVariant
                    ? v.slug === selectedVariant.slug && v.label === selectedVariant.label
                    : v.slug === product.slug;
                  return (
                    <button
                      key={`${v.slug}-${v.label}`}
                      type="button"
                      className={`swatch${selected ? ' selected' : ''}`}
                      title={v.label}
                      aria-label={`${v.label}${selected ? ' (selected)' : ''}`}
                      aria-pressed={selected}
                      onClick={() => handleSelectVariant(v)}
                    >
                      <img src={v.image} alt={v.label} loading="lazy" />
                    </button>
                  );
                })}
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
              <p dangerouslySetInnerHTML={{ __html: sanitizeHtml(baseProduct.description) }} />
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
              <ProductCard key={`${p.category}-${p.slug}`} product={p} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
