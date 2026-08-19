import { useEffect, useState } from "react";
import api from "../services/api";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/customers");

        setCustomers(response.data.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load customers.");
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  if (loading) {
    return <p>Loading customers...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h2>Customers</h2>

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
              <th style={cellStyle}>Phone</th>
              <th style={cellStyle}>Email</th>
              <th style={cellStyle}>GSTIN</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td style={cellStyle}>{customer.id}</td>
                <td style={cellStyle}>{customer.name}</td>
                <td style={cellStyle}>{customer.phone}</td>
                <td style={cellStyle}>{customer.email}</td>
                <td style={cellStyle}>
                  {customer.gstin || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cellStyle = {
  padding: "12px 14px",
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
};

export default Customers;