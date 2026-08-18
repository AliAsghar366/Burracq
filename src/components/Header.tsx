import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { SUB_NAV } from '../data/nav';
import SearchForm from './SearchForm';

export default function Header() {
  const { totalItems } = useCart();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const navRef = useRef<HTMLDivElement>(null);

  // Close the dropdown whenever we navigate.
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
    setExpandedItem(null);
  }, [location.pathname]);

  // Close on outside click / Escape.
  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const open = (label: string) => {
    window.clearTimeout(closeTimer.current);
    setOpenMenu(label);
  };

  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), 160);
  };

  const cancelClose = () => {
    window.clearTimeout(closeTimer.current);
  };

  const isItemActive = (item: (typeof SUB_NAV)[number]) => {
    if (location.pathname === item.to) return true;
    if (location.pathname.startsWith(`${item.to}/`)) return true;
    return item.children?.some((c) => location.pathname === c.to) ?? false;
  };

  const toggleExpanded = (label: string) => {
    setExpandedItem((prev) => (prev === label ? null : label));
  };

  return (
    <header className="site-header">
      <div className="header-main container">
        <div className="header-left">
          {/* mobile hamburger (ilovehana-style drawer) */}
          <button
            className={`mobile-menu-toggle${mobileOpen ? ' is-open' : ''}`}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="mobile-menu-toggleIcon" aria-hidden="true" />
          </button>

          <Link to="/" className="logo" aria-label="BURACQ home">
            <img src="/logo.svg" className="logo-mark" alt="" aria-hidden="true" />
            <span>BURACQ</span>
          </Link>
        </div>

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

      <div className="sub-nav-wrap" ref={navRef} onMouseLeave={scheduleClose}>
        <nav className="sub-nav container" aria-label="Categories">
          {SUB_NAV.map((link) => {
            const active = isItemActive(link);
            const hasChildren = link.children && link.children.length > 0;
            const isOpen = openMenu === link.label;
            return (
              <div
                key={link.label}
                className={`sub-nav-item${isOpen && hasChildren ? ' open' : ''}`}
                onMouseEnter={hasChildren ? () => open(link.label) : undefined}
              >
                <Link
                  to={link.to}
                  className={`sub-nav-link${active ? ' active' : ''}`}
                  aria-haspopup={hasChildren ? 'true' : undefined}
                  aria-expanded={hasChildren ? isOpen : undefined}
                  onClick={() => setOpenMenu(null)}
                >
                  {link.label}
                  {hasChildren && (
                    <svg
                      className="sub-nav-chevron"
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      aria-hidden="true"
                    >
                      <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
                    </svg>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        <div
          className={`mega-menu${openMenu ? ' open' : ''}`}
          aria-hidden={!openMenu}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {SUB_NAV.map((link) => {
            if (!link.children || link.children.length === 0) return null;
            const isOpen = openMenu === link.label;
            return (
              <div
                key={link.label}
                className={`mega-menu-panel${isOpen ? ' open' : ''}`}
                onMouseEnter={() => open(link.label)}
              >
                <div className="container mega-menu-inner">
                  {link.children.map((child) => (
                    <Link
                      key={child.label}
                      to={child.to}
                      className="mega-menu-link"
                      onClick={() => setOpenMenu(null)}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* mobile drawer (ilovehana-style accordion nav) */}
      <div
        id="mobile-nav"
        className={`mobile-nav${mobileOpen ? ' open' : ''}`}
        aria-hidden={!mobileOpen}
      >
        <div
          className="mobile-nav-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
        <div className="mobile-nav-panel" role="dialog" aria-label="Menu">
          <button
            className="mobile-nav-close"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="currentColor" d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>

          <ul className="mobile-nav-list">
            {SUB_NAV.map((link) => {
              const hasChildren = link.children && link.children.length > 0;
              const expanded = expandedItem === link.label;
              const active = isItemActive(link);
              return (
                <li key={link.label} className="mobile-nav-item">
                  <div className="mobile-nav-row">
                    <Link
                      to={link.to}
                      className={`mobile-nav-link${active ? ' active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                    {hasChildren && (
                      <button
                        className={`mobile-nav-toggle${expanded ? ' is-open' : ''}`}
                        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${link.label}`}
                        aria-expanded={expanded}
                        onClick={() => toggleExpanded(link.label)}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                          <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {hasChildren && (
                    <ul className={`mobile-nav-sublist${expanded ? ' open' : ''}`}>
                      {link.children?.map((child) => (
                        <li key={child.label}>
                          <Link
                            to={child.to}
                            className="mobile-nav-sublink"
                            onClick={() => setMobileOpen(false)}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </header>
  );
}
