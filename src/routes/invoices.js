const express = require("express");
const crypto = require("crypto");
const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");

const router = express.Router();

const Decimal = Prisma.Decimal;

function roundMoney(value) {
  return new Decimal(value).toDecimalPlaces(2);
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: Create a new invoice
 *     description: Creates an invoice, calculates GST and discount, and atomically deducts product stock.
 *     tags:
 *       - Invoices
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceCreate'
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Customer or product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Inactive product, insufficient stock, or conflicting request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */

router.post("/", async (req, res) => {
  try {
    const {
      customerId,
      discount = 0,
      items,
    } = req.body;

    // ---------------------------------------------------------
    // 1. BASIC REQUEST VALIDATION
    // ---------------------------------------------------------

    if (!Number.isInteger(Number(customerId))) {
      return res.status(400).json({
        error: "customerId must be an integer",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "items must contain at least one product",
      });
    }

    let discountAmount;

    try {
      discountAmount = new Decimal(discount);
    } catch {
      return res.status(400).json({
        error: "discount must be a valid number",
      });
    }

    if (!discountAmount.isFinite() || discountAmount.isNegative()) {
      return res.status(400).json({
        error: "discount must be greater than or equal to zero",
      });
    }

    // ---------------------------------------------------------
    // 2. VALIDATE ITEMS
    // ---------------------------------------------------------

    const productIds = new Set();

    for (const item of items) {
      if (!Number.isInteger(Number(item.productId))) {
        return res.status(400).json({
          error: "productId must be an integer",
        });
      }

      if (productIds.has(Number(item.productId))) {
        return res.status(400).json({
          error: "Duplicate product IDs are not allowed",
        });
      }

      productIds.add(Number(item.productId));

      if (
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1 ||
        Number(item.quantity) > 10000
      ) {
        return res.status(400).json({
          error:
            "quantity must be an integer between 1 and 10000",
        });
      }
    }

    const normalizedItems = items.map((item) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity),
    }));

    // ---------------------------------------------------------
    // 3. CHECK CUSTOMER
    // ---------------------------------------------------------

    const customer = await prisma.customer.findUnique({
      where: {
        id: Number(customerId),
      },
    });

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found",
      });
    }

    // ---------------------------------------------------------
    // 4. DATABASE TRANSACTION
    // ---------------------------------------------------------

    const invoiceId = await prisma.$transaction(async (tx) => {

      // -------------------------------------------------------
      // 4A. FETCH PRODUCTS FROM DATABASE
      // -------------------------------------------------------

      const products = await tx.product.findMany({
        where: {
          id: {
            in: normalizedItems.map((item) => item.productId),
          },
        },
      });

      const productMap = new Map(
        products.map((product) => [product.id, product])
      );

      // -------------------------------------------------------
      // 4B. VALIDATE PRODUCT EXISTENCE + ACTIVE STATUS
      // -------------------------------------------------------

      for (const item of normalizedItems) {
        const product = productMap.get(item.productId);

        if (!product) {
          throw createHttpError(
            404,
            `Product ${item.productId} not found`
          );
        }

        if (!product.isActive) {
          throw createHttpError(
            409,
            `Product ${product.name} is inactive`
          );
        }
      }

      // -------------------------------------------------------
      // 4C. CALCULATE LINE TOTALS USING DB PRICE
      // -------------------------------------------------------

      const invoiceLines = normalizedItems.map((item) => {
        const product = productMap.get(item.productId);

        const unitPrice = new Decimal(product.price);

        const lineTotal = roundMoney(
          unitPrice.mul(item.quantity)
        );

        return {
          productId: product.id,
          quantity: item.quantity,
          unitPrice,
          gstRate: new Decimal(product.gstRate),
          lineTotal,
        };
      });

      // -------------------------------------------------------
      // 4D. CALCULATE SUBTOTAL
      // -------------------------------------------------------

      let subtotal = new Decimal(0);

      for (const line of invoiceLines) {
        subtotal = subtotal.plus(line.lineTotal);
      }

      subtotal = roundMoney(subtotal);

      // -------------------------------------------------------
      // 4E. VALIDATE DISCOUNT
      // -------------------------------------------------------

      discountAmount = roundMoney(discountAmount);

      if (discountAmount.gt(subtotal)) {
        throw createHttpError(
          400,
          "Discount cannot exceed invoice subtotal"
        );
      }

      // -------------------------------------------------------
      // 4F. DISTRIBUTE DISCOUNT PROPORTIONALLY
      // -------------------------------------------------------

      let remainingDiscount = discountAmount;

      const taxableLines = invoiceLines.map((line, index) => {
        let lineDiscount;

        if (index === invoiceLines.length - 1) {
          // Give the remaining cents to the final line so
          // total line discounts exactly equal invoice discount.
          lineDiscount = remainingDiscount;
        } else {
          lineDiscount = roundMoney(
            discountAmount
              .mul(line.lineTotal)
              .div(subtotal)
          );

          remainingDiscount = roundMoney(
            remainingDiscount.sub(lineDiscount)
          );
        }

        const taxableAmount = roundMoney(
          line.lineTotal.sub(lineDiscount)
        );

        return {
          ...line,
          lineDiscount,
          taxableAmount,
        };
      });

      // -------------------------------------------------------
      // 4G. BUILD GST BREAKUP BY RATE
      // -------------------------------------------------------

      const gstGroups = new Map();

      for (const line of taxableLines) {
        const rate = line.gstRate.toString();

        if (!gstGroups.has(rate)) {
          gstGroups.set(rate, {
            gstRate: line.gstRate,
            taxableAmount: new Decimal(0),
            gstAmount: new Decimal(0),
          });
        }

        const group = gstGroups.get(rate);

        group.taxableAmount = group.taxableAmount.plus(
          line.taxableAmount
        );
      }

      let gstAmount = new Decimal(0);

      for (const group of gstGroups.values()) {
        group.taxableAmount = roundMoney(
          group.taxableAmount
        );

        group.gstAmount = roundMoney(
          group.taxableAmount
            .mul(group.gstRate)
            .div(100)
        );

        gstAmount = gstAmount.plus(group.gstAmount);
      }

      gstAmount = roundMoney(gstAmount);

      // -------------------------------------------------------
      // 4H. FINAL TOTAL
      // -------------------------------------------------------

      const total = roundMoney(
        subtotal
          .sub(discountAmount)
          .plus(gstAmount)
      );

      // -------------------------------------------------------
      // 4I. ATOMIC STOCK DEDUCTION
      // -------------------------------------------------------
      //
      // Sort product IDs so concurrent multi-item invoices
      // acquire locks in a consistent order.
      //

      const stockItems = [...taxableLines].sort(
        (a, b) => a.productId - b.productId
      );

      for (const line of stockItems) {
        const updated = await tx.product.updateMany({
          where: {
            id: line.productId,
            isActive: true,
            stock: {
              gte: line.quantity,
            },
          },
          data: {
            stock: {
              decrement: line.quantity,
            },
          },
        });

        if (updated.count !== 1) {
          throw createHttpError(
            409,
            `Insufficient stock for product ${line.productId}`
          );
        }
      }

      // -------------------------------------------------------
      // 4J. CREATE INVOICE WITH TEMPORARY UNIQUE NUMBER
      // -------------------------------------------------------
      //
      // We need the database-generated invoice ID before
      // constructing:
      //
      // INV-YYYYMMDD-0001
      //
      // UUID guarantees the temporary value is unique.
      //

      const temporaryInvoiceNumber =
        `TMP-${crypto.randomUUID()}`;

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: temporaryInvoiceNumber,
          customerId: Number(customerId),
          subtotal,
          gstAmount,
          discount: discountAmount,
          total,
        },
      });

      // -------------------------------------------------------
      // 4K. GENERATE FINAL INVOICE NUMBER
      // -------------------------------------------------------

      const datePart = new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");

      const finalInvoiceNumber =
        `INV-${datePart}-${String(invoice.id).padStart(4, "0")}`;

      await tx.invoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          invoiceNumber: finalInvoiceNumber,
        },
      });

      // -------------------------------------------------------
      // 4L. CREATE INVOICE ITEMS
      // -------------------------------------------------------

      await tx.invoiceItem.createMany({
        data: taxableLines.map((line) => ({
          invoiceId: invoice.id,
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          gstRate: line.gstRate,
          lineTotal: line.lineTotal,
        })),
      });

      return invoice.id;
    });

    // ---------------------------------------------------------
    // 5. FETCH COMPLETE INVOICE FOR RESPONSE
    // ---------------------------------------------------------

    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // ---------------------------------------------------------
    // 6. BUILD GST BREAKUP FOR RESPONSE
    // ---------------------------------------------------------

    const gstBreakupMap = new Map();

    for (const item of invoice.items) {
      const rate = new Decimal(item.gstRate).toString();

      if (!gstBreakupMap.has(rate)) {
        gstBreakupMap.set(rate, {
          gstRate: new Decimal(item.gstRate),
          taxableAmount: new Decimal(0),
          gstAmount: new Decimal(0),
        });
      }

      const group = gstBreakupMap.get(rate);

      group.taxableAmount = group.taxableAmount.plus(
        new Decimal(item.lineTotal)
      );
    }

    // Recalculate GST breakup using the invoice discount
    // proportionally across invoice lines.
    const subtotal = new Decimal(invoice.subtotal);
    const invoiceDiscount = new Decimal(invoice.discount);

   let remainingDiscount = invoiceDiscount;

const itemsWithTaxableAmounts = invoice.items.map(
  (item, index) => {
    const lineTotal = new Decimal(item.lineTotal);

    let lineDiscount;

    if (index === invoice.items.length - 1) {
      lineDiscount = remainingDiscount;
    } else {
      lineDiscount = roundMoney(
        invoiceDiscount.mul(lineTotal).div(subtotal)
      );

      remainingDiscount = roundMoney(
        remainingDiscount.sub(lineDiscount)
      );
    }

    return {
      item,
      taxableAmount: roundMoney(
        lineTotal.sub(lineDiscount)
      ),
    };
  }
);

    const responseGstMap = new Map();

    for (const line of itemsWithTaxableAmounts) {
      const rate = new Decimal(line.item.gstRate);
      const key = rate.toString();

      if (!responseGstMap.has(key)) {
        responseGstMap.set(key, {
          gstRate: rate,
          taxableAmount: new Decimal(0),
          gstAmount: new Decimal(0),
        });
      }

      const group = responseGstMap.get(key);

      group.taxableAmount = group.taxableAmount.plus(
        line.taxableAmount
      );
    }

    for (const group of responseGstMap.values()) {
      group.taxableAmount = roundMoney(
        group.taxableAmount
      );

      group.gstAmount = roundMoney(
        group.taxableAmount
          .mul(group.gstRate)
          .div(100)
      );
    }

    return res.status(201).json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customer,
      items: invoice.items,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      gstAmount: invoice.gstAmount,
      total: invoice.total,
      gstBreakup: Array.from(responseGstMap.values()),
      createdAt: invoice.createdAt,
    });

  } catch (error) {
    console.error(error);

    if (error.status) {
      return res.status(error.status).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: "Failed to create invoice",
    });
  }
});

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags:
 *       - Invoices
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invoice'
 *       400:
 *         description: Invalid invoice ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Invoice not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */

router.get("/:id", async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);

    if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
      return res.status(400).json({
        error: "Invalid invoice ID",
      });
    }

    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        error: "Invoice not found",
      });
    }

    // Calculate GST breakup for the invoice
    const gstBreakupMap = new Map();

    for (const item of invoice.items) {
      const rate = new Decimal(item.gstRate);
      const key = rate.toString();

      if (!gstBreakupMap.has(key)) {
        gstBreakupMap.set(key, {
          gstRate: rate,
          taxableAmount: new Decimal(0),
          gstAmount: new Decimal(0),
        });
      }

      const group = gstBreakupMap.get(key);

      group.taxableAmount = group.taxableAmount.plus(
        new Decimal(item.lineTotal)
      );
    }

    // Apply invoice discount proportionally
    const subtotal = new Decimal(invoice.subtotal);
    const discount = new Decimal(invoice.discount);

    let remainingDiscount = discount;

    const taxableLines = invoice.items.map((item, index) => {
      const lineTotal = new Decimal(item.lineTotal);

      let lineDiscount;

      if (index === invoice.items.length - 1) {
        lineDiscount = remainingDiscount;
      } else if (subtotal.isZero()) {
        lineDiscount = new Decimal(0);
      } else {
        lineDiscount = roundMoney(
          discount.mul(lineTotal).div(subtotal)
        );

        remainingDiscount = roundMoney(
          remainingDiscount.sub(lineDiscount)
        );
      }

      return {
        item,
        taxableAmount: roundMoney(
          lineTotal.sub(lineDiscount)
        ),
      };
    });

    const responseGstMap = new Map();

    for (const line of taxableLines) {
      const rate = new Decimal(line.item.gstRate);
      const key = rate.toString();

      if (!responseGstMap.has(key)) {
        responseGstMap.set(key, {
          gstRate: rate,
          taxableAmount: new Decimal(0),
          gstAmount: new Decimal(0),
        });
      }

      const group = responseGstMap.get(key);

      group.taxableAmount = group.taxableAmount.plus(
        line.taxableAmount
      );
    }

    for (const group of responseGstMap.values()) {
      group.taxableAmount = roundMoney(
        group.taxableAmount
      );

      group.gstAmount = roundMoney(
        group.taxableAmount
          .mul(group.gstRate)
          .div(100)
      );
    }

    return res.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customer: invoice.customer,
      items: invoice.items,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      gstAmount: invoice.gstAmount,
      total: invoice.total,
      gstBreakup: Array.from(responseGstMap.values()),
      createdAt: invoice.createdAt,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to fetch invoice",
    });
  }
});

module.exports = router;