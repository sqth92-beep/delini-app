import { useCategories, useBusinesses, useActiveOffers } from "@/hooks/use-directory";
import { Header, BottomNavigation } from "@/components/Navigation";
import { SearchBar } from "@/components/SearchBar";
import { CategoryCard } from "@/components/CategoryCard";
import { BusinessCard } from "@/components/BusinessCard";
import { OfferCard } from "@/components/OfferCard";
import { Loader2, ArrowLeft, Tag, Users, Search as SearchIcon, X, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { usePreview } from "@/lib/preview-context";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import logoImg from "@assets/Delini_1768321622197.png";

const NEW_OFFERS_IDS_KEY = "delini_seen_offer_ids";
const LOCATION_KEY = 'delini_user_location';

interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

async function requestUserLocation(): Promise<UserLocation | null> {
  if (!navigator.geolocation) {
    console.warn('Geolocation غير مدعوم في هذا المتصفح');
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
        };
        
        localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
        resolve(location);
      },
      (error) => {
        console.warn('لم يتم الحصول على الموقع:', error.message);
        
        const defaultLocation: UserLocation = {
          latitude: 30.5081,
          longitude: 47.7835,
          timestamp: Date.now(),
        };
        
        localStorage.setItem(LOCATION_KEY, JSON.stringify(defaultLocation));
        resolve(defaultLocation);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}

function getSavedLocation(): UserLocation | null {
  const saved = localStorage.getItem(LOCATION_KEY);
  if (!saved) return null;
  
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10;
}

export default function Home() {
  const { t } = useI18n();
  const { prefixLink } = usePreview();
  const { toast } = useToast();
  const { data: categories, isLoading: isCatLoading } = useCategories();
  const { data: featuredBusinesses, isLoading: isBizLoading } = useBusinesses();
  const { data: offers } = useActiveOffers();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  
  const hasIncremented = useRef(false);
  const hasCheckedOffers = useRef(false);
  
  const { data: visitorData } = useQuery<{ count: number }>({
    queryKey: ["/api/visitors/count"],
  });
  
  useEffect(() => {
    if (!hasIncremented.current) {
      hasIncremented.current = true;
      fetch("/api/visitors/increment", { method: "POST" });
    }
    
    const savedLocation = getSavedLocation();
    if (savedLocation) {
      setUserLocation(savedLocation);
    } else {
      requestUserLocation().then(location => {
        if (location) {
          setUserLocation(location);
          toast({
            title: "تم تحديد موقعك",
            description: "الآن يمكنك رؤية المسافات الحقيقية",
            duration: 3000,
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    if (offers && offers.length > 0 && !hasCheckedOffers.current) {
      hasCheckedOffers.current = true;
      
      const seenIdsStr = localStorage.getItem(NEW_OFFERS_IDS_KEY);
      const seenIds: number[] = seenIdsStr ? JSON.parse(seenIdsStr) : [];
      
      const newOffers = offers.filter(o => !seenIds.includes(o.id));
      
      if (newOffers.length > 0) {
        toast({
          title: `${newOffers.length} عروض جديدة`,
          description: newOffers[0].title + (newOffers.length > 1 ? ` و ${newOffers.length - 1} عروض أخرى` : ''),
          duration: 5000,
        });
      }
      
      const currentIds = offers.map(o => o.id);
      localStorage.setItem(NEW_OFFERS_IDS_KEY, JSON.stringify(currentIds));
    }
  }, [offers, toast]);
  
  const displayedVisitors = (visitorData?.count || 0) * 73;

  const topCategories = categories?.slice(0, 8);
  const featured = featuredBusinesses?.filter(b => b.subscriptionTier === 'vip').slice(0, 5);
  const topOffers = offers?.slice(0, 3);
  
  const allBusinesses = featuredBusinesses || [];
  const filteredBusinesses = searchTerm
    ? allBusinesses.filter(business => {
        const term = searchTerm.toLowerCase();
        return (
          business.name?.toLowerCase().includes(term) ||
          business.category?.name?.toLowerCase().includes(term) ||
          business.description?.toLowerCase().includes(term) ||
          business.location?.toLowerCase().includes(term)
        );
      })
    : featured || [];

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsSearching(value.length > 0);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setIsSearching(false);
  };

  const calculateBusinessDistance = (business: any): string | null => {
    if (!userLocation || !business.latitude || !business.longitude) {
      return null;
    }
    
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      business.latitude,
      business.longitude
    );
    
    return `${distance} كم`;
  };

  const showLocationStatus = () => {
    if (!userLocation) {
      return (
        <div className="flex items-center justify-center gap-2 py-2 bg-blue-50">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm text-blue-700">جاري تحديد موقعك...</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center gap-2 py-2 bg-green-50">
        <MapPin className="w-4 h-4 text-green-600" />
        <span className="text-sm text-green-700">
          موقعك محدد | 
          <button
            onClick={() => {
              requestUserLocation().then(loc => {
                if (loc) {
                  setUserLocation(loc);
                  toast({
                    title: "تم تحديث الموقع",
                    description: "المسافات محدثة الآن",
                    duration: 2000,
                  });
                }
              });
            }}
            className="mr-2 text-green-800 hover:underline text-xs"
          >
            تحديث
          </button>
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20 font-sans">
      <Header />
      {showLocationStatus()}
      
      <main className="container mx-auto px-4 py-6 space-y-10">
        
        <section className="text-center space-y-6 -mx-4 px-4">
          <div className="relative -mt-6">
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
            <img 
              src={logoImg} 
              alt="Delini" 
              className="w-full h-auto object-contain" 
            />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground leading-tight">
              {t("home.hero.title")}
            </h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {t("home.hero.subtitle")}
            </p>
          </div>
          
          <div className="max-w-lg mx-auto relative">
            <div className="relative">
              <div className="
                relative flex items-center w-full h-14 rounded-2xl
                bg-card shadow-lg border border-border/50
                focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10
                transition-all duration-300
              ">
                <div className="grid place-items-center h-full w-14 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <SearchIcon className="w-6 h-6" />
                </div>
                <input
                  className="peer h-full w-full outline-none text-base text-foreground placeholder:text-muted-foreground bg-transparent ml-4 font-medium"
                  type="text"
                  id="search"
                  placeholder={t("search.placeholder") || "ابحث عن مطعم، محل، خدمة..."}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') clearSearch();
                  }}
                  autoComplete="off"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute left-16 p-2 text-muted-foreground hover:text-foreground transition-colors"
                    type="button"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                <button 
                  type="button"
                  className="
                    absolute left-2 bg-primary text-white p-2.5 rounded-xl
                    hover:bg-primary/90 hover:scale-105 active:scale-95
                    transition-all duration-200
                    shadow-lg shadow-primary/20
                  "
                  onClick={() => {
                    if (searchTerm) {
                      toast({
                        title: `بحث عن: ${searchTerm}`,
                        description: `وجدنا ${filteredBusinesses.length} نتيجة`,
                      });
                    }
                  }}
                >
                  {t("search.button") || "بحث"}
                </button>
              </div>
              
              {isSearching && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-xl border border-border/50 p-3 z-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">
                      نتائج البحث لـ "{searchTerm}"
                    </span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {filteredBusinesses.length} نتيجة
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {searchTerm.length === 0 && (
              <div className="mt-3 text-center">
                <p className="text-xs text-muted-foreground">
                  ابدأ بالكتابة للبحث الفوري عن المطاعم والمحلات
                </p>
              </div>
            )}
          </div>
        </section>

        {isSearching ? (
          <section className="mt-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-2xl text-foreground">
                نتائج البحث: "{searchTerm}"
              </h2>
              <button
                onClick={clearSearch}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                إلغاء البحث
              </button>
            </div>
            
            {filteredBusinesses.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <SearchIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-display font-bold text-xl text-foreground">
                  لا توجد نتائج
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  لا توجد محلات تطابق "{searchTerm}". جرب كلمات بحث أخرى.
                </p>
                <button
                  onClick={clearSearch}
                  className="mt-4 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                >
                  عرض كل المحلات
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBusinesses.map((business) => {
                  const distance = calculateBusinessDistance(business);
                  return (
                    <BusinessCard 
                      key={business.id} 
                      business={business}
                      distance={distance}
                      layout="grid"
                    />
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <>
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-display font-bold text-xl text-foreground">{t("home.categories")}</h3>
                <Link href={prefixLink("/categories")} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                  {t("home.viewAll")}
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
              
              {isCatLoading ? (
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {topCategories?.map((category, idx) => (
                    <CategoryCard key={category.id} category={category} index={idx} />
                  ))}
                </div>
              )}
            </section>

            {featured && featured.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="font-display font-bold text-xl text-foreground">{t("home.featured")}</h3>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 snap-x snap-mandatory">
                  {featured.map((business, idx) => {
                    const distance = calculateBusinessDistance(business);
                    return (
                      <div key={business.id} className="min-w-[280px] w-[80%] md:w-[320px] snap-center">
                        <BusinessCard 
                          business={business} 
                          distance={distance}
                          layout="grid" 
                          index={idx} 
                        />
                      </div>
                    );
                  })}
                  <div className="w-2" />
                </div>
              </section>
            )}

            {topOffers && topOffers.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary" />
                    <h3 className="font-display font-bold text-xl text-foreground">{t("home.offers")}</h3>
                  </div>
                  <Link href={prefixLink("/offers")} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                    {t("home.viewAll")}
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {topOffers.map((offer, idx) => (
                    <OfferCard key={offer.id} offer={offer} index={idx} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {displayedVisitors > 0 && !isSearching && (
          <div className="flex items-center justify-center gap-2 py-3 mt-6" data-testid="visitor-counter">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {displayedVisitors.toLocaleString('en-US')} زائر
            </span>
          </div>
        )}

      </main>

      <BottomNavigation />
    </div>
  );
}
