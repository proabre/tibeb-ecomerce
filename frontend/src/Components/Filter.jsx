function Filter({ categories, selectedCategory, onCategoryChange, search, onSearchChange, sortBy, onSortByChange }) {
  return (
    <div className="filter-panel">
      <div className="search-box">
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search products"
          aria-label="Search products"
        />
      </div>

      <div className="filter-controls">
        <select value={selectedCategory} onChange={(event) => onCategoryChange(event.target.value)}>
          <option value="all">All categories</option>
          {Object.entries(categories).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select value={sortBy} onChange={(event) => onSortByChange(event.target.value)}>
          <option value="recommended">Recommended</option>
          <option value="price-low">Price: Low to high</option>
          <option value="price-high">Price: High to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>
    </div>
  );
}

export default Filter;
