import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, User, Loader2, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@assets/Delini_1768321622197.png";
import { config } from "@/lib/config";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem("admin_remember") === "true";
  });

  // ملء اسم المستخدم إذا كان محفوظاً
  useEffect(() => {
    if (rememberMe) {
      const savedUser = localStorage.getItem("admin_saved_username");
      if (savedUser) {
        setUsername(savedUser);
      }
    }
  }, [rememberMe]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loginUrl = config.getFullUrl("/api/admin/login");
      
      const res = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.token || data.accessToken || data.jwt) {
          const token = data.token || data.accessToken || data.jwt;
          
          if (rememberMe) {
            // ✅ تذكرني: تخزين طويل المدى
            localStorage.setItem("admin_token", token); // التوكن الأساسي
            localStorage.setItem("admin_remember", "true");
            localStorage.setItem("admin_saved_username", username);
            
            toast({ 
              title: "تم تسجيل الدخول بنجاح", 
              description: "✓ سيتم تذكر دخولك لمدة 3 أيام" 
            });
          } else {
            // ❌ بدون تذكرني: تخزين مؤقت فقط
            localStorage.setItem("admin_token", token); // نفس المفتاح
            localStorage.removeItem("admin_remember");
            localStorage.removeItem("admin_saved_username");
            
            toast({ 
              title: "تم تسجيل الدخول بنجاح", 
              description: "✓ ستبقى مسجلاً خلال هذه الجلسة"
            });
          }
        }
        
        setLocation("/admin");
      } else {
        toast({ 
          title: "خطأ في تسجيل الدخول", 
          description: data.message || "اسم المستخدم أو كلمة المرور غير صحيحة",
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({ 
        title: "خطأ في الاتصال", 
        description: error.message || "يرجى التحقق من اتصال السيرفر",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxClick = () => {
    const newValue = !rememberMe;
    setRememberMe(newValue);
    
    if (!newValue) {
      localStorage.removeItem("admin_saved_username");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4" dir="rtl">
      <div className="mb-8">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowRight className="w-4 h-4" />
            القائمة الرئيسية
          </Button>
        </Link>
      </div>
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-28 h-28 mb-4">
            <img src={logoImg} alt="دلّيني" className="w-full h-full object-cover rounded-2xl" />
          </div>
          <CardTitle className="text-2xl font-display">لوحة التحكم</CardTitle>
          <p className="text-muted-foreground text-sm mt-2">سجل الدخول لإدارة التطبيق</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم المستخدم</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pr-10 pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* قسم تذكرني */}
            <div className="flex items-center gap-2 py-2">
              <button
                type="button"
                onClick={handleCheckboxClick}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                  rememberMe 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'bg-background border-input hover:border-primary'
                }`}
                aria-label={rememberMe ? "عدم التذكر" : "تذكرني"}
              >
                {rememberMe && <Check className="w-3 h-3" />}
              </button>
              <label 
                className="text-sm text-muted-foreground cursor-pointer select-none"
                onClick={handleCheckboxClick}
              >
                تذكرني لمدة 3 أيام
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "تسجيل الدخول"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
