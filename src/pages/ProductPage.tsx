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

// A selectable variation of the product: an image plus its label.
type View = {
  key: string;
  src: string;
  label: string;
  color?: string;
  slug?: string;
};

export default function ProductPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [openSection, setOpenSection] = useState<string>('details');
  const [viewIdx, setViewIdx] = useState(0);

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

  // The variations shown INSIDE the product view. When ilovehana.com provided
  // a per-color image gallery for this product (same CDN), use it — each view
  // is one color with its own photo. Otherwise fall back to the catalog's
  // image-based colorways (each a separate page that shares the supplier code).
  const gallery = product.gallery && product.gallery.length > 1 ? product.gallery : null;
  const views: View[] = gallery
    ? gallery.map((g) => ({
        key: g.src,
        src: g.src,
        label: g.color || 'View',
        color: g.color,
        slug: product.slug,
      }))
    : variants.map((v) => ({
        key: v.slug,
        src: v.image,
        label: v.name,
        slug: v.slug,
      }));

  const view = views[Math.min(viewIdx, views.length - 1)] || views[0];
  const selectedProduct: Product =
    view.slug && view.slug !== product.slug ? getProduct(view.slug) || product : product;
  const selectedName = view.color
    ? view.color
    : view.slug && view.slug !== product.slug
      ? variantNameOf(selectedProduct)
      : '';

  const related = uniqueProducts(productsByCategory(product.category))
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);

  const handleAdd = () => {
    addToCart(
      {
        slug: selectedProduct.slug,
        name: selectedName ? `${selectedProduct.name} — ${selectedName}` : selectedProduct.name,
        price: selectedProduct.price,
        image: selectedProduct.image,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(
      {
        slug: selectedProduct.slug,
        name: selectedName ? `${selectedProduct.name} — ${selectedName}` : selectedProduct.name,
        price: selectedProduct.price,
        image: selectedProduct.image,
      },
      qty
    );
    navigate('/cart');
  };

  const toggle = (key: string) => setOpenSection((cur) => (cur === key ? '' : key));

  const selectView = (i: number) => {
    setViewIdx(i);
    setAdded(false);
  };

  const selectColorChip = (color: string) => {
    const i = views.findIndex((v) => v.color === color);
    if (i >= 0) selectView(i);
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
            key={view.key}
            src={fullImageOf(view.src)}
            alt={view.label && view.label !== 'View' ? `${product.name} — ${view.label}` : product.name}
            loading="eager"
            decoding="async"
            onError={(e) => {
              if (e.currentTarget.src !== PLACEHOLDER) e.currentTarget.src = PLACEHOLDER;
            }}
          />
          {views.length > 1 && (
            <div className="product-thumbs" aria-label="All variations">
              {views.map((v, i) => (
                <button
                  key={v.key}
                  type="button"
                  className={`product-thumb${i === viewIdx ? ' is-active' : ''}`}
                  title={v.label}
                  aria-label={`View ${v.label}`}
                  aria-pressed={i === viewIdx}
                  onClick={() => selectView(i)}
                >
                  <img
                    src={fullImageOf(v.src)}
                    alt={v.label}
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
            {selectedProduct.compareAtPrice != null && (
              <s
                className="price-compare"
                aria-label={`Was $${selectedProduct.compareAtPrice.toFixed(2)}`}
              >
                ${selectedProduct.compareAtPrice.toFixed(2)}
              </s>
            )}
            <span className="price-now">${selectedProduct.price.toFixed(2)}</span>
          </p>
          <p className="product-price-note">
            Free U.S. shipping on orders over $100 • Easy 30-day returns
          </p>

          {views.length > 1 && (
            <div className="variant-picker">
              <div className="variant-picker-label">
                <span>{gallery ? 'Color:' : 'Style:'}</span>
                <strong>{selectedName || view.label || 'One Size'}</strong>
              </div>
              <div className="variant-swatches" role="listbox" aria-label="Variations">
                {views.map((v, i) => (
                  <button
                    key={v.key}
                    type="button"
                    role="option"
                    aria-selected={i === viewIdx}
                    className={`variant-swatch${i === viewIdx ? ' is-active' : ''}`}
                    title={v.label}
                    onClick={() => selectView(i)}
                  >
                    <img
                      src={fullImageOf(v.src)}
                      alt={v.label}
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

          {product.colors && product.colors.length > 0 && (
            <div className="color-list">
              <div className="variant-picker-label">
                <span>Available in:</span>
              </div>
              <ul className="color-chips" aria-label="Available colors">
                {product.colors.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      className={`color-chip${views.some((v) => v.color === c) ? ' is-selectable' : ''}`}
                      onClick={() => selectColorChip(c)}
                    >
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
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
