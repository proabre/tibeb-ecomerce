import { useMemo, useState } from 'react';
import Filter from '../Components/Filter.jsx';
import ProductCard from '../Components/ProductCard.jsx';

function Products({ products, categories, addToCart }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recommended');

  const filteredProducts = useMemo(() => {
    const nextProducts = products.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const query = search.trim().toLowerCase();
      const matchesSearch = !query || [product.name, product.material, product.shop, product.description].join(' ').toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });

    switch (sortBy) {
      case 'price-low':
        return [...nextProducts].sort((a, b) => a.price - b.price);
      case 'price-high':
        return [...nextProducts].sort((a, b) => b.price - a.price);
      case 'rating':
        return [...nextProducts].sort((a, b) => b.rating - a.rating);
      default:
        return nextProducts;
    }
  }, [products, search, selectedCategory, sortBy]);

  return (
    <div className="page-block">
      <div className="section-heading inline">
        <div>
          <span className="eyebrow">Marketplace</span>
          <h2>Browse handcrafted essentials</h2>
        </div>
      </div>

      <Filter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortByChange={setSortBy}
      />

      <div className="product-grid">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
          ))
        ) : (
          <div className="empty-state">
            <h3>No products match your filters.</h3>
            <p>Try another category or a broader search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
