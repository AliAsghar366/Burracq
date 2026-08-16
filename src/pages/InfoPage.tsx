export interface InfoSection {
  heading?: string;
  paragraphs: string[];
}

export interface InfoContent {
  title: string;
  intro?: string;
  sections: InfoSection[];
  faq?: boolean;
}

export const ABOUT_CONTENT: InfoContent = {
  title: 'About Us',
  intro:
    'BURACQ is an independent online store for fashion, accessories and everyday finds. We bring together fresh styles — hats, bags, accessories, apparel and more — in one easy place, at prices you\u2019ll love.',
  sections: [
    {
      heading: 'What we\u2019re about',
      paragraphs: [
        'We believe everyday style should be easy. Our goal is a curated selection of pieces that are fun to wear, simple to shop and kind to your budget.',
      ],
    },
    {
      heading: 'Our approach',
      paragraphs: [
        'We work directly with trusted suppliers to source the items we carry, and we handle the presentation, pricing and customer experience ourselves. That means one clean storefront, consistent quality and a shopping experience built entirely around you.',
      ],
    },
    {
      heading: 'Every item, sold individually',
      paragraphs: [
        'Everything on BURACQ is sold as a single unit — no case packs, no minimum quantities. You pick the pieces you want and the quantity you need, and we take care of the rest.',
      ],
    },
    {
      heading: '24/7 customer support',
      paragraphs: [
        'Our customer support team is available 24 hours a day, 7 days a week. Email us at burrackbyrw@gmail.com or call +1 (240) 615-6110 — we\u2019re always here to help.',
      ],
    },
    {
      heading: 'Our promise',
      paragraphs: [
        'Every order is checked and packed with care, and we\u2019re here to help if anything isn\u2019t right. Shop with confidence — we\u2019re always here to help.',
      ],
    },
  ],
};

export const SHIPPING_CONTENT: InfoContent = {
  title: 'Shipping Policy',
  intro:
    'Here\u2019s everything you need to know about how your order gets to you \u2014 times, costs and what to expect after you check out.',
  sections: [
    {
      heading: 'Processing time',
      paragraphs: [
        'Orders are processed within 1\u20132 business days after confirmation. You\u2019ll receive an email once your order ships, with tracking information when available.',
      ],
    },
    {
      heading: 'Shipping cost & timing',
      paragraphs: [
        'We ship within the United States. Shipping is FREE on orders of $100 or more; otherwise a flat $8 shipping fee applies.',
        'Standard delivery typically takes 3\u20137 business days after your order ships, depending on your location.',
      ],
    },
    {
      heading: 'Where we ship',
      paragraphs: [
        'We currently ship to addresses within the United States, including PO boxes (via USPS where available). We do not yet ship internationally.',
      ],
    },
    {
      heading: 'Delays & lost packages',
      paragraphs: [
        'Carrier delays happen occasionally and are outside our control once a package is handed off. If your order hasn\u2019t arrived within 10 business days of shipment, contact us and we\u2019ll help track it down or replace it.',
      ],
    },
  ],
};

export const RETURNS_CONTENT: InfoContent = {
  title: 'Return & Refund Policy',
  intro:
    'We want you to love what you ordered. If something isn\u2019t right, here\u2019s how returns and refunds work.',
  sections: [
    {
      heading: '30-day returns',
      paragraphs: [
        'Unworn, unwashed items in original condition with tags attached can be returned within 30 days of delivery for a refund.',
        'Items that have been worn, washed, altered or damaged by the customer are not eligible for return. Final-sale and clearance items are not eligible.',
      ],
    },
    {
      heading: 'How to start a return',
      paragraphs: [
        'Contact us through the Contact page with your order number and the reason for your return. We\u2019ll confirm the return and give you the address to send it back to.',
        'You\u2019re responsible for return shipping costs unless the item arrived defective or incorrect.',
      ],
    },
    {
      heading: 'Refunds',
      paragraphs: [
        'Once we receive and inspect your return, we\u2019ll process your refund within 5\u20137 business days. Refunds go back to your original payment method, and you\u2019ll get an email when it\u2019s done.',
      ],
    },
    {
      heading: 'Damaged, defective or incorrect items',
      paragraphs: [
        'If your item arrives damaged, defective or is not what you ordered, contact us within 7 days of delivery with photos and we\u2019ll make it right \u2014 including covering return shipping or sending a replacement.',
      ],
    },
  ],
};

export const PRIVACY_CONTENT: InfoContent = {
  title: 'Privacy Policy',
  intro:
    'This policy explains what information we collect, how we use it and the choices you have.',
  sections: [
    {
      heading: 'Information we collect',
      paragraphs: [
        'When you place an order or contact us, we collect the details you provide: your name, shipping address, contact information and order details. We also collect basic technical data (like browser type and pages visited) to keep the store working and improve it.',
      ],
    },
    {
      heading: 'How we use your information',
      paragraphs: [
        'We use your information to process and fulfill orders, respond to questions, and improve your shopping experience. We never sell your personal information.',
      ],
    },
    {
      heading: 'Payments & data security',
      paragraphs: [
        'We take reasonable measures to protect your information. Payment details are handled through secure, reputable payment providers rather than stored by us.',
      ],
    },
    {
      heading: 'Cookies',
      paragraphs: [
        'We use cookies and similar technologies to remember your cart and understand how the store is used. You can disable cookies in your browser, though some features (like your cart) may not work as well.',
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [
        'Questions about this policy? Reach out through the Contact page and we\u2019ll be happy to help.',
      ],
    },
  ],
};

export const TERMS_CONTENT: InfoContent = {
  title: 'Terms & Conditions',
  intro:
    'By using this store and placing an order, you agree to the following terms.',
  sections: [
    {
      heading: 'Orders & payment',
      paragraphs: [
        'All orders are subject to acceptance and availability. Prices are shown in U.S. dollars and include applicable taxes where required. Payment is arranged when we confirm your order.',
      ],
    },
    {
      heading: 'Pricing & product info',
      paragraphs: [
        'We work hard to keep descriptions, images and prices accurate, but occasional errors can occur. If a product is listed at the wrong price, we may cancel or adjust the order and will contact you first.',
      ],
    },
    {
      heading: 'Colors & materials',
      paragraphs: [
        'Items described as assorted colors and styles may vary slightly from the images shown, and monitor settings can affect how colors appear.',
      ],
    },
    {
      heading: 'Limitation of liability',
      paragraphs: [
        'To the fullest extent permitted by law, BURACQ\u2019s liability is limited to the amount you paid for the affected order.',
      ],
    },
    {
      heading: 'Changes to these terms',
      paragraphs: [
        'We may update these terms from time to time. The latest version always applies to new orders.',
      ],
    },
  ],
};

export const FAQ_CONTENT: InfoContent = {
  title: 'Frequently Asked Questions',
  intro:
    'Quick answers to the questions we hear most. Can\u2019t find yours? Contact us and we\u2019ll help.',
  faq: true,
  sections: [
    {
      heading: 'How long does shipping take?',
      paragraphs: [
        'Orders are processed within 1\u20132 business days, then take 3\u20137 business days to arrive within the U.S. You\u2019ll get tracking once your order ships.',
      ],
    },
    {
      heading: 'Is shipping really free?',
      paragraphs: [
        'Yes — free U.S. shipping on orders of $100 or more. Orders under $100 ship for a flat $8.',
      ],
    },
    {
      heading: 'What is your return policy?',
      paragraphs: [
        'Unworn, unwashed items in original condition can be returned within 30 days of delivery. See the Return & Refund Policy for the full details.',
      ],
    },
    {
      heading: 'Are items sold individually?',
      paragraphs: [
        'Yes. Every item on BURACQ is sold as a single unit — just pick the quantity you want at checkout.',
      ],
    },
    {
      heading: 'Do you ship outside the U.S.?',
      paragraphs: [
        'Not yet. We currently ship within the United States only.',
      ],
    },
    {
      heading: 'The colors I received differ from the photos',
      paragraphs: [
        'Items come in assorted colors and styles, and screens can show colors slightly differently. If an item isn\u2019t what you expected, it\u2019s covered by our 30-day return policy.',
      ],
    },
    {
      heading: 'How do I track my order?',
      paragraphs: [
        'We\u2019ll email you a tracking link when your order ships. If you haven\u2019t received it within 10 business days, contact us.',
      ],
    },
  ],
};

export default function InfoPage({ content }: { content: InfoContent }) {
  return (
    <section className="container section info-page">
      <h1>{content.title}</h1>
      {content.intro && <p className="info-intro">{content.intro}</p>}
      {content.sections.map((s, i) => (
        <div key={i} className={content.faq ? 'faq-item' : 'info-section'}>
          {s.heading && <h2>{s.heading}</h2>}
          {s.paragraphs.map((p, j) => (
            <p key={j}>{p}</p>
          ))}
        </div>
      ))}
    </section>
  );
}
