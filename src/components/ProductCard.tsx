import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Product } from '../data/catalog';
import { variantsFor } from '../data/catalog';
import { useCart } from '../context/CartContext';
import { cardImageOf } from '../lib/images';

// Max swatches shown on a card before collapsing into "+N more".
const MAX_SWATCHES = 6;

const PLACEHOLDER = '/placeholder.svg';

function useProductImage(src: string) {
  const [url, setUrl] = useState(src);
  return {
    src: url,
    onError: () => {
      if (url !== PLACEHOLDER) setUrl(PLACEHOLDER);
    },
  };
}

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const variants = variantsFor(product);
  const img = useProductImage(cardImageOf(product.image));
  const extra = variants.length > MAX_SWATCHES ? variants.length - MAX_SWATCHES : 0;

  return (
    <article className="card">
      <Link to={`/product/${product.slug}`} className="card-media">
        <img
          src={img.src}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onError={img.onError}
        />
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
        {variants.length > 1 && (
          <div className="card-variants" aria-label={`${variants.length} colors available`}>
            {variants.slice(0, MAX_SWATCHES).map((v) => (
              <button
                key={v.slug}
                type="button"
                className={`card-swatch${v.slug === product.slug ? ' is-active' : ''}`}
                title={v.name}
                aria-label={v.name}
                onClick={(e) => {
                  e.preventDefault();
                  if (v.slug !== product.slug) navigate(`/product/${v.slug}`);
                }}
              >
                <img src={cardImageOf(v.image)} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
            {extra > 0 && (
              <span className="card-swatch-more" title={`${extra} more colors`}>
                +{extra}
              </span>
            )}
          </div>
        )}
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
