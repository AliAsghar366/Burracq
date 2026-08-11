import { useEffect, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import CategoryIndexPage from './pages/CategoryIndexPage';
import SearchPage from './pages/SearchPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import InfoPage, {
  ABOUT_CONTENT,
  SHIPPING_CONTENT,
  RETURNS_CONTENT,
  PRIVACY_CONTENT,
  TERMS_CONTENT,
  FAQ_CONTENT,
} from './pages/InfoPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminApp from './pages/admin/AdminApp';
import { insertView } from './lib/supabase';
import { currentRegion } from './lib/region';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Records storefront page views for the admin analytics panel. The /admin
// area itself is never tracked. Fire-and-forget, rate-limited per session.
function ViewTracker() {
  const { pathname } = useLocation();
  const lastTrack = useRef(0);

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    const now = Date.now();
    if (now - lastTrack.current < 4000) return;
    lastTrack.current = now;

    let sessionId = '';
    try {
      sessionId = sessionStorage.getItem('burracq-session') || '';
      if (!sessionId) {
        sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem('burracq-session', sessionId);
      }
    } catch {
      // private mode etc.
    }

    insertView({
      path: pathname,
      region: currentRegion(),
      session_id: sessionId,
      user_agent: (navigator.userAgent || '').slice(0, 120),
    }).catch(() => {
      // analytics are best-effort; never block navigation
    });
  }, [pathname]);

  return null;
}

export default function App() {
  const location = useLocation();

  return (
    <div className="app">
      <ScrollToTop />
      <ViewTracker />
      <Header />
      <main className="main" key={location.pathname}>
        <div className="page-fade">
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/categories" element={<CategoryIndexPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/about" element={<InfoPage content={ABOUT_CONTENT} />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/shipping-policy" element={<InfoPage content={SHIPPING_CONTENT} />} />
            <Route path="/returns" element={<InfoPage content={RETURNS_CONTENT} />} />
            <Route path="/privacy" element={<InfoPage content={PRIVACY_CONTENT} />} />
            <Route path="/terms" element={<InfoPage content={TERMS_CONTENT} />} />
            <Route path="/faq" element={<InfoPage content={FAQ_CONTENT} />} />
            <Route path="/admin" element={<AdminApp />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
}
