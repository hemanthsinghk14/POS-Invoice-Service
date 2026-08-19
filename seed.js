const prisma = require("./src/config/prisma");

const products = [
  // Milk products - useful for search testing
  {
    name: "Milk 1L",
    sku: "MILK-001",
    barcode: "890100000001",
    price: 60.0,
    gstRate: 5.0,
    stock: 50,
    isActive: true,
  },
  {
    name: "Milk 500ml",
    sku: "MILK-002",
    barcode: "890100000002",
    price: 32.0,
    gstRate: 5.0,
    stock: 75,
    isActive: true,
  },
  {
    name: "Full Cream Milk 1L",
    sku: "MILK-003",
    barcode: "890100000003",
    price: 72.0,
    gstRate: 5.0,
    stock: 40,
    isActive: true,
  },
  {
    name: "Toned Milk 1L",
    sku: "MILK-004",
    barcode: "890100000004",
    price: 64.0,
    gstRate: 5.0,
    stock: 2,
    isActive: true,
  },

  // Bread
  {
    name: "White Bread 400g",
    sku: "BREAD-001",
    barcode: "890100000005",
    price: 45.0,
    gstRate: 5.0,
    stock: 30,
    isActive: true,
  },
  {
    name: "Brown Bread 400g",
    sku: "BREAD-002",
    barcode: "890100000006",
    price: 50.0,
    gstRate: 5.0,
    stock: 35,
    isActive: true,
  },
  {
    name: "Whole Wheat Bread 400g",
    sku: "BREAD-003",
    barcode: "890100000007",
    price: 55.0,
    gstRate: 5.0,
    stock: 25,
    isActive: true,
  },
  {
    name: "Multigrain Bread 400g",
    sku: "BREAD-004",
    barcode: "890100000008",
    price: 65.0,
    gstRate: 5.0,
    stock: 20,
    isActive: true,
  },

  // Rice
  {
    name: "Basmati Rice 5kg",
    sku: "RICE-001",
    barcode: "890100000009",
    price: 520.0,
    gstRate: 5.0,
    stock: 15,
    isActive: true,
  },
  {
    name: "Sona Masoori Rice 5kg",
    sku: "RICE-002",
    barcode: "890100000010",
    price: 420.0,
    gstRate: 5.0,
    stock: 18,
    isActive: true,
  },
  {
    name: "Brown Rice 1kg",
    sku: "RICE-003",
    barcode: "890100000011",
    price: 145.0,
    gstRate: 5.0,
    stock: 25,
    isActive: true,
  },
  {
    name: "Idli Rice 5kg",
    sku: "RICE-004",
    barcode: "890100000012",
    price: 360.0,
    gstRate: 5.0,
    stock: 20,
    isActive: true,
  },

  // Dal / Pulses
  {
    name: "Toor Dal 1kg",
    sku: "DAL-001",
    barcode: "890100000013",
    price: 165.0,
    gstRate: 5.0,
    stock: 25,
    isActive: true,
  },
  {
    name: "Moong Dal 1kg",
    sku: "DAL-002",
    barcode: "890100000014",
    price: 145.0,
    gstRate: 5.0,
    stock: 30,
    isActive: true,
  },
  {
    name: "Masoor Dal 1kg",
    sku: "DAL-003",
    barcode: "890100000015",
    price: 120.0,
    gstRate: 5.0,
    stock: 28,
    isActive: true,
  },
  {
    name: "Chana Dal 1kg",
    sku: "DAL-004",
    barcode: "890100000016",
    price: 110.0,
    gstRate: 5.0,
    stock: 35,
    isActive: true,
  },

  // Cooking essentials
  {
    name: "Sunflower Oil 1L",
    sku: "OIL-001",
    barcode: "890100000017",
    price: 145.0,
    gstRate: 5.0,
    stock: 40,
    isActive: true,
  },
  {
    name: "Groundnut Oil 1L",
    sku: "OIL-002",
    barcode: "890100000018",
    price: 175.0,
    gstRate: 5.0,
    stock: 30,
    isActive: true,
  },
  {
    name: "Mustard Oil 1L",
    sku: "OIL-003",
    barcode: "890100000019",
    price: 160.0,
    gstRate: 5.0,
    stock: 25,
    isActive: true,
  },
  {
    name: "Olive Oil 500ml",
    sku: "OIL-004",
    barcode: "890100000020",
    price: 420.0,
    gstRate: 5.0,
    stock: 12,
    isActive: true,
  },

  // Spices
  {
    name: "Turmeric Powder 200g",
    sku: "SPICE-001",
    barcode: "890100000021",
    price: 55.0,
    gstRate: 5.0,
    stock: 40,
    isActive: true,
  },
  {
    name: "Red Chilli Powder 200g",
    sku: "SPICE-002",
    barcode: "890100000022",
    price: 70.0,
    gstRate: 5.0,
    stock: 35,
    isActive: true,
  },
  {
    name: "Coriander Powder 200g",
    sku: "SPICE-003",
    barcode: "890100000023",
    price: 60.0,
    gstRate: 5.0,
    stock: 35,
    isActive: true,
  },
  {
    name: "Garam Masala 100g",
    sku: "SPICE-004",
    barcode: "890100000024",
    price: 85.0,
    gstRate: 5.0,
    stock: 25,
    isActive: true,
  },

  // Snacks - GST variation
  {
    name: "Potato Chips 100g",
    sku: "SNACK-001",
    barcode: "890100000025",
    price: 40.0,
    gstRate: 12.0,
    stock: 50,
    isActive: true,
  },
  {
    name: "Salted Peanuts 200g",
    sku: "SNACK-002",
    barcode: "890100000026",
    price: 55.0,
    gstRate: 12.0,
    stock: 45,
    isActive: true,
  },
  {
    name: "Masala Peanuts 200g",
    sku: "SNACK-003",
    barcode: "890100000027",
    price: 60.0,
    gstRate: 12.0,
    stock: 40,
    isActive: true,
  },
  {
    name: "Nacho Chips 150g",
    sku: "SNACK-004",
    barcode: "890100000028",
    price: 90.0,
    gstRate: 12.0,
    stock: 30,
    isActive: true,
  },
  {
    name: "Chocolate Cookies 200g",
    sku: "SNACK-005",
    barcode: "890100000029",
    price: 85.0,
    gstRate: 18.0,
    stock: 35,
    isActive: true,
  },
  {
    name: "Cream Biscuits 150g",
    sku: "SNACK-006",
    barcode: "890100000030",
    price: 45.0,
    gstRate: 18.0,
    stock: 50,
    isActive: true,
  },

  // Beverages
  {
    name: "Orange Juice 1L",
    sku: "DRINK-001",
    barcode: "890100000031",
    price: 140.0,
    gstRate: 12.0,
    stock: 25,
    isActive: true,
  },
  {
    name: "Apple Juice 1L",
    sku: "DRINK-002",
    barcode: "890100000032",
    price: 150.0,
    gstRate: 12.0,
    stock: 20,
    isActive: true,
  },
  {
    name: "Mango Juice 1L",
    sku: "DRINK-003",
    barcode: "890100000033",
    price: 135.0,
    gstRate: 12.0,
    stock: 25,
    isActive: true,
  },
  {
    name: "Sparkling Water 750ml",
    sku: "DRINK-004",
    barcode: "890100000034",
    price: 85.0,
    gstRate: 18.0,
    stock: 30,
    isActive: true,
  },
  {
    name: "Instant Coffee 200g",
    sku: "DRINK-005",
    barcode: "890100000035",
    price: 280.0,
    gstRate: 5.0,
    stock: 15,
    isActive: true,
  },
  {
    name: "Green Tea 100 Bags",
    sku: "DRINK-006",
    barcode: "890100000036",
    price: 210.0,
    gstRate: 5.0,
    stock: 18,
    isActive: true,
  },

  // Personal care
  {
    name: "Bath Soap 100g",
    sku: "CARE-001",
    barcode: "890100000037",
    price: 38.0,
    gstRate: 18.0,
    stock: 60,
    isActive: true,
  },
  {
    name: "Shampoo 180ml",
    sku: "CARE-002",
    barcode: "890100000038",
    price: 165.0,
    gstRate: 18.0,
    stock: 25,
    isActive: true,
  },
  {
    name: "Conditioner 180ml",
    sku: "CARE-003",
    barcode: "890100000039",
    price: 175.0,
    gstRate: 18.0,
    stock: 25,
    isActive: true,
  },
  {
    name: "Toothpaste 150g",
    sku: "CARE-004",
    barcode: "890100000040",
    price: 110.0,
    gstRate: 18.0,
    stock: 40,
    isActive: true,
  },
  {
    name: "Toothbrush Medium",
    sku: "CARE-005",
    barcode: "890100000041",
    price: 65.0,
    gstRate: 18.0,
    stock: 35,
    isActive: true,
  },
  {
    name: "Hand Wash 250ml",
    sku: "CARE-006",
    barcode: "890100000042",
    price: 95.0,
    gstRate: 18.0,
    stock: 30,
    isActive: true,
  },

  // Household
  {
    name: "Dishwash Liquid 500ml",
    sku: "HOME-001",
    barcode: "890100000043",
    price: 120.0,
    gstRate: 18.0,
    stock: 30,
    isActive: true,
  },
  {
    name: "Laundry Detergent 1kg",
    sku: "HOME-002",
    barcode: "890100000044",
    price: 180.0,
    gstRate: 18.0,
    stock: 25,
    isActive: true,
  },
  {
    name: "Floor Cleaner 1L",
    sku: "HOME-003",
    barcode: "890100000045",
    price: 155.0,
    gstRate: 18.0,
    stock: 20,
    isActive: true,
  },
  {
    name: "Glass Cleaner 500ml",
    sku: "HOME-004",
    barcode: "890100000046",
    price: 130.0,
    gstRate: 18.0,
    stock: 20,
    isActive: true,
  },

  // Stationery
  {
    name: "Ball Pen Blue",
    sku: "STAT-001",
    barcode: "890100000047",
    price: 10.0,
    gstRate: 18.0,
    stock: 100,
    isActive: true,
  },
  {
    name: "Ball Pen Black",
    sku: "STAT-002",
    barcode: "890100000048",
    price: 10.0,
    gstRate: 18.0,
    stock: 100,
    isActive: true,
  },
  {
    name: "Notebook A5 200 Pages",
    sku: "STAT-003",
    barcode: "890100000049",
    price: 90.0,
    gstRate: 12.0,
    stock: 50,
    isActive: true,
  },
  {
    name: "Notebook A4 300 Pages",
    sku: "STAT-004",
    barcode: "890100000050",
    price: 150.0,
    gstRate: 12.0,
    stock: 40,
    isActive: true,
  },

  // Deliberately inactive products for acceptance testing
  {
    name: "Old Brand Milk 1L",
    sku: "INACTIVE-001",
    barcode: "890100000051",
    price: 58.0,
    gstRate: 5.0,
    stock: 20,
    isActive: false,
  },
  {
    name: "Discontinued Chocolate 100g",
    sku: "INACTIVE-002",
    barcode: "890100000052",
    price: 75.0,
    gstRate: 18.0,
    stock: 10,
    isActive: false,
  },
];

const customers = [
  {
    name: "Rahul Sharma",
    phone: "9876543210",
    email: "rahul.sharma@example.com",
    gstin: null,
  },
  {
    name: "Priya Reddy",
    phone: "9876543211",
    email: "priya.reddy@example.com",
    gstin: "29ABCDE1234F1Z5",
  },
  {
    name: "Arjun Kumar",
    phone: "9876543212",
    email: "arjun.kumar@example.com",
    gstin: null,
  },
  {
    name: "Sneha Patel",
    phone: "9876543213",
    email: "sneha.patel@example.com",
    gstin: "27ABCDE5678G1Z2",
  },
  {
    name: "Vikram Singh",
    phone: "9876543214",
    email: "vikram.singh@example.com",
    gstin: null,
  },
];

async function main() {
  console.log("Starting database seed...");

  // Clear existing catalogue data.
  // This keeps the seed idempotent for local development.
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();

  console.log("Existing catalogue data cleared.");

  // Create customers
  await prisma.customer.createMany({
    data: customers,
  });

  console.log(`Created ${customers.length} customers.`);

  // Create products
  await prisma.product.createMany({
    data: products,
  });

  console.log(`Created ${products.length} products.`);

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });