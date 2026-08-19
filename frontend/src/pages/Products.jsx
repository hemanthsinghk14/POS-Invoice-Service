import { useEffect, useState } from "react";
import api from "../services/api";

function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/products?page=1&pageSize=100"
      );

      setProducts(response.data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const query = search.trim();

    if (!query) {
      loadProducts();
      return;
    }

    try {
      setSearching(true);
      setError("");

      const response = await api.get(
        `/products/search?q=${encodeURIComponent(query)}&page=1&pageSize=100`
      );

      setProducts(response.data.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.error ||
          "Failed to search products."
      );
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setSearch("");
    loadProducts();
  };

  if (loading) {
    return <p>Loading products...</p>;
  }

  return (
    <div>
      <h2>Products</h2>

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px",
            background: "#fee2e2",
            color: "#991b1b",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>
      )}

      {/* SEARCH */}

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          maxWidth: "700px",
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSearch();
            }
          }}
          placeholder="Search by name, SKU or barcode"
          style={inputStyle}
        />

        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          style={buttonStyle}
        >
          {searching ? "Searching..." : "Search"}
        </button>

        <button
          type="button"
          onClick={handleClear}
          style={clearButtonStyle}
        >
          Clear
        </button>
      </div>

      {/* PRODUCTS TABLE */}

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th style={cellStyle}>ID</th>
              <th style={cellStyle}>Name</th>
              <th style={cellStyle}>SKU</th>
              <th style={cellStyle}>Price</th>
              <th style={cellStyle}>GST</th>
              <th style={cellStyle}>Stock</th>
              <th style={cellStyle}>Status</th>
            </tr>
          </thead>

          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    ...cellStyle,
                    textAlign: "center",
                    padding: "24px",
                  }}
                >
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td style={cellStyle}>
                    {product.id}
                  </td>

                  <td style={cellStyle}>
                    {product.name}
                  </td>

                  <td style={cellStyle}>
                    {product.sku}
                  </td>

                  <td style={cellStyle}>
                    ₹{product.price}
                  </td>

                  <td style={cellStyle}>
                    {product.gstRate}%
                  </td>

                  <td style={cellStyle}>
                    {product.stock}
                  </td>

                  <td style={cellStyle}>
                    {product.isActive
                      ? "Active"
                      : "Inactive"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle = {
  flex: 1,
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "15px",
  boxSizing: "border-box",
};

const buttonStyle = {
  padding: "10px 16px",
  border: "none",
  borderRadius: "8px",
  background: "#111827",
  color: "white",
  cursor: "pointer",
  fontWeight: "600",
};

const clearButtonStyle = {
  padding: "10px 16px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  background: "white",
  color: "#374151",
  cursor: "pointer",
  fontWeight: "600",
};

const cellStyle = {
  padding: "12px 14px",
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
};

export default Products;