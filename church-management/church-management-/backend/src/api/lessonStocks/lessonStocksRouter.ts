import multer from "multer";
import { Router } from "express";
import * as lessonStocksController from "./lessonStocksController";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "audio/mpeg",
      "audio/mp4",
      "audio/wav",
    ];
    if (allowed.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error(`Type de fichier non supporté : ${file.mimetype}`));
    }
  },
});

const router = Router();

router.get("/", lessonStocksController.listLessonStocks);
router.get("/:id", lessonStocksController.getLessonStock);
router.post("/", upload.single("file"), lessonStocksController.createLessonStock);
router.patch("/:id", upload.single("file"), lessonStocksController.updateLessonStock);
router.delete("/:id", lessonStocksController.deleteLessonStock);

export default router;
