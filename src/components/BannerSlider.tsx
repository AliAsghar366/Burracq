import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export interface BannerSlide {
  image: string;
  alt: string;
  label: string;
  to: string;
}

// The six ChatGPT-designed store banners. Each banner's button links to the
// product category it promotes on this site (not to the source chat).
const SLIDES: BannerSlide[] = [
  {
    image: '/banners/banner-1.jpg',
    alt: 'BURACQ boho accessories showcase — earrings, scarves and everyday accessories',
    label: 'Shop Accessories',
    to: '/category/accessory',
  },
  {
    image: '/banners/banner-2.jpg',
    alt: 'BURACQ rustic western hats and headwear — cowboy hats',
    label: 'Shop Cowboy Hats',
    to: '/category/cowboy-hats',
  },
  {
    image: '/banners/banner-3.jpg',
    alt: 'BURACQ boho summer fashion — dresses and women’s styles',
    label: 'Shop Women',
    to: '/category/women',
  },
  {
    image: '/banners/banner-4.jpg',
    alt: 'BURACQ bags — handbags and everyday carry',
    label: 'Shop Bags',
    to: '/category/bag',
  },
  {
    image: '/banners/banner-5.jpg',
    alt: 'BURACQ cozy winter essentials — scarves, gloves and warm layers',
    label: 'Shop Winter Essentials',
    to: '/category/accessory',
  },
  {
    image: '/banners/banner-6.jpg',
    alt: 'BURACQ everyday essentials — the boho boutique collection',
    label: 'Shop the Collection',
    to: '/category/cc',
  },
];

const AUTOPLAY_MS = 5500;
const SWIPE_DISTANCE = 48;

export default function BannerSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const touchX = useRef<number | null>(null);

  // Respect reduced-motion: show the first banner and skip autoplay.
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const go = useCallback((dir: 1 | -1) => {
    setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);
  }, []);

  const goTo = useCallback((i: number) => {
    setIndex(i);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion) return;
    timerRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timerRef.current);
  }, [paused, reduceMotion]);

  const onPointerDown = (e: React.PointerEvent) => {
    touchX.current = e.clientX;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (touchX.current === null) return;
    const dx = e.clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > SWIPE_DISTANCE) {
      go(dx < 0 ? 1 : -1);
    }
  };

  return (
    <section
      className="banner-slider"
      aria-label="Featured collections"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <h1 className="visually-hidden">BURACQ — Fashion, Accessories &amp; Everyday Finds</h1>

      <div
        className="banner-slider-viewport"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {SLIDES.map((slide, i) => (
          <div
            key={slide.image}
            className={`banner-slide${i === index ? ' active' : ''}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${SLIDES.length}: ${slide.label}`}
            aria-hidden={i !== index}
          >
            <img
              src={slide.image}
              alt={slide.alt}
              loading={i === 0 ? 'eager' : 'lazy'}
              draggable={false}
            />
            <div className="banner-slide-scrim" aria-hidden="true" />
            <div className="banner-slide-cta">
              <Link
                to={slide.to}
                className="banner-cta-btn"
                tabIndex={i === index ? 0 : -1}
              >
                {slide.label}
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M13 5l7 7-7 7-1.4-1.4 4.6-4.6H4v-2h12.2l-4.6-4.6z"
                  />
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="banner-arrow banner-arrow-prev"
        onClick={() => go(-1)}
        aria-label="Previous banner"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path fill="currentColor" d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z" />
        </svg>
      </button>
      <button
        type="button"
        className="banner-arrow banner-arrow-next"
        onClick={() => go(1)}
        aria-label="Next banner"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path fill="currentColor" d="M8.6 16.6 10 18l6-6-6-6-1.4 1.4 4.6 4.6z" />
        </svg>
      </button>

      <div className="banner-dots" role="group" aria-label="Choose banner">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.image}
            type="button"
            className={`banner-dot${i === index ? ' active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to banner ${i + 1}: ${slide.label}`}
            aria-current={i === index ? 'true' : undefined}
          />
        ))}
      </div>
    </section>
  );
}
