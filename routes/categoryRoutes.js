import express from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { 
  getProductsByCategorySlug, 
} from '../controllers/productController.js'; 
const router = express.Router();

// Category routes
router.get('/', categoryController.getAllCategories);
router.get('/:slug/products', getProductsByCategorySlug);
router.get('/:id', categoryController.getCategoryById);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;