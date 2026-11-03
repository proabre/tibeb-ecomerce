const pendingShops = [
  { name: 'Aster Threads', owner: 'Selam Bekele', city: 'Addis Ababa' },
  { name: 'Nefse Atelier', owner: 'Marta Haile', city: 'Dire Dawa' },
];

const pendingProducts = [
  { name: 'White Cotton Kemis', shop: 'Aster Threads' },
  { name: 'Gold Tibeb Fabric', shop: 'Nefse Atelier' },
];

const stats = [
  { label: 'Users', value: '8.4k' },
  { label: 'Active shops', value: '154' },
  { label: 'Orders', value: '2.1k' },
  { label: 'Revenue', value: 'ETB 1.6M' },
];

function AdminDashboard() {
  return (
    <div className="page-block">
      <div className="section-heading inline">
        <div>
          <span className="eyebrow">Admin dashboard</span>
          <h2>Marketplace overview</h2>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel-card">
          <h3>Pending shop applications</h3>
          <ul className="list-block">
            {pendingShops.map((shop) => (
              <li key={shop.name}>
                <div>
                  <strong>{shop.name}</strong>
                  <small>{shop.owner}</small>
                </div>
                <span>{shop.city}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel-card">
          <h3>Pending products</h3>
          <ul className="list-block">
            {pendingProducts.map((product) => (
              <li key={product.name}>
                <div>
                  <strong>{product.name}</strong>
                  <small>{product.shop}</small>
                </div>
                <button type="button" className="text-button">
                  Review
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
