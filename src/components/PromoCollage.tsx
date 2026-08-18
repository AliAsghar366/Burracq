import { Link } from 'react-router-dom';
import { getCategory } from '../data/catalog';

/**
 * Homepage promo collage — a mixed-aspect-ratio grid in the style of
 * ilovehana.com: one tall lifestyle panel, a typography panel, and a
 * row of product shots in different shapes.
 */
export default function PromoCollage() {
  const hats = getCategory('hats');
  const bag = getCategory('bag');
  const women = getCategory('women');
  const accessory = getCategory('accessory');
  // Trucker cap photo for the typography panel (ilovehana-style inset).
  const caps = getCategory('baseball-cap');
  const truckerImage = caps?.image || hats?.image || '';

  return (
    <section className="container section promo-collage" aria-label="Featured categories">
      <Link to="/category/hats" className="collage-panel collage-tall">
        <img src={hats?.image} alt="Shop hats" loading="lazy" />
        <span className="collage-label">Hats</span>
      </Link>

      <div className="collage-panel collage-text">
        <div className="collage-text-copy">
          <p className="collage-eyebrow">New in</p>
          <h2>
            Letter
            <br />
            Trucker
            <br />
            Caps
          </h2>
          <p className="collage-sub">Two-tone styles with embroidered lettering.</p>
          <Link to="/category/baseball-cap" className="collage-cta">
            Shop Caps
          </Link>
        </div>
        <img
          className="collage-inset"
          src={truckerImage}
          alt="Trucker cap styles"
          loading="lazy"
        />
      </div>

      <Link to="/category/bag" className="collage-panel collage-small">
        <img src={bag?.image} alt="Shop bags" loading="lazy" />
        <span className="collage-label">Bags</span>
      </Link>

      <Link to="/category/women" className="collage-panel collage-wide">
        <img src={women?.image} alt="Shop women" loading="lazy" />
        <span className="collage-label">Women</span>
      </Link>

      <Link to="/category/accessory" className="collage-panel collage-small">
        <img src={accessory?.image} alt="Shop accessories" loading="lazy" />
        <span className="collage-label">Accessories</span>
      </Link>
    </section>
  );
}
