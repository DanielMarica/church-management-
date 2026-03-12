import { Router } from "express";
import * as childrenController from "./childrenController";

const router = Router();

router.get("/", childrenController.listChildren);
router.get("/:id", childrenController.getChild);
router.post("/", childrenController.createChild);
router.patch("/:id", childrenController.updateChild);
router.delete("/:id", childrenController.deleteChild);

export default router;
