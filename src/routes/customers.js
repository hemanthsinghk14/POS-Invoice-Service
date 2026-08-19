const express = require("express");
const prisma = require("../config/prisma");

const router = express.Router();

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Get customers
 *     tags:
 *       - Customers
 *     responses:
 *       200:
 *         description: List of customers
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        id: "asc",
      },
    });

    res.json({
      data: customers,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch customers",
    });
  }
});

module.exports = router;