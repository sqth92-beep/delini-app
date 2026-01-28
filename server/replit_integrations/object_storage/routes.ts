import type { Express, Request, Response, NextFunction } from "express";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!(req.session as any)?.adminId) {
    return res.status(401).json({ message: "غير مصرح - يجب تسجيل الدخول كمدير" });
  }
  next();
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function registerObjectStorageRoutes(app: Express): void {
  app.post("/api/uploads/request-url", requireAdmin, async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name || !contentType || !size) {
        return res.status(400).json({
          error: "الحقول المطلوبة: name, contentType, size",
        });
      }

      if (!ALLOWED_MIME_TYPES.includes(contentType)) {
        return res.status(400).json({
          error: `نوع الملف غير مسموح. الأنواع المسموحة: ${ALLOWED_MIME_TYPES.join(', ')}`,
        });
      }

      if (size > MAX_FILE_SIZE) {
        return res.status(400).json({
          error: `حجم الملف يجب أن يكون أقل من ${MAX_FILE_SIZE / (1024 * 1024)} ميجابايت`,
        });
      }

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dllsznmnq';
      const apiKey = process.env.CLOUDINARY_API_KEY || '915772657186991';
      const folder = 'delini';
      const publicId = `delini_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      res.json({
        success: true,
        cloudName: cloudName,
        apiKey: apiKey,
        uploadPreset: 'ml_default',
        folder: folder,
        publicId: publicId,
        uploadURL: `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        timestamp: Math.round((new Date()).getTime() / 1000),
      });
    } catch (error) {
      console.error("Error in upload request:", error);
      res.status(500).json({ error: "فشل في إعداد بيانات الرفع" });
    }
  });

  // حذف الـ route الثاني (app.get) لأنه مش لازم لـ Cloudinary
}
