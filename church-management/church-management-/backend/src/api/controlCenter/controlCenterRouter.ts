import { Router } from 'express';
import {
  getFoodRequests,
  getPlanningSessions,
  upsertFoodRequest,
  deleteFoodRequest,
  getPrintRequests,
  createPrintRequest,
  updatePrintRequest,
  deletePrintRequest,
  upload,
} from './controlCenterController';

const controlCenterRouter = Router();

// Food requests
controlCenterRouter.get('/planning-sessions', getPlanningSessions);
controlCenterRouter.get('/food-requests', getFoodRequests);
controlCenterRouter.post('/food-requests', upsertFoodRequest);
controlCenterRouter.delete('/food-requests/:id', deleteFoodRequest);

// Print requests
controlCenterRouter.get('/print-requests', getPrintRequests);
controlCenterRouter.post('/print-requests', upload.single('file'), createPrintRequest);
controlCenterRouter.patch('/print-requests/:id', updatePrintRequest);
controlCenterRouter.delete('/print-requests/:id', deletePrintRequest);

export { controlCenterRouter };
