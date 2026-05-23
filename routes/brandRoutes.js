import express from 'express';
import * as brandController from '../controllers/brandController.js';
import { uploadSingleFile } from '../middlewares/upload.js';

const router = express.Router();

// Brand routes
router.get('/', brandController.getAllBrands);
router.post('/', uploadSingleFile, brandController.createBrand);
router.post('/:id/logo', uploadSingleFile, brandController.uploadBrandLogo);
router.get('/:id', brandController.getBrandById);
router.put('/:id', uploadSingleFile, brandController.updateBrand);
router.delete('/:id', brandController.deleteBrand);

export default router;
