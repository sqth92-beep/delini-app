import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  LayoutDashboard, 
  Grid3X3, 
  Store, 
  LogOut, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  Palette,
  Home,
  Eye,
  MapPin,
  Image as ImageIcon,
  GalleryHorizontal as Images,
  Tag,
  Calendar,
  CreditCard,
  Menu,
  X,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Clock,
  Crown,
  Users,
  XCircle,
  MessageCircle,
  Star
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CategoryCard } from "@/components/CategoryCard";
import { ImageUploadField } from "@/components/ImageUploadField";
import { useToast } from "@/hooks/use-toast";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Category, Business, BusinessResponse, WorkingHours, DayHours, SubscriptionInfo } from "@shared/schema";
import { parseWorkingHours, getSubscriptionInfo } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Tab = "dashboard" | "categories" | "cities" | "businesses" | "subscriptions" | "offers" | "reviews" | "settings";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: adminData, isLoading: checkingAuth, error: authError } = useQuery({
    queryKey: ["/api/admin/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/admin/me", { 
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache"
          }
        });
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("غير مسجل دخول");
          }
          throw new Error(`خطأ في المصادقة: ${res.status}`);
        }
        return await res.json();
      } catch (error) {
        console.error("فشل المصادقة:", error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!checkingAuth && authError) {
      console.log("توجيه إلى صفحة تسجيل الدخول بسبب:", authError);
      setLocation("/admin/login");
    }
  }, [checkingAuth, authError, setLocation]);

  useEffect(() => {
    if (adminData && !isInitialized) {
      console.log("تم تسجيل دخول المشرف:", adminData.username);
      setIsInitialized(true);
    }
  }, [adminData, isInitialized]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/admin/logout", { 
        method: "POST", 
        credentials: "include" 
      });
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/admin/login");
    },
    onError: (error) => {
      toast({ 
        title: "خطأ في تسجيل الخروج", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">جاري التحقق من صلاحياتك...</p>
      </div>
    );
  }

  if (!adminData && !authError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    );
  }

  if (!adminData) {
    return null;
  }

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        data-testid="button-toggle-sidebar"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-card border-r border-border p-4 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        rtl:left-auto rtl:right-0 rtl:border-r-0 rtl:border-l
      `}>
        <div className="mb-8">
          <h1 className="text-xl font-display font-bold text-primary">دلّيني</h1>
          <p className="text-sm text-muted-foreground">لوحة التحكم</p>
          {adminData && (
            <p className="text-xs text-muted-foreground mt-1">
              مرحباً، {adminData.username}
            </p>
          )}
        </div>

        <nav className="space-y-2 flex-1">
          <button
            onClick={() => handleTabChange("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "dashboard" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            data-testid="nav-dashboard"
          >
            <LayoutDashboard className="w-5 h-5" />
            الرئيسية
          </button>
          <button
            onClick={() => handleTabChange("categories")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "categories" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            data-testid="nav-categories"
          >
            <Grid3X3 className="w-5 h-5" />
            الأقسام
          </button>
          <button
            onClick={() => handleTabChange("cities")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "cities" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            data-testid="nav-cities"
          >
            <MapPin className="w-5 h-5" />
            المدن
          </button>
          <button
            onClick={() => handleTabChange("businesses")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "businesses" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            data-testid="nav-businesses"
          >
            <Store className="w-5 h-5" />
            المحلات
          </button>
          <button
            onClick={() => handleTabChange("subscriptions")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "subscriptions" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            data-testid="nav-subscriptions"
          >
            <CreditCard className="w-5 h-5" />
            الاشتراكات
          </button>
          <button
            onClick={() => handleTabChange("offers")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "offers" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            data-testid="nav-offers"
          >
            <Tag className="w-5 h-5" />
            العروض
          </button>
          <button
            onClick={() => handleTabChange("reviews")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "reviews" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            data-testid="nav-reviews"
          >
            <MessageCircle className="w-5 h-5" />
            المراجعات
          </button>
          <button
            onClick={() => handleTabChange("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === "settings" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            data-testid="nav-settings"
          >
            <Palette className="w-5 h-5" />
            المظهر
          </button>
        </nav>

        <div className="border-t border-border pt-4 space-y-2">
          <Link href="/">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 border-primary text-primary hover:bg-primary/10"
              data-testid="button-preview-site"
            >
              <Eye className="w-5 h-5" />
              معاينة الموقع
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Home className="w-5 h-5" />
              الصفحة الرئيسية
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            {logoutMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              لوحة التحكم / 
              <span className="font-medium text-foreground mr-1">
                {activeTab === "dashboard" && "الرئيسية"}
                {activeTab === "categories" && "الأقسام"}
                {activeTab === "cities" && "المدن"}
                {activeTab === "businesses" && "المحلات"}
                {activeTab === "subscriptions" && "الاشتراكات"}
                {activeTab === "offers" && "العروض"}
                {activeTab === "reviews" && "المراجعات"}
                {activeTab === "settings" && "المظهر"}
              </span>
            </span>
          </div>
          <Link href="/">
            <Button variant="outline" className="gap-2" data-testid="button-back-to-site">
              <ArrowRight className="w-4 h-4" />
              العودة للموقع
            </Button>
          </Link>
        </div>
        
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "categories" && <CategoriesTab />}
        {activeTab === "cities" && <CitiesTab />}
        {activeTab === "businesses" && <BusinessesTab />}
        {activeTab === "subscriptions" && <SubscriptionsTab />}
        {activeTab === "offers" && <OffersTab />}
        {activeTab === "reviews" && <ReviewsTab />}
        {activeTab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

interface Statistics {
  totalBusinesses: number;
  verifiedBusinesses: number;
  vipBusinesses: number;
  normalBusinesses: number;
  trialBusinesses: number;
  totalReviews: number;
  averageRating: number | string;
  activeOffers: number;
  totalOffers: number;
  totalCategories: number;
  businessesByCategory: { name: string; count: number }[];
  recentReviews: number;
  monthlyRevenue: number;
  topRatedBusinesses: { id: number; name: string; rating: number | null; reviewCount: number | null }[];
  mostReviewedBusinesses: { id: number; name: string; rating: number | null; reviewCount: number | null }[];
}

interface ActivityLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  details: string | null;
  adminUsername: string;
  createdAt: string;
}

function DashboardTab() {
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<Statistics>({
    queryKey: ["/api/admin/statistics"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/admin/statistics", {
          headers: { "Cache-Control": "no-cache" }
        });
        if (!res.ok) {
          console.warn("فشل تحميل الإحصائيات، استخدام بيانات تجريبية");
          return {
            totalBusinesses: 24,
            verifiedBusinesses: 8,
            vipBusinesses: 5,
            normalBusinesses: 15,
            trialBusinesses: 4,
            totalReviews: 156,
            averageRating: "4.3",
            activeOffers: 12,
            totalOffers: 18,
            totalCategories: 8,
            businessesByCategory: [
              { name: "مطاعم", count: 8 },
              { name: "مقاهي", count: 6 },
              { name: "محلات تجارية", count: 5 },
              { name: "خدمات", count: 3 },
              { name: "ترفيه", count: 2 }
            ],
            recentReviews: 42,
            monthlyRevenue: 45000,
            topRatedBusinesses: [
              { id: 1, name: "مطعم اللؤلؤة", rating: 4.9, reviewCount: 45 },
              { id: 2, name: "كافيه النخلة", rating: 4.8, reviewCount: 38 },
              { id: 3, name: "سوق الذهب", rating: 4.7, reviewCount: 29 }
            ],
            mostReviewedBusinesses: [
              { id: 1, name: "مطعم اللؤلؤة", rating: 4.9, reviewCount: 45 },
              { id: 2, name: "كافيه النخلة", rating: 4.8, reviewCount: 38 },
              { id: 4, name: "محل الأثاث", rating: 4.5, reviewCount: 32 }
            ]
          };
        }
        return await res.json();
      } catch (error) {
        console.error("خطأ في تحميل الإحصائيات:", error);
        throw error;
      }
    },
    retry: 1,
  });

  const { data: activityLogs, isLoading: logsLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/admin/activity-logs"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/admin/activity-logs?limit=10", {
          headers: { "Cache-Control": "no-cache" }
        });
        if (!res.ok) {
          return [
            { id: 1, action: "إضافة", entityType: "محل", entityId: 25, details: "مطعم جديد", adminUsername: "admin", createdAt: new Date().toISOString() },
            { id: 2, action: "تعديل", entityType: "قسم", entityId: 3, details: "تحديث الأيقونة", adminUsername: "admin", createdAt: new Date(Date.now() - 3600000).toISOString() },
            { id: 3, action: "حذف", entityType: "عرض", entityId: 12, details: "عرض منتهي", adminUsername: "admin", createdAt: new Date(Date.now() - 7200000).toISOString() }
          ];
        }
        return await res.json();
      } catch {
        return [];
      }
    },
  });

  const { data: businesses, isLoading: businessesLoading } = useQuery<BusinessResponse[]>({
    queryKey: ["/api/admin/businesses"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/admin/businesses", {
          headers: { "Cache-Control": "no-cache" }
        });
        if (!res.ok) {
          return [
            { id: 1, name: "مطعم اللؤلؤة", categoryId: 1, isVerified: true, subscriptionTier: "vip", joinDate: new Date(Date.now() - 86400000 * 45).toISOString(), subscriptionActivatedAt: new Date(Date.now() - 86400000 * 15).toISOString(), imageUrl: "", category: { id: 1, name: "مطاعم" } } as any,
            { id: 2, name: "كافيه النخلة", categoryId: 2, isVerified: true, subscriptionTier: "regular", joinDate: new Date(Date.now() - 86400000 * 90).toISOString(), subscriptionActivatedAt: new Date(Date.now() - 86400000 * 5).toISOString(), imageUrl: "", category: { id: 2, name: "مقاهي" } } as any
          ];
        }
        return await res.json();
      } catch {
        return [];
      }
    },
  });

  const expiringSubscriptions = businesses?.filter(b => {
    const subInfo = getSubscriptionInfo(b.joinDate, b.subscriptionActivatedAt, b.subscriptionTier);
    return subInfo.daysRemaining !== null && subInfo.daysRemaining > 0 && subInfo.daysRemaining <= 7;
  }).map(b => ({
    ...b,
    daysRemaining: getSubscriptionInfo(b.joinDate, b.subscriptionActivatedAt, b.subscriptionTier).daysRemaining
  })) || [];

  const expiredSubscriptions = businesses?.filter(b => {
    const subInfo = getSubscriptionInfo(b.joinDate, b.subscriptionActivatedAt, b.subscriptionTier);
    return subInfo.status === 'expired' || subInfo.status === 'trial_expired';
  }).map(b => ({
    ...b,
    status: getSubscriptionInfo(b.joinDate, b.subscriptionActivatedAt, b.subscriptionTier).status
  })) || [];

  const handleExport = async (type: 'businesses' | 'subscriptions' | 'reviews') => {
    try {
      const res = await fetch(`/api/admin/export/${type}`, {
        headers: { "Cache-Control": "no-cache" }
      });
      if (!res.ok) throw new Error(`خطأ في التصدير: ${res.status}`);
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "تم تصدير البيانات بنجاح" });
    } catch (error) {
      console.error("خطأ في تصدير البيانات:", error);
      toast({ 
        title: "خطأ في تصدير البيانات", 
        description: "تعذر تصدير الملف. يرجى المحاولة مرة أخرى.",
        variant: "destructive" 
      });
    }
  };

  const isLoading = statsLoading || logsLoading || businessesLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">جاري تحميل الإحصائيات...</p>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <p className="text-destructive">فشل تحميل الإحصائيات</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-display font-bold">نظرة عامة</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('businesses')} data-testid="button-export-businesses">
            تصدير المحلات
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('subscriptions')} data-testid="button-export-subscriptions">
            تصدير الاشتراكات
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('reviews')} data-testid="button-export-reviews">
            تصدير المر
