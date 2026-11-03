export const productCatalog = [
  {
    id: 'p1',
    slug: 'habesha-kemis-ivory-gold',
    name: 'Habesha Kemis',
    category: 'habesha-kemis',
    price: 4200,
    material: 'Cotton and handwoven trim',
    craftsmanship: 'handmade',
    description:
      'Elegant ivory cotton Habesha Kemis with green and gold embroidery designed for weddings and celebrations.',
    images: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
    ],
    shop: 'Nefse Atelier',
    rating: 4.9,
    stock: 8,
    variants: [
      { id: 'v1', label: 'Small', price: 4200, inStock: true },
      { id: 'v2', label: 'Medium', price: 4200, inStock: true },
      { id: 'v3', label: 'Large', price: 4500, inStock: true },
    ],
  },
  {
    id: 'p2',
    slug: 'tibeb-fabric-gold-thread',
    name: 'Tibeb Fabric',
    category: 'tibeb-fabric',
    price: 3100,
    material: 'Premium woven cotton',
    craftsmanship: 'mixed',
    description:
      'A richly patterned tibeb fabric with traditional Ethiopian motifs and a soft hand-feel.',
    images: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    ],
    shop: 'Addis Loom',
    rating: 4.8,
    stock: 14,
    variants: [
      { id: 'v4', label: '2m', price: 3100, inStock: true },
      { id: 'v5', label: '3m', price: 4200, inStock: true },
    ],
  },
  {
    id: 'p3',
    slug: 'netela-wrap-ceremony',
    name: 'Netela Wrap',
    category: 'shawl',
    price: 1800,
    material: 'Sheer cotton voile',
    craftsmanship: 'handmade',
    description:
      'Lightweight ceremony wrap with graceful drape and embroidered edges for festive moments.',
    images: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
    ],
    shop: 'Aster Threads',
    rating: 4.7,
    stock: 11,
    variants: [
      { id: 'v6', label: 'Natural', price: 1800, inStock: true },
      { id: 'v7', label: 'Cream', price: 1900, inStock: true },
    ],
  },
  {
    id: 'p4',
    slug: 'traditional-jewelry-set',
    name: 'Traditional Jewelry Set',
    category: 'accessories',
    price: 2600,
    material: 'Brass and beads',
    craftsmanship: 'machine-made',
    description:
      'Hand-finished Ethiopian-inspired jewelry set that elevates any traditional outfit.',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    ],
    shop: 'Ethiopian Heritage',
    rating: 4.6,
    stock: 6,
    variants: [
      { id: 'v8', label: 'Gold', price: 2600, inStock: true },
      { id: 'v9', label: 'Antique', price: 2750, inStock: true },
    ],
  },
  {
    id: 'p5',
    slug: 'habesha-menswear-ceremonial',
    name: 'Habesha Menswear',
    category: 'menswear',
    price: 4900,
    material: 'Cotton, woven trim',
    craftsmanship: 'handmade',
    description:
      'Festive Ethiopian men’s outfit featuring tailored fit, woven trim, and cultural detailing.',
    images: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
    ],
    shop: 'Giorgis Atelier',
    rating: 4.9,
    stock: 5,
    variants: [
      { id: 'v10', label: 'Medium', price: 4900, inStock: true },
      { id: 'v11', label: 'Large', price: 5200, inStock: true },
    ],
  },
  {
    id: 'p6',
    slug: 'custom-wedding-kemis',
    name: 'Custom Wedding Kemis',
    category: 'custom',
    price: 7500,
    material: 'Custom cotton and embroidery',
    craftsmanship: 'mixed',
    description:
      'Made-to-order wedding dress experience with personalized color, trim, and fit consultation.',
    images: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    ],
    shop: 'Melles Custom House',
    rating: 5.0,
    stock: 3,
    variants: [
      { id: 'v12', label: 'Made to order', price: 7500, inStock: true },
    ],
  },
];

export const categoryLabels = {
  'habesha-kemis': 'Habesha Kemis',
  'tibeb-fabric': 'Tibeb Fabric',
  shawl: 'Shawl',
  accessories: 'Accessories',
  menswear: 'Menswear',
  custom: 'Custom',
};
