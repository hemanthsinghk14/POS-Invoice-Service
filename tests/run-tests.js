const http = require("http");
const https = require("https");

// ============================================================
// CONFIGURATION
// ============================================================

const BASE_URL = (
  process.argv[2] ||
  process.env.BASE_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

let failures = 0;

// ============================================================
// HTTP REQUEST HELPER
// ============================================================

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);

    const transport = url.protocol === "https:" ? https : http;

    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    const req = transport.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        let parsed;

        try {
          parsed = data ? JSON.parse(data) : {};
        } catch {
          parsed = data;
        }

        resolve({
          status: res.statusCode,
          body: parsed,
        });
      });
    });

    req.on("error", reject);

    if (body !== null) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// ============================================================
// TEST HELPERS
// ============================================================

async function runTest(name, testFunction) {
  try {
    await testFunction();

    console.log(`✅ PASS: ${name}`);
  } catch (error) {
    failures += 1;

    console.log(`❌ FAIL: ${name}`);
    console.log(`   ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getErrorMessage(response) {
  return response?.body?.error || "Unknown error";
}

// ============================================================
// TEST DATA
// ============================================================

let customerId;

let product9001;
let product9002;
let product9003;
let product9004;
let product9005;

const timestamp = Date.now();

async function createProduct({
  name,
  sku,
  barcode,
  price,
  gstRate,
  stock,
  isActive = true,
}) {
  const response = await request("POST", "/products", {
    name,
    sku,
    barcode,
    price,
    gstRate,
    stock,
    isActive,
  });

  assert(
    response.status === 201,
    `Expected product creation 201, received ${response.status}`
  );

  assert(
    response.body?.id !== undefined,
    "Created product did not return an ID"
  );

  return response.body;
}

// ============================================================
// PREPARE TEST DATA THROUGH THE API
// ============================================================

async function prepareTestData() {
  console.log("Preparing test data...");

  // ----------------------------------------------------------
  // Get an existing customer from the seed data
  // ----------------------------------------------------------

  const customersResponse = await request(
    "GET",
    "/customers"
  );

  assert(
    customersResponse.status === 200,
    `Customers endpoint returned ${customersResponse.status}`
  );

  assert(
    Array.isArray(customersResponse.body.data),
    "Customers data is not an array"
  );

  assert(
    customersResponse.body.data.length >= 5,
    "Expected at least 5 seeded customers"
  );

  customerId = customersResponse.body.data[0].id;

  // ----------------------------------------------------------
  // Create controlled test products
  // ----------------------------------------------------------

  product9001 = await createProduct({
    name: `Audit Milk ${timestamp}`,
    sku: `AUDIT-MILK-${timestamp}`,
    barcode: `999${timestamp}001`,
    price: 100,
    gstRate: 5,
    stock: 100,
    isActive: true,
  });

  product9002 = await createProduct({
    name: `Audit Low Stock ${timestamp}`,
    sku: `AUDIT-LOW-${timestamp}`,
    barcode: `999${timestamp}002`,
    price: 50,
    gstRate: 5,
    stock: 2,
    isActive: true,
  });

  product9003 = await createProduct({
    name: `Audit Inactive ${timestamp}`,
    sku: `AUDIT-INACTIVE-${timestamp}`,
    barcode: `999${timestamp}003`,
    price: 75,
    gstRate: 12,
    stock: 10,
    isActive: false,
  });

  product9004 = await createProduct({
    name: `Audit Concurrent ${timestamp}`,
    sku: `AUDIT-CONCURRENT-${timestamp}`,
    barcode: `999${timestamp}004`,
    price: 100,
    gstRate: 5,
    stock: 5,
    isActive: true,
  });

  product9005 = await createProduct({
    name: `Audit Twenty Concurrent ${timestamp}`,
    sku: `AUDIT-TWENTY-${timestamp}`,
    barcode: `999${timestamp}005`,
    price: 100,
    gstRate: 5,
    stock: 20,
    isActive: true,
  });

  console.log("Test data ready.\n");
}

// ============================================================
// TEST SUITE
// ============================================================

async function main() {
  console.log("\nStarting POS Invoice Service tests...");
  console.log(`Backend URL: ${BASE_URL}\n`);

  await prepareTestData();

  // ==========================================================
  // HEALTH
  // ==========================================================

  await runTest(
    "Health endpoint works",
    async () => {
      const response = await request(
        "GET",
        "/health"
      );

      assert(
        response.status === 200,
        `Expected 200, received ${response.status}`
      );

      assert(
        response.body.status === "ok",
        "Health status is not ok"
      );
    }
  );

  // ==========================================================
  // PRODUCTS
  // ==========================================================

  await runTest(
    "Products endpoint works",
    async () => {
      const response = await request(
        "GET",
        "/products?page=1&pageSize=10"
      );

      assert(
        response.status === 200,
        `Expected 200, received ${response.status}`
      );

      assert(
        Array.isArray(response.body.data),
        "Products data is not an array"
      );

      assert(
        response.body.pagination.totalItems >= 50,
        `Expected at least 50 products, received ${response.body.pagination.totalItems}`
      );
    }
  );

  // ==========================================================
  // PAGINATION
  // ==========================================================

  await runTest(
    "Products pagination page 2 works",
    async () => {
      const response = await request(
        "GET",
        "/products?page=2&pageSize=10"
      );

      assert(
        response.status === 200,
        `Expected 200, received ${response.status}`
      );

      assert(
        Array.isArray(response.body.data),
        "Products data is not an array"
      );

      assert(
        response.body.pagination.page === 2,
        `Expected page 2, received ${response.body.pagination.page}`
      );

      assert(
        response.body.pagination.pageSize === 10,
        `Expected pageSize 10, received ${response.body.pagination.pageSize}`
      );

      assert(
        response.body.data.length > 0,
        "Page 2 should contain products"
      );
    }
  );

  // ==========================================================
  // PRODUCT SEARCH - CASE INSENSITIVE
  // ==========================================================

  await runTest(
    "Product search is case-insensitive",
    async () => {
      const lower = await request(
        "GET",
        "/products/search?q=milk"
      );

      const upper = await request(
        "GET",
        "/products/search?q=MILK"
      );

      const mixed = await request(
        "GET",
        "/products/search?q=MiLk"
      );

      assert(
        lower.status === 200,
        `Lowercase search returned ${lower.status}`
      );

      assert(
        upper.status === 200,
        `Uppercase search returned ${upper.status}`
      );

      assert(
        mixed.status === 200,
        `Mixed-case search returned ${mixed.status}`
      );

      assert(
        Array.isArray(lower.body.data),
        "Lowercase search data is not an array"
      );

      assert(
        Array.isArray(upper.body.data),
        "Uppercase search data is not an array"
      );

      assert(
        Array.isArray(mixed.body.data),
        "Mixed-case search data is not an array"
      );

      const lowerIds = lower.body.data
        .map((item) => item.id)
        .sort();

      const upperIds = upper.body.data
        .map((item) => item.id)
        .sort();

      const mixedIds = mixed.body.data
        .map((item) => item.id)
        .sort();

      assert(
        JSON.stringify(lowerIds) ===
          JSON.stringify(upperIds),
        "milk and MILK returned different results"
      );

      assert(
        JSON.stringify(lowerIds) ===
          JSON.stringify(mixedIds),
        "milk and MiLK returned different results"
      );

      assert(
        lower.body.data.length > 0,
        "Milk search returned no results"
      );
    }
  );

  // ==========================================================
  // SKU SEARCH
  // ==========================================================

  await runTest(
    "Product SKU search works",
    async () => {
      const response = await request(
        "GET",
        `/products/search?q=${encodeURIComponent(
          product9001.sku
        )}`
      );

      assert(
        response.status === 200,
        `Expected 200, received ${response.status}`
      );

      assert(
        response.body.data.some(
          (product) =>
            product.id === product9001.id
        ),
        "SKU search did not find the test product"
      );
    }
  );

  // ==========================================================
  // BARCODE SEARCH
  // ==========================================================

  await runTest(
    "Product barcode search works",
    async () => {
      const response = await request(
        "GET",
        `/products/search?q=${encodeURIComponent(
          product9001.barcode
        )}`
      );

      assert(
        response.status === 200,
        `Expected 200, received ${response.status}`
      );

      assert(
        response.body.data.some(
          (product) =>
            product.id === product9001.id
        ),
        "Barcode search did not find the test product"
      );
    }
  );

  // ==========================================================
  // PARTIAL NAME SEARCH
  // ==========================================================

  await runTest(
    "Partial product-name search works",
    async () => {
      const response = await request(
        "GET",
        `/products/search?q=${encodeURIComponent(
          `Audit Milk`
        )}`
      );

      assert(
        response.status === 200,
        `Expected 200, received ${response.status}`
      );

      assert(
        response.body.data.some(
          (product) =>
            product.id === product9001.id
        ),
        "Partial name search did not find the test product"
      );
    }
  );

  // ==========================================================
  // CUSTOMERS
  // ==========================================================

  await runTest(
    "Customers endpoint works",
    async () => {
      const response = await request(
        "GET",
        "/customers"
      );

      assert(
        response.status === 200,
        `Expected 200, received ${response.status}`
      );

      assert(
        Array.isArray(response.body.data),
        "Customers data is not an array"
      );

      assert(
        response.body.data.length >= 5,
        "Expected at least 5 customers"
      );
    }
  );

  // ==========================================================
  // SUCCESSFUL INVOICE
  // ==========================================================

  await runTest(
    "Create invoice successfully",
    async () => {
      const response = await request(
        "POST",
        "/invoices",
        {
          customerId,
          items: [
            {
              productId: product9001.id,
              quantity: 2,
            },
          ],
          discount: 0,
        }
      );

      assert(
        response.status === 201,
        `Expected 201, received ${response.status}`
      );

      assert(
        response.body.subtotal === "200",
        `Expected subtotal 200, received ${response.body.subtotal}`
      );

      assert(
        response.body.gstAmount === "10",
        `Expected GST 10, received ${response.body.gstAmount}`
      );

      assert(
        response.body.total === "210",
        `Expected total 210, received ${response.body.total}`
      );

      assert(
        response.body.items.length === 1,
        "Expected one invoice item"
      );

      assert(
        response.body.items[0].productId ===
          product9001.id,
        "Incorrect product in invoice"
      );

      assert(
        response.body.items[0].quantity === 2,
        "Expected quantity 2"
      );

      assert(
        response.body.items[0].unitPrice === "100",
        `Expected unit price 100, received ${response.body.items[0].unitPrice}`
      );

      assert(
        response.body.items[0].gstRate === "5",
        `Expected GST rate 5, received ${response.body.items[0].gstRate}`
      );

      assert(
        response.body.invoiceNumber,
        "Invoice number was not returned"
      );
    }
  );

  // ==========================================================
  // INVALID CUSTOMER
  // ==========================================================

  await runTest(
    "Reject invalid customer",
    async () => {
      const response = await request(
        "POST",
        "/invoices",
        {
          customerId: 999999999,
          items: [
            {
              productId: product9001.id,
              quantity: 1,
            },
          ],
          discount: 0,
        }
      );

      assert(
        response.status === 404,
        `Expected 404, received ${response.status}`
      );
    }
  );

  // ==========================================================
  // UNKNOWN PRODUCT
  // ==========================================================

  await runTest(
    "Reject unknown product",
    async () => {
      const response = await request(
        "POST",
        "/invoices",
        {
          customerId,
          items: [
            {
              productId: 999999999,
              quantity: 1,
            },
          ],
          discount: 0,
        }
      );

      assert(
        response.status >= 400 &&
          response.status < 500,
        `Expected 4xx, received ${response.status}`
      );
    }
  );

  // ==========================================================
  // INACTIVE PRODUCT
  // ==========================================================

  await runTest(
    "Reject inactive product",
    async () => {
      const response = await request(
        "POST",
        "/invoices",
        {
          customerId,
          items: [
            {
              productId: product9003.id,
              quantity: 1,
            },
          ],
          discount: 0,
        }
      );

      assert(
        response.status === 409,
        `Expected 409, received ${response.status}`
      );
    }
  );

  // ==========================================================
  // DUPLICATE PRODUCT IDS
  // ==========================================================

  await runTest(
    "Reject duplicate product IDs",
    async () => {
      const response = await request(
        "POST",
        "/invoices",
        {
          customerId,
          items: [
            {
              productId: product9001.id,
              quantity: 1,
            },
            {
              productId: product9001.id,
              quantity: 2,
            },
          ],
          discount: 0,
        }
      );

      assert(
        response.status === 400,
        `Expected 400, received ${response.status}`
      );
    }
  );

  // ==========================================================
  // INVALID QUANTITY - ZERO
  // ==========================================================

  await runTest(
    "Reject zero quantity",
    async () => {
      const response = await request(
        "POST",
        "/invoices",
        {
          customerId,
          items: [
            {
              productId: product9001.id,
              quantity: 0,
            },
          ],
          discount: 0,
        }
      );

      assert(
        response.status === 400,
        `Expected 400, received ${response.status}`
      );
    }
  );

  // ==========================================================
  // INVALID QUANTITY - NEGATIVE
  // ==========================================================

  await runTest(
    "Reject negative quantity",
    async () => {
      const response = await request(
        "POST",
        "/invoices",
        {
          customerId,
          items: [
            {
              productId: product9001.id,
              quantity: -1,
            },
          ],
          discount: 0,
        }
      );

      assert(
        response.status === 400,
        `Expected 400, received ${response.status}`
      );
    }
  );

  // ==========================================================
  // INVALID QUANTITY - HUGE
  // ==========================================================

  await runTest(
    "Reject excessive quantity",
    async () => {
      const response = await request(
        "POST",
        "/invoices",
        {
          customerId,
          items: [
            {
              productId: product9001.id,
              quantity: 999999999,
            },
          ],
          discount: 0,
        }
      );

      assert(
        response.status === 400,
        `Expected 400, received ${response.status}`
      );
    }
  );

  // ==========================================================
  // INSUFFICIENT STOCK
  // ==========================================================

  await runTest(
    "Reject insufficient stock",
    async () => {
      const before = await request(
        "GET",
        `/products?page=1&pageSize=100`
      );

      const beforeProduct =
        before.body.data.find(
          (product) =>
            product.id === product9002.id
        );

      const response = await request(
        "POST",
        "/invoices",
        {
          customerId,
          items: [
            {
              productId: product9002.id,
              quantity: 3,
            },
          ],
          discount: 0,
        }
      );

      assert(
        response.status === 409,
        `Expected 409, received ${response.status}`
      );

      const after = await request(
        "GET",
        `/products?page=1&pageSize=100`
      );

      const afterProduct =
        after.body.data.find(
          (product) =>
            product.id === product9002.id
        );

      assert(
        beforeProduct.stock ===
          afterProduct.stock,
        `Stock changed from ${beforeProduct.stock} to ${afterProduct.stock}`
      );
    }
  );

  // ==========================================================
  // MULTI-ITEM ROLLBACK
  // ==========================================================

  await runTest(
    "Rollback multi-item invoice on stock failure",
    async () => {
      const beforeResponse = await request(
        "GET",
        `/products?page=1&pageSize=100`
      );

      const productA =
        beforeResponse.body.data.find(
          (product) =>
            product.id === product9001.id
        );

      const productB =
        beforeResponse.body.data.find(
          (product) =>
            product.id === product9002.id
        );

      const response = await request(
        "POST",
        "/invoices",
        {
          customerId,
          items: [
            {
              productId: product9001.id,
              quantity: 1,
            },
            {
              productId: product9002.id,
              quantity: 3,
            },
          ],
          discount: 0,
        }
      );

      assert(
        response.status === 409,
        `Expected 409, received ${response.status}`
      );

      const afterResponse = await request(
        "GET",
        `/products?page=1&pageSize=100`
      );

      const productAAfter =
        afterResponse.body.data.find(
          (product) =>
            product.id === product9001.id
        );

      const productBAfter =
        afterResponse.body.data.find(
          (product) =>
            product.id === product9002.id
        );

      assert(
        productAAfter.stock ===
          productA.stock,
        `Product A stock changed from ${productA.stock} to ${productAAfter.stock}`
      );

      assert(
        productBAfter.stock ===
          productB.stock,
        `Product B stock changed from ${productB.stock} to ${productBAfter.stock}`
      );
    }
  );

  // ==========================================================
  // DISCOUNT VALIDATION
  // ==========================================================

  await runTest(
    "Reject discount greater than subtotal",
    async () => {
      const response = await request(
        "POST",
        "/invoices",
        {
          customerId,
          items: [
            {
              productId: product9001.id,
              quantity: 1,
            },
          ],
          discount: 101,
        }
      );

      assert(
        response.status === 400,
        `Expected 400, received ${response.status}`
      );
    }
  );

  // ==========================================================
  // CONCURRENT OVERSELLING
  // ==========================================================

  await runTest(
    "Prevent concurrent overselling",
    async () => {
      const invoiceRequest = {
        customerId,
        items: [
          {
            productId: product9004.id,
            quantity: 3,
          },
        ],
        discount: 0,
      };

      const results = await Promise.all([
        request(
          "POST",
          "/invoices",
          invoiceRequest
        ),
        request(
          "POST",
          "/invoices",
          invoiceRequest
        ),
      ]);

      const successful = results.filter(
        (result) => result.status === 201
      );

      const rejected = results.filter(
        (result) => result.status === 409
      );

      assert(
        successful.length === 1,
        `Expected exactly 1 successful invoice, got ${successful.length}`
      );

      assert(
        rejected.length === 1,
        `Expected exactly 1 rejected invoice, got ${rejected.length}`
      );
    }
  );

  // ==========================================================
  // 20 CONCURRENT INVOICES
  // ==========================================================

  await runTest(
    "Twenty concurrent invoice creations have unique invoice numbers",
    async () => {
      const invoiceRequest = {
        customerId,
        items: [
          {
            productId: product9005.id,
            quantity: 1,
          },
        ],
        discount: 0,
      };

      const requests = Array.from(
        { length: 20 },
        () =>
          request(
            "POST",
            "/invoices",
            invoiceRequest
          )
      );

      const results = await Promise.all(
        requests
      );

      const successful = results.filter(
        (result) => result.status === 201
      );

      assert(
        successful.length === 20,
        `Expected 20 successful invoices, got ${successful.length}`
      );

      const invoiceNumbers =
        successful.map(
          (result) =>
            result.body.invoiceNumber
        );

      const uniqueInvoiceNumbers =
        new Set(invoiceNumbers);

      assert(
        uniqueInvoiceNumbers.size === 20,
        `Expected 20 unique invoice numbers, got ${uniqueInvoiceNumbers.size}`
      );
    }
  );

  // ==========================================================
  // FINAL RESULT
  // ==========================================================

  console.log("\n========================================");
  console.log("TEST SUMMARY");
  console.log("========================================");

  if (failures === 0) {
    console.log("✅ All tests completed successfully.");
    console.log("========================================\n");

    process.exitCode = 0;
  } else {
    console.log(
      `❌ ${failures} test(s) failed.`
    );
    console.log("========================================\n");

    process.exitCode = 1;
  }
}

// ============================================================
// START TEST RUNNER
// ============================================================

main().catch((error) => {
  console.error(
    "\nTest runner failed unexpectedly:"
  );

  console.error(error);

  process.exitCode = 1;
});