const express = require("express");
const prisma = require("../config/prisma");

const router = express.Router();

// ============================================================
// POST /products
// Create a new product
// ============================================================

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreate'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid product data
 *       409:
 *         description: SKU or barcode already exists
 *       500:
 *         description: Server error
 */

router.post("/", async (req, res) => {
  try {
    const {
      name,
      sku,
      barcode,
      price,
      gstRate,
      stock,
      isActive = true,
    } = req.body;

    // Basic validation
    if (!name || !sku || !barcode) {
      return res.status(400).json({
        error: "name, sku and barcode are required",
      });
    }

    if (price === undefined || Number(price) < 0) {
      return res.status(400).json({
        error: "price must be a non-negative number",
      });
    }

    if (gstRate === undefined || Number(gstRate) < 0) {
      return res.status(400).json({
        error: "gstRate must be a non-negative number",
      });
    }

    if (
      stock === undefined ||
      !Number.isInteger(Number(stock)) ||
      Number(stock) < 0
    ) {
      return res.status(400).json({
        error: "stock must be a non-negative integer",
      });
    }

    // Check SKU or barcode uniqueness
    const existingProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { sku },
          { barcode },
        ],
      },
    });

    if (existingProduct) {
      return res.status(409).json({
        error: "SKU or barcode already exists",
      });
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: sku.trim(),
        barcode: barcode.trim(),
        price: Number(price),
        gstRate: Number(gstRate),
        stock: Number(stock),
        isActive: Boolean(isActive),
      },
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to create product",
    });
  }
});

// ============================================================
// GET /products
// Get paginated products
// ============================================================
/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get paginated products
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of products per page
 *     responses:
 *       200:
 *         description: Paginated list of products
 *       500:
 *         description: Server error
 */

router.get("/", async (req, res) => {
  try {
    const page = Math.max(
      parseInt(req.query.page) || 1,
      1
    );

    const pageSize = Math.min(
      Math.max(
        parseInt(req.query.pageSize) || 10,
        1
      ),
      100
    );

    const skip = (page - 1) * pageSize;

    const [products, totalItems] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: pageSize,
        orderBy: {
          id: "asc",
        },
      }),

      prisma.product.count(),
    ]);

    const totalPages = Math.ceil(
      totalItems / pageSize
    );

    return res.json({
      data: products,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to fetch products",
    });
  }
});

// ============================================================
// GET /products/search?q=milk
// Search by name, SKU or barcode
// ============================================================

/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Search products
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search by product name, SKU, or barcode
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of products per page
 *     responses:
 *       200:
 *         description: Matching products
 *       400:
 *         description: Search query is required
 *       500:
 *         description: Server error
 */

router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    if (!q) {
      return res.status(400).json({
        error: "Search query is required",
      });
    }

    const page = Math.max(
      parseInt(req.query.page) || 1,
      1
    );

    const pageSize = Math.min(
      Math.max(
        parseInt(req.query.pageSize) || 10,
        1
      ),
      100
    );

    const skip = (page - 1) * pageSize;

    const where = {
      OR: [
        {
          name: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          sku: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          barcode: {
            contains: q,
            mode: "insensitive",
          },
        },
      ],
    };

    const [products, totalItems] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          id: "asc",
        },
      }),

      prisma.product.count({
        where,
      }),
    ]);

    return res.json({
      data: products,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(
          totalItems / pageSize
        ),
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to search products",
    });
  }
});

module.exports = router;