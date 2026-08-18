import { useEffect, useRef, useState } from 'react';

const SLIDES: {
  src: string;
  alt: string;
}[] = [
  {
    src: '/banners/banner-1.jpg',
    alt: 'BURACQ — Find Your Everyday. Luxury bags, watches and accessories.',
  },
  {
    src: '/banners/banner-2.jpg',
    alt: 'BURACQ — New Arrivals. Discover what’s next.',
  },
  {
    src: '/banners/banner-3.jpg',
    alt: 'BURACQ — Simple. Refined. Timeless style, modern living.',
  },
  {
    src: '/banners/banner-4.jpg',
    alt: 'BURACQ — Accessories That Define You. Curated details, effortless style.',
  },
  {
    src: '/banners/banner-5.jpg',
    alt: 'BURACQ — Step Into the Season. Timeless pieces, modern essentials.',
  },
  {
    src: '/banners/banner-6.jpg',
    alt: 'BURACQ — Everyday Essentials, Beautifully Made.',
  },
];

const AUTOPLAY_MS = 5000;

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = (next: number) =>
    setIndex(((next % SLIDES.length) + SLIDES.length) % SLIDES.length);

  // Autoplay: advances every AUTOPLAY_MS, pauses while hovered/focused.
  // Restarts the timer after any manual navigation.
  useEffect(() => {
    if (paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % SLIDES.length),
      AUTOPLAY_MS
    );
    return () => window.clearInterval(timer);
  }, [paused, index]);

  return (
    <section
      className="hero-carousel"
      aria-label="Featured promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
        if (Math.abs(dx) > 48) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="hero-carousel-track">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className={`hero-carousel-slide${i === index ? ' is-active' : ''}`}
            aria-hidden={i !== index}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="hero-carousel-arrow hero-carousel-arrow--prev"
        aria-label="Previous banner"
        onClick={() => go(index - 1)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path fill="currentColor" d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
      </button>
      <button
        type="button"
        className="hero-carousel-arrow hero-carousel-arrow--next"
        aria-label="Next banner"
        onClick={() => go(index + 1)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path fill="currentColor" d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z" />
        </svg>
      </button>

      <div className="hero-carousel-dots" role="tablist" aria-label="Banners">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            className={`hero-carousel-dot${i === index ? ' is-active' : ''}`}
            aria-label={`Go to banner ${i + 1}`}
            aria-current={i === index ? 'true' : undefined}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </section>
  );
}
