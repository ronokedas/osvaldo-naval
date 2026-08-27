import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth } from "../auth.js";

const router = Router();

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_"));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|doc|docx|xls|xlsx|dwg|dxf|png|jpe?g|gif|bmp|tiff?|eml|msg)$/i;
    const ext = path.extname(file.originalname);
    if (allowed.test(ext)) return cb(null, true);
    cb(new Error('Tipo de arquivo não permitido. Aceitos: PDF, DOC/DOCX, XLS/XLSX, DWG/DXF, EML/MSG e imagens.'));
  },
});

router.post("/", requireAuth, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  res.json({
    success: true,
    fileName: req.file.originalname,
    url: `/api/upload/files/${encodeURIComponent(req.file.filename)}`,
  });
});

// Legacy uploads are private too. The filename is never allowed to escape the
// uploads directory and every read is authenticated.
router.get("/files/:filename", requireAuth, (req, res) => {
  const filename = path.basename(req.params.filename);
  const uploadDir = path.resolve(process.cwd(), "uploads");
  const filePath = path.resolve(uploadDir, filename);
  if (!filePath.startsWith(`${uploadDir}${path.sep}`)) return res.status(400).json({ error: "Caminho de arquivo inválido" });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Arquivo não encontrado" });
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.sendFile(filePath);
});

export default router;
