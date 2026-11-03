const sales = [
  { label: 'Orders', value: '68' },
  { label: 'Revenue', value: 'ETB 328k' },
  { label: 'Inventory', value: '116 units' },
  { label: 'Pending', value: '12' },
];

const recentOrders = [
  { id: 'TIB-2345', customer: 'Aster M.', status: 'Ready for pickup' },
  { id: 'TIB-2348', customer: 'Biniam T.', status: 'Preparing' },
  { id: 'TIB-2350', customer: 'Yordan A.', status: 'Dispatched' },
];

function ShopDashboards() {
  return (
    <div className="page-block">
      <div className="section-heading inline">
        <div>
          <span className="eyebrow">Seller dashboard</span>
          <h2>Manage your shop</h2>
        </div>
      </div>

      <div className="stats-grid">
        {sales.map((stat) => (
          <div key={stat.label} className="stat-card">
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel-card">
          <h3>Recent orders</h3>
          <ul className="list-block">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <div>
                  <strong>{order.id}</strong>
                  <small>{order.customer}</small>
                </div>
                <span>{order.status}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel-card">
          <h3>Inventory snapshot</h3>
          <ul className="list-block compact-list">
            <li><span>Habesha Kemis</span><strong>18</strong></li>
            <li><span>Tibeb Fabric</span><strong>24</strong></li>
            <li><span>Netela Wrap</span><strong>12</strong></li>
            <li><span>Accessories</span><strong>7</strong></li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default ShopDashboards;
