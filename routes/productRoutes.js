import express from 'express';
// Thay đổi dòng này:
import {
  getAllProducts,
  getProductsForClient,
  getSearchSuggestionsForClient,
  getSearchProductsFullPage,
  createProduct,
  uploadProductImages,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';

import { uploadMultipleFiles } from '../middlewares/upload.js';

const router = express.Router();

// Sử dụng trực tiếp tên hàm, bỏ "productController."
router.get('/', getAllProducts);
router.get('/client', getProductsForClient);
router.get('/client/search-suggestions', getSearchSuggestionsForClient);
router.get('/client/search-full', getSearchProductsFullPage);
router.post('/', uploadMultipleFiles, createProduct);
router.post('/:id/images', uploadMultipleFiles, uploadProductImages);
router.get('/:id', getProductById);
router.put('/:id', uploadMultipleFiles, updateProduct);
router.delete('/:id', deleteProduct);

export default router;
