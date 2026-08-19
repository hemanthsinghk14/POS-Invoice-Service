const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const productsRouter = require("./routes/products");
const customersRouter = require("./routes/customers");
const invoicesRouter = require("./routes/invoices");

const app = express();

// ============================================================
// SWAGGER / OPENAPI CONFIGURATION
// ============================================================

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "POS Invoice Service API",
      version: "1.0.0",
      description:
        "REST API for managing products, customers, and GST-aware POS invoices.",
    },

    servers: [
      {
        url: "http://localhost:3000",
      },
    ],

    components: {
      schemas: {
        // ====================================================
        // PRODUCT SCHEMAS
        // ====================================================

        ProductCreate: {
          type: "object",

          required: [
            "name",
            "sku",
            "barcode",
            "price",
            "gstRate",
            "stock",
          ],

          properties: {
            name: {
              type: "string",
              example: "Milk 1L",
            },

            sku: {
              type: "string",
              example: "MILK-001",
            },

            barcode: {
              type: "string",
              example: "890100000001",
            },

            price: {
              type: "number",
              example: 60,
            },

            gstRate: {
              type: "number",
              example: 5,
            },

            stock: {
              type: "integer",
              example: 50,
            },

            isActive: {
              type: "boolean",
              example: true,
              default: true,
            },
          },
        },

        Product: {
          allOf: [
            {
              $ref: "#/components/schemas/ProductCreate",
            },

            {
              type: "object",

              properties: {
                id: {
                  type: "integer",
                  example: 1,
                },

                createdAt: {
                  type: "string",
                  format: "date-time",
                },

                updatedAt: {
                  type: "string",
                  format: "date-time",
                },
              },
            },
          ],
        },

        // ====================================================
        // CUSTOMER SCHEMA
        // ====================================================

        Customer: {
          type: "object",

          properties: {
            id: {
              type: "integer",
              example: 1,
            },

            name: {
              type: "string",
              example: "Rahul Sharma",
            },

            phone: {
              type: "string",
              example: "9876543210",
            },

            email: {
              type: "string",
              format: "email",
              example: "rahul.sharma@example.com",
            },

            gstin: {
              type: "string",
              nullable: true,
              example: "29ABCDE1234F1Z5",
            },

            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        // ====================================================
        // INVOICE REQUEST SCHEMAS
        // ====================================================

        InvoiceItemRequest: {
          type: "object",

          required: [
            "productId",
            "quantity",
          ],

          properties: {
            productId: {
              type: "integer",
              example: 1,
            },

            quantity: {
              type: "integer",
              minimum: 1,
              maximum: 10000,
              example: 2,
            },
          },
        },

        InvoiceCreate: {
          type: "object",

          required: [
            "customerId",
            "items",
          ],

          properties: {
            customerId: {
              type: "integer",
              example: 1,
            },

            items: {
              type: "array",

              minItems: 1,

              items: {
                $ref: "#/components/schemas/InvoiceItemRequest",
              },
            },

            discount: {
              type: "number",
              minimum: 0,
              example: 10,
              default: 0,
            },
          },
        },

        // ====================================================
        // INVOICE ITEM RESPONSE
        // ====================================================

        InvoiceItem: {
          type: "object",

          properties: {
            id: {
              type: "integer",
              example: 1,
            },

            invoiceId: {
              type: "integer",
              example: 1,
            },

            productId: {
              type: "integer",
              example: 1,
            },

            quantity: {
              type: "integer",
              example: 2,
            },

            unitPrice: {
              type: "string",
              example: "60",
            },

            gstRate: {
              type: "string",
              example: "5",
            },

            lineTotal: {
              type: "string",
              example: "120",
            },

            product: {
              $ref: "#/components/schemas/Product",
            },
          },
        },

        // ====================================================
        // GST BREAKUP
        // ====================================================

        GSTBreakup: {
          type: "object",

          properties: {
            gstRate: {
              type: "string",
              example: "5",
            },

            taxableAmount: {
              type: "string",
              example: "54",
            },

            gstAmount: {
              type: "string",
              example: "2.7",
            },
          },
        },

        // ====================================================
        // INVOICE RESPONSE
        // ====================================================

        Invoice: {
          type: "object",

          properties: {
            id: {
              type: "integer",
              example: 1,
            },

            invoiceNumber: {
              type: "string",
              example: "INV-20260819-0001",
            },

            customer: {
              $ref: "#/components/schemas/Customer",
            },

            items: {
              type: "array",

              items: {
                $ref: "#/components/schemas/InvoiceItem",
              },
            },

            subtotal: {
              type: "string",
              example: "100",
            },

            discount: {
              type: "string",
              example: "10",
            },

            gstAmount: {
              type: "string",
              example: "7.02",
            },

            total: {
              type: "string",
              example: "97.02",
            },

            gstBreakup: {
              type: "array",

              items: {
                $ref: "#/components/schemas/GSTBreakup",
              },
            },

            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        // ====================================================
        // ERROR SCHEMA
        // ====================================================

        Error: {
          type: "object",

          properties: {
            error: {
              type: "string",
              example: "Customer not found",
            },
          },
        },
      },
    },
  },

  // IMPORTANT:
  // Must remain outside "definition".
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ============================================================
// SWAGGER UI
// ============================================================

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());
app.use(express.json());

// ============================================================
// HEALTH CHECK
// ============================================================
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: POS Invoice Service is running
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "POS Invoice Service is running",
  });
});

// ============================================================
// API ROUTES
// ============================================================

app.use("/products", productsRouter);
app.use("/customers", customersRouter);
app.use("/invoices", invoicesRouter);

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`POS Invoice Service running on port ${PORT}`);
});