import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Filter from '../Components/Filter.jsx';
import ProductCard from '../Components/ProductCard.jsx';
import { useLanguage } from '../useLanguage.js';

function Products({ products, categories, addToCart }) {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedCategory = searchParams.get('category');
  const selectedCategory = requestedCategory && Object.hasOwn(categories, requestedCategory)
    ? requestedCategory
    : 'all';
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recommended');

  const handleCategoryChange = (category) => {
    const nextParams = new URLSearchParams(searchParams);
    if (category === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', category);
    }
    setSearchParams(nextParams);
  };

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
          <span className="eyebrow">{t('Marketplace')}</span>
          <h2>{t('Browse handcrafted essentials')}</h2>
          <p className="catalog-count" aria-live="polite">
            {filteredProducts.length} {t(filteredProducts.length === 1 ? 'product' : 'products')}
          </p>
        </div>
      </div>

      <Filter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
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
            <h3>{t('No products match your filters.')}</h3>
            <p>{t('Try another category or a broader search.')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
