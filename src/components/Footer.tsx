import { Link } from 'react-router-dom';
import { SUB_NAV } from '../data/nav';

// Nav links spread across three columns for a clean look.
const NAV_COLUMNS = [
  SUB_NAV.slice(0, 5),
  SUB_NAV.slice(5, 9),
  SUB_NAV.slice(9, 13),
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
          <p className="footer-tagline">Wholesale winter essentials.</p>
          <p className="footer-desc">
            Beanies, scarves, gloves and caps in bulk — for retailers, boutiques and bulk buyers.
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
        </div>
      </div>

      <div className="footer-copyright">
        <p>© {new Date().getFullYear()} BURRACQ. All rights reserved.</p>
      </div>
    </footer>
  );
}
