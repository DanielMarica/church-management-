import { Router } from 'express';
import {
  getAllStocks, getStock, createStock, updateStock, deleteStock,
  getDistributions, distribute, upload,
} from './foodStocksController';

const foodStocksRouter = Router();

foodStocksRouter.get('/', getAllStocks);
foodStocksRouter.get('/distributions', getDistributions);
foodStocksRouter.get('/:id', getStock);
foodStocksRouter.post('/', upload.single('photo'), createStock);
foodStocksRouter.patch('/:id', upload.single('photo'), updateStock);
foodStocksRouter.delete('/:id', deleteStock);
foodStocksRouter.post('/distribute', distribute);

export { foodStocksRouter };
