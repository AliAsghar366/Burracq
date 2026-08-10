import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProduct, getCategory, productsByCategory } from '../data/catalog';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';

export default function ProductPage() {
  const { slug = '' } = useParams();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

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
  const related = productsByCategory(product.category)
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);

  const handleAdd = () => {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
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
          <img src={product.image} alt={product.name} />
        </div>
        <div className="product-info">
          <h1>{product.name}</h1>
          <p className="product-price">
            {product.price > 0 ? `$${product.price.toFixed(2)}` : 'Wholesale price on request'}
          </p>
          <p className="product-price-note">Bulk pricing available — contact us for case rates.</p>
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
          <button type="button" className="btn btn-primary btn-lg" onClick={handleAdd}>
            {added ? 'Added ✓' : 'Add to Cart'}
          </button>
          <div className="product-desc">
            <h2>Description</h2>
            <p dangerouslySetInnerHTML={{ __html: product.description }} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="section">
          <h2 className="section-title">Related Products</h2>
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
