import { useLanguage } from '../useLanguage.js';

function Filter({ categories, selectedCategory, onCategoryChange, search, onSearchChange, sortBy, onSortByChange }) {
  const { t } = useLanguage();

  return (
    <div className="filter-panel">
      <div className="search-box">
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('Search products')}
          aria-label={t('Search products')}
        />
      </div>

      <div className="filter-controls">
        <select value={selectedCategory} onChange={(event) => onCategoryChange(event.target.value)}>
          <option value="all">{t('All categories')}</option>
          {Object.entries(categories).map(([value, label]) => (
            <option key={value} value={value}>
              {t(label)}
            </option>
          ))}
        </select>

        <select value={sortBy} onChange={(event) => onSortByChange(event.target.value)}>
          <option value="recommended">{t('Recommended')}</option>
          <option value="price-low">{t('Price: Low to high')}</option>
          <option value="price-high">{t('Price: High to low')}</option>
          <option value="rating">{t('Top rated')}</option>
        </select>
      </div>
    </div>
  );
}

export default Filter;
