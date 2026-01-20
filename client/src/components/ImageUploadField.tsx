import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { config } from "@/lib/config"; // ⬅️ أضف هذا

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  testId?: string;
  previewClassName?: string;
  showPreview?: boolean;
}

export function ImageUploadField({
  value,
  onChange,
  placeholder = "https://...",
  testId,
  previewClassName = "w-24 h-24",
  showPreview = true,
}: ImageUploadFieldProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  // ⬇️ دالة رفع مباشرة (بدون useUpload)
  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const token = localStorage.getItem("admin_token");
      
      const res = await fetch(config.getFullUrl("/api/upload"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      // ⬇️ تحقق إذا كان response هو JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("API returned non-JSON:", text.substring(0, 200));
        throw new Error("الخادم لم يرجع بيانات صحيحة. تأكد من أن خادم رفع الصور يعمل.");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "خطأ في رفع الصورة");
      }

      // ⬇️ تأكد من هيكل الـ response
      const imageUrl = data.url || data.objectPath || data.path || data.imageUrl;
      if (!imageUrl) {
        console.error("Response structure:", data);
        throw new Error("رابط الصورة غير موجود في الرد");
      }

      return imageUrl;
    } catch (error: any) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "يرجى اختيار ملف صورة", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    
    try {
      const imageUrl = await handleFileUpload(file);
      onChange(imageUrl);
      toast({ title: "تم رفع الصورة بنجاح" });
    } catch (error: any) {
      toast({ 
        title: "خطأ في رفع الصورة", 
        description: error.message || "حدث خطأ غير متوقع",
        variant: "destructive" 
      });
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          data-testid={testId}
          disabled={isUploading}
        />
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
            data-testid={testId ? `${testId}-upload` : undefined}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isUploading}
            className="pointer-events-none"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </Button>
        </div>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange("")}
            className="text-destructive hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      {showPreview && value && (
        <div className={`relative bg-muted rounded-lg overflow-hidden ${previewClassName}`}>
          <img
            src={value}
            alt="معاينة"
            className="w-full h-full object-cover"
            onError={(e) => {
              // إذا الصورة ما ظهرت
              (e.target as HTMLImageElement).style.display = 'none';
              toast({ 
                title: "تحذير", 
                description: "رابط الصورة غير صالح",
                variant: "destructive" 
              });
            }}
          />
        </div>
      )}
    </div>
  );
}
