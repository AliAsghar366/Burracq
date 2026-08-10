import { Link } from 'react-router-dom';
import { categories } from '../data/catalog';

// Group categories into sections for the index page
const sections: Array<{ title: string; slugs: string[] }> = [
  { title: 'C.C Brand', slugs: ['cc', 'cc-beanie', 'cc-kids', 'cc-scarf', 'cc-gloves', 'cc-hat', 'cc-headband', 'cc-cap', 'cc-slippers', 'cc-accessories'] },
  { title: 'Hats', slugs: ['hats', 'baseball-cap', 'cowboy-hats', 'beanie', 'kids-hats', 'beret', 'fedora', 'bucket-hat', 'panama-hat', 'straw-hat', 'headband'] },
  { title: 'Scarves & Wraps', slugs: ['scarves-and-blankets', 'blanket', 'infinity-scarves', 'oblong-scarves', 'satin-scarves'] },
  { title: 'Gloves & Warmers', slugs: ['gloves', 'cc-gloves', 'leg-arm-warmer'] },
  { title: 'Socks & Slippers', slugs: ['socks-slippers', 'slippers', 'socks-winter', 'socks-spandex', 'socks-sports', 'socks-children', 'cc-slippers'] },
  { title: 'Accessories', slugs: ['accessory', 'belts', 'earrings', 'hair-accessory', 'keychain', 'headband-dz', 'ponytail-dz', 'hair-clip-dz', 'earring-dz', 'necklace-bracelet-dz', 'bow-dz', 'accessory-dz', 'necklace', 'bracelet'] },
  { title: 'Bags & Wallets', slugs: ['bag', 'handbag', 'clutch', 'pouch-wallet', 'bag-strap'] },
  { title: 'Apparel', slugs: ['tops', 't-shirts', 'cardigan-kimono', 'ponchos-vest', 'beach-towel', 'basic-tops', 'dress', 'bottoms', 'leggings', 'sarong', 'pants', 'shorts', 'skirts'] },
  { title: 'Intimates', slugs: ['intimates', 'bra', 'bra-bc', 'intimate-accessory', 'panty', 'panty-spandex', 'mens-underwear', 'children-underwear', 'children-apparel', 'lingerie', 'sexy-lingerie', 'bodyshaper', 'hosiery'] },
  { title: 'More', slugs: ['new', 'patriotic-pride', 'tumbler', 'sale'] },
];

export default function CategoryIndexPage() {
  const getCat = (slug: string) => categories.find((c) => c.slug === slug);

  return (
    <section className="container section">
      <h1>All Categories</h1>
      <p className="section-sub">Browse our full product range — {categories.length} categories.</p>

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