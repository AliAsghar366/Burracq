import { Link } from 'react-router-dom';
import { SUB_NAV } from '../data/nav';

// Nav links spread across two columns; store links in a third.
const NAV_COLUMNS = [SUB_NAV.slice(0, 3), SUB_NAV.slice(3)];

const STORE_LINKS = [
  { label: 'About Us', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
  { label: 'Shipping Policy', to: '/shipping-policy' },
  { label: 'Returns & Refunds', to: '/returns' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'FAQ', to: '/faq' },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-brand-block">
          <span className="logo footer-logo">
            <img src="/logo.svg" className="logo-mark" alt="" aria-hidden="true" />
            <span>BURRACQ</span>
          </span>
          <p className="footer-tagline">Fashion, Accessories &amp; Everyday Finds</p>
          <p className="footer-desc">
            Fresh styles at prices you&apos;ll love — hats, bags, accessories and everyday
            essentials, all in one place.
          </p>
        </div>

        <div className="footer-nav-columns">
          {NAV_COLUMNS.map((col, i) => (
            <ul className="footer-list" key={i}>
              {col.map((link) => (
                <li key={link.label}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          ))}
          <ul className="footer-list">
            {STORE_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="footer-copyright">
        <p>© {new Date().getFullYear()} BURRACQ. All rights reserved.</p>
      </div>
    </footer>
  );
}
