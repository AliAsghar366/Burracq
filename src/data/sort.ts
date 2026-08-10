// Sort options matching the original site's "Sort By:" dropdown.
export type SortKey =
  | 'featured'
  | 'newest'
  | 'bestselling'
  | 'alphaasc'
  | 'alphadesc'
  | 'byreview'
  | 'priceasc'
  | 'pricedesc';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured Items' },
  { value: 'newest', label: 'Newest Items' },
  { value: 'bestselling', label: 'Best Selling' },
  { value: 'alphaasc', label: 'A to Z' },
  { value: 'alphadesc', label: 'Z to A' },
  { value: 'byreview', label: 'By Review' },
  { value: 'priceasc', label: 'Price: Ascending' },
  { value: 'pricedesc', label: 'Price: Descending' },
];
