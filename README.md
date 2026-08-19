# POS Invoice Service

A full-stack Point of Sale (POS) Invoice Service built with Node.js, Express, PostgreSQL, Prisma ORM, and React.

The application supports product and customer management, product search and pagination, invoice creation, GST and discount calculations, stock validation, transaction-safe invoice creation, concurrent overselling protection, invoice lookup, and printable invoices.

---

## 1. Project Overview

This project implements a POS invoicing system with:

- Product management
- Customer management
- Product search
- Product pagination
- Invoice creation
- GST calculation
- Discount handling
- Stock validation
- Transaction-safe invoice creation
- Concurrent overselling protection
- Invoice lookup
- Printable invoice receipt
- Swagger / OpenAPI documentation
- Automated API acceptance tests

The project is structured as a backend REST API with a React frontend.

---

## 2. Tech Stack

### Backend

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- Swagger / OpenAPI

### Frontend

- React
- Vite
- Axios

### Testing

- Node.js API test runner
- REST API integration tests

---

## 3. Project Structure

```text
POS-Invoice-Service/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── config/
│   ├── routes/
│   └── server.js
│
├── tests/
│   └── run-tests.js
│
├── seed.js
├── test-db.js
├── prisma.config.ts
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
# POS Invoice Service

A full-stack Point of Sale (POS) Invoice Service built with Node.js, Express, PostgreSQL, Prisma ORM, and React.

The application supports product and customer management, product search and pagination, invoice creation, GST and discount calculations, stock validation, transaction-safe invoice creation, concurrent overselling protection, invoice lookup, and printable invoices.

---

4. Database Schema

The application uses PostgreSQL through Prisma ORM.

The main entities are:

Customer
Product
Invoice
InvoiceItem
Relationships
Customer
   │
   └──< Invoice
            │
            └──< InvoiceItem >── Product

An invoice belongs to one customer and contains one or more invoice items.

Each invoice item references a product and stores the quantity, unit price, GST rate, and line total used for the invoice.

5. Environment Variables

Create a .env file in the project root.

Example:

DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/pos_invoice"
PORT=3000

Replace the database username, password, host, port, and database name with the local PostgreSQL configuration.

Do not commit .env to GitHub.

6. Installation

Clone the repository and enter the project directory:

git clone <YOUR_GITHUB_REPOSITORY_URL>
cd POS-Invoice-Service

Install backend dependencies:

npm install

Install frontend dependencies:

cd frontend
npm install
cd ..

7. Database Setup

Make sure PostgreSQL is running.

Configure the DATABASE_URL in .env.

Run Prisma migrations:

npx prisma migrate dev

Generate the Prisma client:

npx prisma generate

Seed the database:

node seed.js

The seed creates the sample products and customers required for the application and acceptance testing.

The seed includes more than 50 products and 5 customers, including active, inactive, low-stock, milk, and multiple-GST products.

8. Verify Database Connection

A database connectivity check is available:

node test-db.js

Successful output:

Database connection successful!

If the connection fails, the command exits with a non-zero status.

9. Start the Backend

From the project root:

npm start

The backend runs on:

http://localhost:3000

Health check:

GET /health

Expected response:

{
  "status": "ok",
  "message": "POS Invoice Service is running"
}
10. Start the Frontend

Open another terminal:

cd frontend
npm run dev

Vite normally provides the frontend at:

http://localhost:5173
11. Frontend Features
Products

The frontend supports:

View products
Product pagination
Search by product name
Partial-name search
Search by SKU
Search by barcode
Case-insensitive search
Clear search
Display product price
Display GST rate
Display stock
Display active/inactive status
Customers

The frontend supports:

View customers
Select a customer during invoice creation
Create Invoice

The invoice workflow supports:

Select customer
Select active products
Add products to cart
Adjust quantities
Remove products
Apply discount
Preview invoice
Confirm and create invoice
Invoice Preview

Before creating an invoice, the user can review:

Customer
Customer phone number
Products
Quantities
Unit prices
Subtotal
Discount

GST and the final total are calculated authoritatively by the backend when the invoice is created.

Invoice Details

After successful invoice creation, the application displays:

Invoice number
Date/time
Customer
Customer phone number
Products
Quantities
Unit prices
GST
Discount
Subtotal
Grand total
Invoice Lookup

Invoices can be looked up using the ending digits of the invoice number.

Example invoice:

INV-20260819-0016

The user can enter:

0016

to retrieve the corresponding invoice.

Printable Receipt

The created invoice can be printed directly using the browser's print functionality.

The printable receipt contains:

Shop name
Invoice number
Date/time
Customer details
Invoice items
Quantity
Unit price
GST
Discount
Subtotal
Grand total

The browser's window.print() functionality is used instead of adding a PDF-generation dependency.

12. API Endpoints
Health
GET /health
Products
GET /products

Pagination example:

GET /products?page=1&pageSize=10
Product Search
GET /products/search?q=milk

Search supports:

Product name
SKU
Barcode
Partial matching
Case-insensitive matching
Create Product
POST /products
Customers
GET /customers
Create Invoice
POST /invoices

Example request:

{
  "customerId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ],
  "discount": 10
}
Get Invoice
GET /invoices/:id

Example:

GET /invoices/16
13. Invoice Business Rules

The backend validates the following:

Customer must exist
Product must exist
Product must be active
Quantity must be a positive integer
Duplicate product IDs in one invoice are rejected
Requested quantity cannot exceed available stock
Discount cannot be negative
Discount cannot exceed subtotal
Product price is read from the database
GST rate is read from the database
Invoice creation is transaction-safe
14. Transaction and Concurrency Safety

Invoice creation is performed inside a database transaction.

The transaction ensures that:

Customer validation succeeds
Products are validated
Stock is checked
Invoice is created
Invoice items are created
Stock is reduced

If any step fails, the transaction is rolled back.

This prevents partial invoices and partial stock updates.

The implementation also protects against concurrent overselling using transactional database operations and row-level locking.

15. Invoice Numbering

Invoices use the following format:

INV-YYYYMMDD-XXXX

Example:

INV-20260819-0016

The invoice number is unique.

The implementation also verifies invoice-number uniqueness during concurrent invoice creation.

16. GST and Discount Calculation

The backend is the authoritative source for invoice calculations.

The frontend preview is only a confirmation step.

For each invoice item:

Line Amount = Unit Price × Quantity

The subtotal is calculated from all invoice items.

The discount is validated against the subtotal.

GST is calculated using the GST rate stored for the product.

The final total is calculated by the backend.

This prevents the frontend from becoming the source of truth for billing calculations.

17. Automated Tests

The project includes an API-based acceptance test runner:

tests/run-tests.js

Run the tests against the local backend:

npm test

or:

node tests/run-tests.js

The test runner also accepts a backend URL as a command-line argument:

node tests/run-tests.js https://your-backend-url.example.com

Alternatively, use the BASE_URL environment variable:

BASE_URL=https://your-backend-url.example.com node tests/run-tests.js

The test runner returns:

exit code 0

when all required tests pass.

If a required test fails, the runner returns:

exit code 1
Automated Test Coverage

The test suite verifies:

Health endpoint
Products endpoint
Customers endpoint
Minimum seeded product count
Minimum seeded customer count
Product pagination
Page 2 pagination
Case-insensitive product search
Partial-name search
SKU search
Barcode search
Successful invoice creation
Invalid customer
Unknown product
Inactive product
Duplicate product IDs
Zero quantity
Negative quantity
Excessive quantity
Insufficient stock
Multi-item transaction rollback
Discount greater than subtotal
Concurrent overselling protection
Twenty concurrent invoice creations
Unique invoice numbers
18. Swagger / OpenAPI

Swagger UI is available when the backend is running.

Open:

http://localhost:3000/docs

Swagger provides interactive API documentation and allows the available endpoints to be inspected and tested.

19. Architecture
                 React Frontend
                       │
                       │ HTTP / JSON
                       ▼
                 Express API
                       │
              ┌────────┴────────┐
              │                 │
          Routes           Validation
              │                 │
              └────────┬────────┘
                       ▼
                  Prisma ORM
                       │
                       ▼
                  PostgreSQL
Frontend Responsibilities
User interaction
Product/customer selection
Cart management
Invoice preview
Invoice lookup
Displaying API results
Browser printing
Backend Responsibilities
Validation
Business rules
GST calculation
Discount validation
Stock validation
Transactions
Concurrency safety
Invoice persistence
API responses
Database Responsibilities
Persistent storage
Relationships
Unique constraints
Transaction support
Stock consistency
Invoice-number uniqueness
20. Design Trade-offs
Server-side Billing Calculations

The frontend does not act as the authoritative source for totals.

The backend calculates pricing, GST, discount, and final totals.

This provides stronger data integrity.

Database Transactions

Invoice creation uses a transaction so that invoice creation, invoice items, and stock updates succeed or fail together.

Simple Frontend

The frontend intentionally focuses on core POS functionality instead of adding unnecessary UI complexity.

This keeps the application easier to understand, test, and maintain.

Browser Printing

Browser printing was chosen instead of generating PDF files because the application requires a printable invoice and does not require a separate PDF-generation system.

API-based Test Runner

The acceptance test runner communicates with the backend through HTTP APIs rather than directly accessing the database.

This allows the same test runner to be used against a local or deployed backend.

21. Security and Repository Hygiene

The following files and directories are excluded from version control:

.env
node_modules/
frontend/node_modules/
generated/
.agents/
.claude/
.windsurf/
skills-lock.json

Environment variables and database credentials must never be committed to the repository.

The repository contains the application source code, Prisma schema/migrations, seed script, tests, and frontend source required to reproduce the project.

22. Running the Complete Application
Terminal 1 — Backend
npm install
npx prisma migrate dev
npx prisma generate
node seed.js
npm start
Terminal 2 — Frontend
cd frontend
npm install
npm run dev
Terminal 3 — Automated Tests

Make sure the backend is running first.

Then:

npm test

Expected result:

========================================
TEST SUMMARY
========================================
✅ All tests completed successfully.
========================================
23. Final Verification

Before submission, verify:

Backend starts successfully       ✓
Frontend starts successfully      ✓
Database connects                 ✓
Swagger UI works                  ✓
Product search works              ✓
Product pagination works          ✓
Customer selection works          ✓
Invoice preview works             ✓
Invoice creation works            ✓
Stock validation works            ✓
Transaction rollback works        ✓
Concurrency protection works      ✓
Invoice lookup works              ✓
Printable invoice works           ✓
Automated tests pass              ✓
24. Project Status

The project is implemented as a functional full-stack POS Invoice Service with:

Express backend
PostgreSQL database
Prisma ORM
React frontend
Product and customer management
Invoice creation
GST and discount handling
Transaction-safe stock management
Concurrency protection
Invoice lookup
Printable receipts
Swagger/OpenAPI documentation
Automated acceptance tests

The current implementation has been locally verified with the complete automated test suite.

Deployment is intentionally kept as a separate step after the final GitHub repository checkpoint and backup.