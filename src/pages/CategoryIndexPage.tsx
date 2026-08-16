import { Link } from 'react-router-dom';
import { categories } from '../data/catalog';

// Group categories into sections for the index page.
const sections: Array<{ title: string; slugs: string[] }> = [
  { title: 'Women', slugs: ['women', 'tops', 'dress', 't-shirts', 'cardigan-kimono', 'ponchos-vest', 'basic-tops', 'bottoms', 'leggings', 'pants', 'shorts', 'skirts', 'sarong', 'intimates', 'bra', 'panty', 'lingerie', 'bodyshaper'] },
  { title: 'Hats', slugs: ['hats', 'beanie', 'baseball-cap', 'cowboy-hats', 'kids-hats', 'beret', 'fedora', 'bucket-hat', 'panama-hat', 'straw-hat', 'headband'] },
  { title: 'Bags', slugs: ['bag', 'handbag', 'clutch', 'pouch-wallet', 'bag-strap'] },
  { title: 'Scarves & Blankets', slugs: ['scarves-and-blankets', 'blanket', 'infinity-scarves', 'oblong-scarves', 'satin-scarves'] },
  { title: 'Gloves & Socks', slugs: ['gloves', 'socks-slippers', 'slippers', 'socks-winter', 'socks-spandex', 'socks-sports', 'socks-children', 'leg-arm-warmer'] },
  { title: 'Accessories', slugs: ['accessory', 'earrings', 'belts', 'hair-accessory', 'keychain', 'necklace', 'bracelet', 'headband-dz', 'ponytail-dz', 'hair-clip-dz', 'earring-dz', 'necklace-bracelet-dz', 'bow-dz', 'accessory-dz', 'tumbler'] },
  { title: 'Collections & More', slugs: ['new', 'patriotic-pride', 'cc', 'cc-kids', 'cc-beanie', 'cc-scarf', 'cc-gloves', 'cc-hat', 'cc-headband', 'cc-cap', 'cc-slippers', 'cc-accessories', 'mens-underwear', 'children-underwear', 'children-apparel', 'bra-bc', 'intimate-accessory', 'panty-spandex', 'sexy-lingerie', 'hosiery', 'beach-towel'] },
  { title: 'Sale', slugs: ['sale'] },
];

export default function CategoryIndexPage() {
  const getCat = (slug: string) => categories.find((c) => c.slug === slug);

  return (
    <section className="container section">
      <h1>All Categories</h1>
      <p className="section-sub">Browse the full BURACQ lineup — {categories.length} categories.</p>

      {sections.map((s) => {
        const sectionCats = s.slugs.map((slug) => getCat(slug)).filter(Boolean);
        if (sectionCats.length === 0) return null;
        return (
          <div key={s.title} className="cat-section">
            <h2 className="cat-section-title">{s.title}</h2>
            <div className="cat-index-grid">
              {sectionCats.map((c) => (
                <Link key={c!.slug} to={`/category/${c!.slug}`} className="cat-index-card">
                  <img src={c!.image} alt={c!.name} loading="lazy" />
                  <span className="cat-index-label">{c!.name}</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
