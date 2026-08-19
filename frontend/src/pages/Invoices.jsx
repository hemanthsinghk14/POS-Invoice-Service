import { useState } from "react";
import api from "../services/api";

function Invoices() {
  const [invoiceEnding, setInvoiceEnding] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const findInvoice = async () => {
    const value = invoiceEnding.trim();

    if (!value) {
      setError("Please enter the ending digits of the invoice number.");
      return;
    }

    // Only allow numeric ending digits.
    if (!/^\d+$/.test(value)) {
      setError("Please enter numeric invoice ending digits only.");
      return;
    }

    const invoiceId = Number(value);

    if (!Number.isInteger(invoiceId) || invoiceId < 1) {
      setError("Please enter a valid invoice number ending.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setInvoice(null);

      const response = await api.get(
        `/invoices/${invoiceId}`
      );

      setInvoice(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.error ||
          "Invoice not found."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Invoices</h2>

      <div
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          maxWidth: "800px",
        }}
      >
        <label style={labelStyle}>
          Enter Invoice Number Ending Digits
        </label>

        <p
          style={{
            marginTop: "0",
            marginBottom: "12px",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          Example: enter <strong>0016</strong> for invoice
          INV-20260819-0016.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
          }}
        >
          <input
            type="text"
            inputMode="numeric"
            value={invoiceEnding}
            onChange={(event) =>
              setInvoiceEnding(event.target.value)
            }
            placeholder="e.g. 0016"
            style={inputStyle}
          />

          <button
            type="button"
            onClick={findInvoice}
            disabled={loading}
            style={{
              ...buttonStyle,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Loading..." : "Find Invoice"}
          </button>
        </div>

        {error && (
          <div
            style={{
              marginTop: "20px",
              padding: "12px",
              background: "#fee2e2",
              color: "#991b1b",
              borderRadius: "8px",
            }}
          >
            {error}
          </div>
        )}

        {invoice && (
          <div style={{ marginTop: "30px" }}>
            <h3>
              {invoice.invoiceNumber}
            </h3>

            <p>
              <strong>Database Invoice ID:</strong>{" "}
              {invoice.id}
            </p>

            <p>
              <strong>Customer:</strong>{" "}
              {invoice.customer?.name}
            </p>

            <p>
              <strong>Phone:</strong>{" "}
              {invoice.customer?.phone}
            </p>

            <hr />

            <h4>Items</h4>

            {invoice.items?.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "12px 0",
                  borderBottom:
                    "1px solid #e5e7eb",
                }}
              >
                <strong>
                  {item.product?.name}
                </strong>

                <div>
                  Quantity: {item.quantity}
                </div>

                <div>
                  Unit Price: ₹
                  {item.unitPrice}
                </div>

                <div>
                  GST: {item.gstRate}%
                </div>

                <div>
                  Line Total: ₹
                  {item.lineTotal}
                </div>
              </div>
            ))}

            <div
              style={{
                marginTop: "20px",
                textAlign: "right",
              }}
            >
              <p>
                <strong>Subtotal:</strong> ₹
                {invoice.subtotal}
              </p>

              <p>
                <strong>Discount:</strong> ₹
                {invoice.discount}
              </p>

              <p>
                <strong>GST:</strong> ₹
                {invoice.gstAmount}
              </p>

              <h3>
                Total: ₹{invoice.total}
              </h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "600",
};

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

export default Invoices;