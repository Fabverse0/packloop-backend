import { Router } from 'express';
import { StationController } from '../controllers/station.controller.js';

const router = Router();

router.get('/', StationController.getAllStations);
router.get('/:id', StationController.getStationById);
router.get('/:id/compartments', StationController.getCompartments);

export default router;
