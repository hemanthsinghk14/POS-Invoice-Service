import { useEffect, useState } from "react";
import api from "../services/api";

function CreateInvoice() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");
  const [invoice, setInvoice] = useState(null);

  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [customersResponse, productsResponse] =
          await Promise.all([
            api.get("/customers"),
            api.get("/products?page=1&pageSize=100"),
          ]);

        setCustomers(customersResponse.data.data);
        setProducts(productsResponse.data.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load customers and products.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const addToCart = () => {
    if (!selectedProduct) {
      setError("Please select a product.");
      return;
    }

    const product = products.find(
      (item) => item.id === Number(selectedProduct)
    );

    if (!product) {
      setError("Product not found.");
      return;
    }

    if (quantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    if (quantity > product.stock) {
      setError(`Only ${product.stock} units are available.`);
      return;
    }

    const existingItem = cart.find(
      (item) => item.productId === product.id
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        setError(`Only ${product.stock} units are available.`);
        return;
      }

      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: newQuantity,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          quantity,
        },
      ]);
    }

    setSelectedProduct("");
    setQuantity(1);
    setError("");
    setShowPreview(false);
  };

  const removeFromCart = (productId) => {
    setCart(
      cart.filter((item) => item.productId !== productId)
    );

    setShowPreview(false);
  };

  const updateQuantity = (productId, newQuantity) => {
    const product = products.find(
      (item) => item.id === productId
    );

    if (!product) {
      return;
    }

    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > product.stock) {
      setError(`Only ${product.stock} units are available.`);
      return;
    }

    setCart(
      cart.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQuantity,
            }
          : item
      )
    );

    setError("");
    setShowPreview(false);
  };

  const subtotal = cart.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  const handlePreview = () => {
    if (!selectedCustomer) {
      setError("Please select a customer.");
      return;
    }

    if (cart.length === 0) {
      setError("Please add at least one product.");
      return;
    }

    if (Number(discount) < 0) {
      setError("Discount cannot be negative.");
      return;
    }

    if (Number(discount) > subtotal) {
      setError("Discount cannot exceed the subtotal.");
      return;
    }

    setError("");
    setInvoice(null);
    setShowPreview(true);
  };

  const handleCreateInvoice = async () => {
    if (!selectedCustomer) {
      setError("Please select a customer.");
      return;
    }

    if (cart.length === 0) {
      setError("Please add at least one product.");
      return;
    }

    if (Number(discount) < 0) {
      setError("Discount cannot be negative.");
      return;
    }

    if (Number(discount) > subtotal) {
      setError("Discount cannot exceed the subtotal.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setInvoice(null);

      const payload = {
        customerId: Number(selectedCustomer),

        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),

        discount: Number(discount),
      };

      const response = await api.post(
        "/invoices",
        payload
      );

      setInvoice(response.data);

      const productsResponse = await api.get(
        "/products?page=1&pageSize=100"
      );

      setProducts(productsResponse.data.data);

      setCart([]);
      setSelectedProduct("");
      setQuantity(1);
      setDiscount(0);
      setShowPreview(false);
    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.error ||
        "Failed to create invoice.";

      setError(message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <p>Loading invoice data...</p>;
  }

  const selectedCustomerData = customers.find(
    (customer) =>
      customer.id === Number(selectedCustomer)
  );

  return (
    <div>
      <h2>Create Invoice</h2>

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
{invoice && (
  <div
    id="printable-invoice"
    style={{
      marginBottom: "20px",
      padding: "20px",
      background: "white",
      color: "#111827",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
    }}
  >
    <div className="receipt-header">
      <h2>Mobile POS Store</h2>

      <p>
        <strong>Invoice:</strong>{" "}
        {invoice.invoiceNumber}
      </p>

      <p>
        <strong>Date:</strong>{" "}
        {new Date(
          invoice.createdAt
        ).toLocaleString()}
      </p>
    </div>

    <hr />

    <div>
      <p>
        <strong>Customer:</strong>{" "}
        {invoice.customer?.name}
      </p>

      <p>
        <strong>Phone:</strong>{" "}
        {invoice.customer?.phone}
      </p>
    </div>

    <hr />

    <h3>Items</h3>

    {invoice.items?.map((item) => (
      <div
        key={item.id}
        className="receipt-item"
        style={{
          padding: "12px 0",
          borderBottom:
            "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          <strong>
            {item.product?.name}
          </strong>
        </div>

        <div>
          {item.quantity} × ₹
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

      <h2>
        Grand Total: ₹{invoice.total}
      </h2>
    </div>

    <div
      className="print-controls"
      style={{
        marginTop: "20px",
      }}
    >
      <button
        type="button"
        onClick={() => window.print()}
        style={buttonStyle}
      >
        Print Invoice
      </button>
    </div>
  </div>
)}

      {/* INVOICE PREVIEW */}

      {showPreview ? (
        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            maxWidth: "900px",
          }}
        >
          <h2>Invoice Preview</h2>

          <div
            style={{
              marginBottom: "20px",
              padding: "16px",
              background: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Mobile POS Store
            </h3>

            <p>
              <strong>Customer:</strong>{" "}
              {selectedCustomerData?.name}
            </p>

            <p>
              <strong>Phone:</strong>{" "}
              {selectedCustomerData?.phone}
            </p>
          </div>

          <h3>Items</h3>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            {cart.map((item) => (
              <div
                key={item.productId}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 100px 120px",
                  gap: "12px",
                  padding: "14px",
                  borderBottom:
                    "1px solid #e5e7eb",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                  }}
                >
                  <strong>{item.name}</strong>
                </div>

                <div>
                  {item.quantity} × ₹
                  {item.price.toFixed(2)}
                </div>

                <strong>
                  ₹
                  {(
                    item.price *
                    item.quantity
                  ).toFixed(2)}
                </strong>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "24px",
              marginLeft: "auto",
              maxWidth: "350px",
            }}
          >
            <p>
              <strong>Subtotal:</strong> ₹
              {subtotal.toFixed(2)}
            </p>

            <p>
              <strong>Discount:</strong> ₹
              {Number(discount).toFixed(2)}
            </p>

            <p
              style={{
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              GST and final total will be calculated
              by the server when the invoice is created.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "24px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowPreview(false);
                setError("");
              }}
              style={secondaryButtonStyle}
            >
              Back to Edit
            </button>

            <button
              type="button"
              onClick={handleCreateInvoice}
              disabled={creating}
              style={{
                ...buttonStyle,
                opacity: creating ? 0.6 : 1,
              }}
            >
              {creating
                ? "Creating Invoice..."
                : "Confirm & Create Invoice"}
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            maxWidth: "900px",
          }}
        >
          {/* CUSTOMER */}

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>
              Customer
            </label>

            <select
              value={selectedCustomer}
              onChange={(event) => {
                setSelectedCustomer(
                  event.target.value
                );
                setInvoice(null);
              }}
              style={inputStyle}
            >
              <option value="">
                Select customer
              </option>

              {customers.map((customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.name} -{" "}
                  {customer.phone}
                </option>
              ))}
            </select>
          </div>

          {/* PRODUCT */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 120px 120px",
              gap: "12px",
              alignItems: "end",
            }}
          >
            <div>
              <label style={labelStyle}>
                Product
              </label>

              <select
                value={selectedProduct}
                onChange={(event) =>
                  setSelectedProduct(
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                <option value="">
                  Select product
                </option>

                {products
                  .filter(
                    (product) =>
                      product.isActive &&
                      product.stock > 0
                  )
                  .map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name} - ₹
                      {product.price} - Stock:{" "}
                      {product.stock}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>
                Quantity
              </label>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    Number(event.target.value)
                  )
                }
                style={inputStyle}
              />
            </div>

            <button
              type="button"
              onClick={addToCart}
              style={buttonStyle}
            >
              Add
            </button>
          </div>

          {/* CART */}

          <div style={{ marginTop: "30px" }}>
            <h3>Cart</h3>

            {cart.length === 0 ? (
              <p>No products added yet.</p>
            ) : (
              <div
                style={{
                  border:
                    "1px solid #e5e7eb",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 120px 100px 80px",
                      gap: "12px",
                      alignItems: "center",
                      padding: "14px",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        overflowWrap:
                          "anywhere",
                        wordBreak:
                          "break-word",
                      }}
                    >
                      <strong>
                        {item.name}
                      </strong>

                      <div>
                        ₹{item.price} ×{" "}
                        {item.quantity}
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity - 1
                          )
                        }
                      >
                        −
                      </button>

                      <span
                        style={{
                          margin: "0 10px",
                        }}
                      >
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity + 1
                          )
                        }
                      >
                        +
                      </button>
                    </div>

                    <strong>
                      ₹
                      {(
                        item.price *
                        item.quantity
                      ).toFixed(2)}
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        removeFromCart(
                          item.productId
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DISCOUNT + SUMMARY */}

          <div
            style={{
              marginTop: "24px",
              maxWidth: "350px",
              marginLeft: "auto",
            }}
          >
            <div
              style={{
                marginBottom: "12px",
              }}
            >
              <label style={labelStyle}>
                Discount
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(event) => {
                  setDiscount(
                    Number(event.target.value)
                  );
                  setInvoice(null);
                }}
                style={inputStyle}
              />
            </div>

            <p>
              <strong>Subtotal:</strong> ₹
              {subtotal.toFixed(2)}
            </p>

            <button
              type="button"
              onClick={handlePreview}
              style={{
                ...buttonStyle,
                width: "100%",
                marginTop: "10px",
              }}
            >
              Preview Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "600",
};

const inputStyle = {
  width: "100%",
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

const secondaryButtonStyle = {
  padding: "10px 16px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  background: "white",
  color: "#374151",
  cursor: "pointer",
  fontWeight: "600",
};

export default CreateInvoice;