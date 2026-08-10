import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { SUB_NAV } from '../data/nav';
import SearchForm from './SearchForm';

export default function Header() {
  const { totalItems } = useCart();

  return (
    <header className="site-header">
      <div className="header-main container">
        <Link to="/" className="logo" aria-label="BURRACQ home">
          <img src="/logo.svg" className="logo-mark" alt="" aria-hidden="true" />
          <span>BURRACQ</span>
        </Link>

        <SearchForm />

        <div className="header-account">
          <Link to="/cart" className="cart-link" aria-label={`Cart with ${totalItems} items`}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                fill="currentColor"
                d="M17.21 9l-4.38-6.56a1 1 0 0 0-.83-.44c-.32 0-.64.14-.83.44L6.79 9H2c-.55 0-1 .45-1 1 0 .09.01.18.04.27l2.54 9.27c.23.84 1 1.46 1.92 1.46h13c.92 0 1.69-.62 1.93-1.46l2.54-9.27L23 10c0-.55-.45-1-1-1h-4.79zM9 9l3-4.5L15 9H9zm3 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
              />
            </svg>
            <span className="cart-count-text">({totalItems})</span>
          </Link>
        </div>
      </div>

      <nav className="sub-nav container" aria-label="Categories">
        {SUB_NAV.map((link) => (
          <NavLink
            key={link.label}
            to={link.to}
            className={({ isActive }) => (isActive ? 'sub-nav-link active' : 'sub-nav-link')}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
