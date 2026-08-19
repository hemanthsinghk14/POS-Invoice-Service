import { useState } from "react";
import "./App.css";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import CreateInvoice from "./pages/CreateInvoice";
import Invoices from "./pages/Invoices";

function App() {
  const [page, setPage] = useState("dashboard");

  const renderPage = () => {
   if (page === "products") {
  return <Products />;
}

if (page === "customers") {
  return <Customers />;
}
if (page === "create-invoice") {
  return <CreateInvoice />;
}
if (page === "invoices") {
  return <Invoices />;
}

    return (
      <>
        <h2>Dashboard</h2>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <span>Products</span>
            <strong>View Products</strong>
          </div>

          <div className="dashboard-card">
            <span>Customers</span>
            <strong>View Customers</strong>
          </div>

          <div className="dashboard-card">
            <span>Invoices</span>
            <strong>Create Invoice</strong>
          </div>
        </div>

        <section className="welcome-section">
          <h3>Welcome to POS Invoice Service</h3>
          <p>
            Manage products, customers, inventory, and invoices from one
            place.
          </p>
        </section>
      </>
    );
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>POS Invoice Service</h1>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <nav>
            <button
              className={`nav-item ${
                page === "dashboard" ? "active" : ""
              }`}
              onClick={() => setPage("dashboard")}
            >
              Dashboard
            </button>

            <button
              className={`nav-item ${
                page === "products" ? "active" : ""
              }`}
              onClick={() => setPage("products")}
            >
              Products
            </button>

            <button
  className={`nav-item ${
    page === "customers" ? "active" : ""
  }`}
  onClick={() => setPage("customers")}
>
  Customers
</button>

            <button
  className={`nav-item ${
    page === "create-invoice" ? "active" : ""
  }`}
  onClick={() => setPage("create-invoice")}
>
  Create Invoice
</button>

            <button
  className={`nav-item ${
    page === "invoices" ? "active" : ""
  }`}
  onClick={() => setPage("invoices")}
>
  Invoices
</button>
          </nav>
        </aside>

        <main className="main-content">{renderPage()}</main>
      </div>
    </div>
  );
}

export default App;