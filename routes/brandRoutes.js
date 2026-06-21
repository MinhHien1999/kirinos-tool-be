import express from 'express';
import * as brandController from '../controllers/brandController.js';
import { uploadSingleFile } from '../middlewares/upload.js';
import { 
  getProductsByBrandSlug, 
} from '../controllers/productController.js'; 

const router = express.Router();

// Brand routes
router.get('/', brandController.getAllBrands);
router.get('/:slug/products', getProductsByBrandSlug);
router.post('/', uploadSingleFile, brandController.createBrand);
router.post('/:id/logo', uploadSingleFile, brandController.uploadBrandLogo);
router.get('/:id', brandController.getBrandById);
router.put('/:id', uploadSingleFile, brandController.updateBrand);
router.delete('/:id', brandController.deleteBrand);

export default router;
