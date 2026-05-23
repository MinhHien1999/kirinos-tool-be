import 'dotenv/config';
import connectDB from '../config/database.js';
import { Brand, Product } from '../models/index.js';

async function seedDatabase() {
  try {
    await connectDB();
    
    // Clear existing data
    await Brand.deleteMany({});
    await Product.deleteMany({});

    console.log('📝 Seeding brands...');
    const brands = await Brand.insertMany([
      {
        name: 'CSPS',
        description: 'Thương hiệu xe đẩy chuyên dụng',
        status: 'ACTIVE',
      },
      {
        name: 'INGCO',
        description: 'Thương hiệu dụng cụ điện chất lượng cao',
        status: 'ACTIVE',
      },
      {
        name: 'Hồng Ký',
        description: 'Thương hiệu motor điện',
        status: 'ACTIVE',
      },
    ]);

    console.log('📝 Seeding products...');
    await Product.insertMany([
      {
        name: 'Xe đẩy 3 ngăn - 71cm màu đen CSPS WNUQ071XDBB3',
        description: 'Xe đẩy dụng cụ cao cấp 3 ngăn',
        brand: brands[0]._id,
        currentSalePrice: 1533600,
        originalPrice: 1800000,
        quantity: 50,
        status: 'AVAILABLE',
        sku: 'CSPS-001',
      },
      {
        name: 'Xe đẩy 3 ngăn - 71cm màu xanh CSPS WNUQ071XDB91',
        description: 'Xe đẩy dụng cụ cao cấp 3 ngăn',
        brand: brands[0]._id,
        currentSalePrice: 1760400,
        originalPrice: 2100000,
        quantity: 35,
        status: 'AVAILABLE',
        sku: 'CSPS-002',
      },
      {
        name: 'Xe đẩy gấp gọn nhôm cao cấp INGCO HHWB61201',
        description: 'Xe đẩy gấp gọn, nhẹ và bền',
        brand: brands[1]._id,
        currentSalePrice: 1630000,
        originalPrice: 1950000,
        quantity: 40,
        status: 'AVAILABLE',
        sku: 'INGCO-001',
      },
      {
        name: 'Bàn đẩy dụng cụ INGCO chịu lực 100KG',
        description: 'Bàn đẩy chuyên dụng chịu lực 100KG',
        brand: brands[1]._id,
        currentSalePrice: 1200000,
        originalPrice: 1500000,
        quantity: 60,
        status: 'AVAILABLE',
        sku: 'INGCO-002',
      },
      {
        name: 'Motor Hồng Ký vỏ gang PLC-H3.732 (5HP - 3Pha)',
        description: 'Motor điện 5HP 3 pha',
        brand: brands[2]._id,
        currentSalePrice: 4165000,
        originalPrice: 5000000,
        quantity: 20,
        status: 'AVAILABLE',
        sku: 'HK-001',
      },
    ]);

    console.log('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
