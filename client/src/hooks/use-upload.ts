import { useState, useCallback } from "react";
import type { UppyFile } from "@uppy/core";
import { config } from "@/lib/config"; // ⬅️ أضف هذا

interface UploadMetadata {
  name: string;
  size: number;
  contentType: string;
}

interface UploadResponse {
  uploadURL: string;
  objectPath: string;
  metadata: UploadMetadata;
}

interface UseUploadOptions {
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const requestUploadUrl = useCallback(
    async (file: File): Promise<UploadResponse> => {
      // ⬇️ غير المسار هنا
      const response = await fetch(config.getFullUrl("/api/upload"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("admin_token")}`, // ⬅️ أضف توكن
        },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      });

      // ⬇️ تحقق من JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("API returned non-JSON:", text.substring(0, 200));
        throw new Error("الخادم لم يرجع بيانات صحيحة. تأكد من خادم رفع الصور.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to get upload URL");
      }

      const data = await response.json();
      
      // ⬇️ تأكد من هيكل الـ response
      const objectPath = data.url || data.objectPath || data.path || data.imageUrl;
      if (!objectPath) {
        console.error("Upload response:", data);
        throw new Error("رابط الصورة غير موجود في الرد");
      }

      return {
        uploadURL: data.uploadURL || objectPath,
        objectPath: objectPath,
        metadata: {
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        },
      };
    },
    []
  );

  const uploadToPresignedUrl = useCallback(
    async (file: File, uploadURL: string): Promise<void> => {
      const response = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to upload file to storage");
      }
    },
    []
  );

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResponse | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        // ⬇️ حل بديل مباشر بدون presigned URL
        const formData = new FormData();
        formData.append("image", file);
        
        const token = localStorage.getItem("admin_token");
        const response = await fetch(config.getFullUrl("/api/upload"), {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formData,
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Upload API error:", text.substring(0, 200));
          throw new Error("خادم رفع الصور غير متوفر");
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "خطأ في رفع الصورة");
        }

        const objectPath = data.url || data.objectPath || data.path || data.imageUrl;
        if (!objectPath) {
          throw new Error("رابط الصورة غير موجود");
        }

        const uploadResponse: UploadResponse = {
          uploadURL: objectPath,
          objectPath: objectPath,
          metadata: {
            name: file.name,
            size: file.size,
            contentType: file.type || "application/octet-stream",
          },
        };

        setProgress(100);
        options.onSuccess?.(uploadResponse);
        return uploadResponse;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed");
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [options]
  );

  const getUploadParameters = useCallback(
    async (
      file: UppyFile<Record<string, unknown>, Record<string, unknown>>
    ): Promise<{
      method: "PUT";
      url: string;
      headers?: Record<string, string>;
    }> => {
      const response = await fetch(config.getFullUrl("/api/upload"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("admin_token")}`,
        },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const data = await response.json();
      const uploadUrl = data.uploadURL || data.url || data.objectPath;
      
      return {
        method: "PUT",
        url: uploadUrl,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      };
    },
    []
  );

  return {
    uploadFile,
    getUploadParameters,
    isUploading,
    error,
    progress,
  };
}
