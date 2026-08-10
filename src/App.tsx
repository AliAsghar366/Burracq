import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import CategoryIndexPage from './pages/CategoryIndexPage';
import SearchPage from './pages/SearchPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import InfoPage, { ABOUT_CONTENT, SHIPPING_CONTENT, TERMS_CONTENT } from './pages/InfoPage';
import NotFoundPage from './pages/NotFoundPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();

  return (
    <div className="app">
      <ScrollToTop />
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
            <Route path="/shipping-returns" element={<InfoPage content={SHIPPING_CONTENT} />} />
            <Route path="/terms" element={<InfoPage content={TERMS_CONTENT} />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
}