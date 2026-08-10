export interface InfoContent {
  title: string;
  body: string[];
}

export const ABOUT_CONTENT: InfoContent = {
  title: 'About us',
  body: [
    'BURRACQ is a wholesale supplier of winter essentials — beanies, scarves, gloves and caps — built for retailers, boutiques and bulk buyers.',
    'We stock a wide range of styles in bulk quantities, so you can fill your shelves with the products your customers want.',
    'This page is a placeholder — replace it with your company story before launch.',
  ],
};

export const SHIPPING_CONTENT: InfoContent = {
  title: 'Shipping & Return',
  body: [
    'Bulk orders ship from our warehouse after order confirmation.',
    'Shipping cost is calculated at order confirmation and depends on order size and destination.',
    'Returns are accepted for defective or incorrect items within a reasonable time of delivery.',
    'This page is a placeholder — replace it with your shipping and return policy before launch.',
  ],
};

export const TERMS_CONTENT: InfoContent = {
  title: 'Term and Condition',
  body: [
    'By placing an order on BURRACQ you agree to our wholesale terms of sale.',
    'All prices are subject to change and are confirmed at order placement.',
    'Orders are fulfilled subject to stock availability.',
    'This page is a placeholder — replace it with your terms and conditions before launch.',
  ],
};

export default function InfoPage({ content }: { content: InfoContent }) {
  return (
    <section className="container section info-page">
      <h1>{content.title}</h1>
      {content.body.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </section>
  );
}
