import { Link } from 'react-router-dom';
import type { Product } from '../data/catalog';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <article className="card">
      <Link to={`/product/${product.slug}`} className="card-media">
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.category === 'sale' && <span className="badge badge-sale">Sale</span>}
        {product.category === 'new' && <span className="badge badge-new">New</span>}
        <span className="card-overlay">
          <button
            type="button"
            className="btn btn-quick"
            onClick={(e) => {
              e.preventDefault();
              addToCart(product, 1);
            }}
          >
            Add to Cart
          </button>
        </span>
      </Link>
      <div className="card-body">
        <h3 className="card-title">
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="card-price">
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
      </div>
    </article>
  );
}
