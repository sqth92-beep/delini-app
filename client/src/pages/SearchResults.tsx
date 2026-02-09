import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useBusinesses, useCities, useCategories } from "@/hooks/use-directory";
import { Header, BottomNavigation } from "@/components/Navigation";
import { BusinessCard } from "@/components/BusinessCard";
import { SearchBar } from "@/components/SearchBar";
import { RatingStars } from "@/components/RatingStars";
import { Loader2, SearchX, Filter, Star, X, MapPin, Navigation, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useGeolocation } from "@/hooks/use-geolocation";
import { parseWorkingHours, isBusinessOpen } from "@shared/schema";
import { Link } from "wouter";

// وظيفة حساب المسافة
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
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

// جلب الموقع المحفوظ
function getSavedLocation(): { latitude: number; longitude: number } | null {
  const saved = localStorage.getItem('delini_user_location');
  if (!saved) return null;
  
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

export default function SearchResults() {
  const { t, language } = useI18n();
  const [locationString] = useLocation();
  
  // قراءة الـ query من الـ URL
  const getQueryFromURL = (): string => {
    try {
      // 1. جرب من الـ hash (للتطبيقات)
      const hash = window.location.hash;
      
      if (hash.includes('search?q=')) {
        const qIndex = hash.indexOf('q=') + 2;
        if (qIndex < 2) return "";
        
        let endIndex = hash.indexOf('&', qIndex);
        if (endIndex === -1) endIndex = hash.length;
        
        const encodedQuery = hash.substring(qIndex, endIndex);
        const decodedQuery = decodeURIComponent(encodedQuery);
        console.log("🔍 Query from hash:", decodedQuery);
        return decodedQuery;
      }
      
      // 2. إذا ما في hash، جرب الـ locationString
      if (locationString && locationString.includes('?')) {
        const params = new URLSearchParams(locationString.split('?')[1]);
        const query = params.get('q') || "";
        console.log("🔍 Query from locationString:", query);
        return query;
      }
      
      // 3. جرب الـ URL العادي
      const urlParams = new URLSearchParams(window.location.search);
      const query = urlParams.get('q') || "";
      if (query) {
        console.log("🔍 Query from URL params:", query);
        return query;
      }
      
      console.log("⚠️ No query found in URL");
      return "";
    } catch (error) {
      console.error("❌ Error parsing URL:", error);
      return "";
    }
  };
  
  const query = getQueryFromURL();

  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [selectedCity, setSelectedCity] = useState<number | undefined>(undefined);
  const [sortByDistance, setSortByDistance] = useState(true);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [sortByRating, setSortByRating] = useState(false);

  const { latitude, longitude, loading: geoLoading, permissionDenied, requestLocation } = useGeolocation();
  const { data: cities } = useCities();
  
  // جلب الموقع المحفوظ من localStorage
  const userLocation = getSavedLocation();
  
  // معلومات ديبق
  const debugInfo = `بحث: "${query || '(فارغ)'}" | حروف: ${query.length}`;
  
  useEffect(() => {
    console.log("=== SEARCH DEBUG ===");
    console.log("Query:", query);
    console.log("User Location:", userLocation);
    console.log("Window URL:", window.location.href);
  }, [query, userLocation]);
  
  const { data: businesses, isLoading, error } = useBusinesses({ 
    search: query,
    minRating,
    cityId: selectedCity,
    userLat: latitude,
    userLng: longitude,
    sortByDistance,
  });

  // إضافة المسافات للنتائج
  const businessesWithDistance = useMemo(() => {
    if (!businesses || !userLocation) return businesses || [];
    
    return businesses.map(business => {
      if (!business.latitude || !business.longitude) {
        return { ...business, distance: undefined };
      }
      
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        business.latitude,
        business.longitude
      );
      
      return {
        ...business,
        distance: distance > 0 ? `${distance} كم` : undefined
      };
    });
  }, [businesses, userLocation]);

  useEffect(() => {
    if (businessesWithDistance) {
      console.log("✅ Businesses with distance:", businessesWithDistance.length);
      businessesWithDistance.forEach(b => {
        console.log(`  - ${b.name}: ${b.distance || 'No distance'}`);
      });
    }
  }, [businessesWithDistance]);

  const ratingOptions = [
    { value: undefined, label: language === "ar" ? "الكل" : "All" },
    { value: 4, label: language === "ar" ? "4+ نجوم" : "4+ Stars" },
    { value: 3, label: language === "ar" ? "3+ نجوم" : "3+ Stars" },
    { value: 2, label: language === "ar" ? "2+ نجوم" : "2+ Stars" },
  ];

  const { data: categories } = useCategories();

  const clearFilters = () => {
    setMinRating(undefined);
    setSelectedCity(undefined);
    setOpenNowOnly(false);
    setSortByRating(false);
  };

  const hasFilters = minRating !== undefined || selectedCity !== undefined || openNowOnly || sortByRating;
  const filterCount = [minRating, selectedCity, openNowOnly, sortByRating].filter(Boolean).length;
  const hasSearchQuery = query.length > 0;

  const filteredBusinesses = useMemo(() => {
    if (!businessesWithDistance) return [];
    let result = [...businessesWithDistance];
    
    if (openNowOnly) {
      result = result.filter(b => {
        const workingHours = parseWorkingHours((b as any).workingHoursJson);
        return workingHours ? isBusinessOpen(workingHours) : false;
      });
    }
    
    if (sortByRating) {
      result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }
    
    return result;
  }, [businessesWithDistance, openNowOnly, sortByRating]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black pb-20">
      <Header title={t("search.results")} backHref="/" />
      
      <main className="container mx-auto px-4 py-6">
        {/* شريط الديبق */}
        <div className="mb-4 p-3 bg-red-900/80 border border-red-700 rounded-lg">
          <div className="text-white text-sm font-mono">
            <div className="font-bold">🔍 حالة البحث:</div>
            <div>{debugInfo}</div>
            <div>عدد النتائج: {filteredBusinesses?.length || 0}</div>
            <div>الموقع: {userLocation ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : 'غير محدد'}</div>
            <div className="text-xs opacity-70 mt-1">هذا الشريط للإختبار فقط وسيتم إزالته</div>
          </div>
        </div>

        <div className="mb-6">
          <SearchBar initialValue={query} />
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1 bg-gradient-to-r from-amber-900 to-amber-800 hover:from-amber-800 hover:to-amber-700 text-amber-50 border-amber-700"
            data-testid="button-toggle-filters"
          >
            <Filter className="w-4 h-4" />
            {language === "ar" ? "الفلاتر" : "Filters"}
            {hasFilters && (
              <span className="w-5 h-5 rounded-full bg-amber-300 text-amber-900 text-xs flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </Button>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1 text-amber-300 hover:text-amber-100 hover:bg-amber-900/30"
              data-testid="button-clear-filters"
            >
              <X className="w-4 h-4" />
              {language === "ar" ? "مسح" : "Clear"}
            </Button>
          )}
        </div>

        {/* رسالة إذا ما في كلمة بحث */}
        {!hasSearchQuery && !hasFilters && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-900/30 to-amber-950/40 border border-amber-800/40 rounded-xl backdrop-blur-sm">
            <p className="text-amber-200 text-center font-medium text-sm">
              {language === "ar" 
                ? "🔍 اكتب في المربع أعلاه للبحث عن محلات معينة، أو استخدم الفلاتر للتصفية"
                : "🔍 Type in the search box above to find specific businesses, or use filters to narrow results"}
            </p>
          </div>
        )}

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-amber-900/30 p-4 space-y-4 shadow-xl">
                <div>
                  <label className="text-sm font-medium text-amber-300 mb-2 flex items-center gap-1">
                    <Navigation className="w-4 h-4 text-amber-400" />
                    {language === "ar" ? "الترتيب حسب الموقع" : "Sort by Location"}
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {userLocation ? (
                      <button
                        onClick={() => setSortByDistance(!sortByDistance)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                          sortByDistance
                            ? "bg-gradient-to-r from-amber-700 to-amber-600 text-amber-50 shadow-lg shadow-amber-900/50"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-amber-200"
                        }`}
                        data-testid="filter-sort-distance"
                      >
                        {language === "ar" ? "الأقرب أولاً" : "Nearest First"}
                      </button>
                    ) : permissionDenied ? (
                      <span className="text-xs text-amber-300/70">
                        {language === "ar" ? "تم رفض الوصول للموقع" : "Location access denied"}
                      </span>
                    ) : geoLoading ? (
                      <span className="text-xs text-amber-300/70 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {language === "ar" ? "جاري تحديد الموقع..." : "Getting location..."}
                      </span>
                    ) : (
                      <button
                        onClick={requestLocation}
                        className="px-3 py-1.5 rounded-full text-sm bg-gradient-to-r from-amber-900/50 to-amber-800/50 text-amber-200 hover:from-amber-800/60 hover:to-amber-700/60 transition-all duration-200"
                        data-testid="button-enable-location"
                      >
                        {language === "ar" ? "تفعيل الموقع" : "Enable Location"}
                      </button>
                    )}
                  </div>
                </div>

                {cities && cities.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-amber-300 mb-2 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      {t("city.selectCity")}
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        onClick={() => setSelectedCity(undefined)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                          selectedCity === undefined
                            ? "bg-gradient-to-r from-amber-700 to-amber-600 text-amber-50 shadow-lg shadow-amber-900/50"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-amber-200"
                        }`}
                        data-testid="filter-city-all"
                      >
                        {t("city.allCities")}
                      </button>
                      {cities.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => setSelectedCity(city.id)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                            selectedCity === city.id
                              ? "bg-gradient-to-r from-amber-700 to-amber-600 text-amber-50 shadow-lg shadow-amber-900/50"
                              : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-amber-200"
                          }`}
                          data-testid={`filter-city-${city.id}`}
                        >
                          {language === "ar" ? city.name : city.nameEn}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-amber-300 mb-2 flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400" />
                    {t("search.minRating")}
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ratingOptions.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => setMinRating(option.value)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                          minRating === option.value
                            ? "bg-gradient-to-r from-amber-700 to-amber-600 text-amber-50 shadow-lg shadow-amber-900/50"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-amber-200"
                        }`}
                        data-testid={`filter-rating-${option.value ?? 'all'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-amber-300 mb-2 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-amber-400" />
                    {language === "ar" ? "خيارات إضافية" : "Additional Options"}
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      onClick={() => setOpenNowOnly(!openNowOnly)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 flex items-center gap-1 ${
                        openNowOnly
                          ? "bg-gradient-to-r from-emerald-700 to-emerald-600 text-white shadow-lg shadow-emerald-900/50"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-emerald-200"
                      }`}
                      data-testid="filter-open-now"
                    >
                      <Clock className="w-3 h-3" />
                      {language === "ar" ? "مفتوح الآن" : "Open Now"}
                    </button>
                    <button
                      onClick={() => setSortByRating(!sortByRating)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 flex items-center gap-1 ${
                        sortByRating
                          ? "bg-gradient-to-r from-amber-700 to-amber-600 text-amber-50 shadow-lg shadow-amber-900/50"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-amber-200"
                      }`}
                      data-testid="filter-sort-rating"
                    >
                      <TrendingUp className="w-3 h-3" />
                      {language === "ar" ? "الأعلى تقييماً" : "Highest Rated"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex justify-center pt-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-amber-400 mx-auto mb-4" />
              <p className="text-amber-300 font-medium">
                {language === "ar" ? "جاري البحث عن المحلات..." : "Searching for businesses..."}
              </p>
            </div>
          </div>
        ) : filteredBusinesses && filteredBusinesses.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-amber-300 mb-2">
              {language === "ar" 
                ? `${hasSearchQuery ? `نتائج البحث عن "${query}"` : "جميع المحلات"} (${filteredBusinesses.length} نتيجة)`
                : `${hasSearchQuery ? `Results for "${query}"` : "All businesses"} (${filteredBusinesses.length} result${filteredBusinesses.length > 1 ? 's' : ''})`
              }
            </h2>
            {filteredBusinesses.map((business, idx) => (
              <BusinessCard 
                key={business.id} 
                business={business} 
                distance={(business as any).distance} // ⬅️ نرسل المسافة هنا
                layout="list" 
                index={idx} 
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-20 text-center text-amber-300/80">
            <div className="relative mb-6">
              <SearchX className="w-20 h-20 opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-transparent rounded-full blur-xl" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-amber-200">
              {t("search.noResults")}
            </h3>
            <p className="max-w-md mb-6">
              {language === "ar" 
                ? hasSearchQuery 
                  ? `لم نتمكن من العثور على نتائج لـ "${query}"`
                  : "لم نتمكن من العثور على أي محلات."
                : hasSearchQuery
                  ? `We couldn't find any results for "${query}"`
                  : "We couldn't find any businesses."
              }
            </p>
            <p className="text-sm text-amber-300/60 mb-8">
              {language === "ar" 
                ? "جرب كلمات مفتاحية أخرى أو قم بتغيير الفلاتر."
                : "Try different keywords or change the filters."
              }
            </p>
            
            {categories && categories.length > 0 && (
              <div className="mt-6 w-full max-w-md">
                <p className="text-sm font-medium mb-3 text-amber-300">
                  {language === "ar" ? "تصفح الأقسام:" : "Browse categories:"}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {categories.slice(0, 6).map((cat) => (
                    <Link 
                      key={cat.id}
                      href={`/categories/${cat.id}`}
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-900/40 to-amber-950/40 text-amber-200 text-sm hover:from-amber-800/50 hover:to-amber-900/50 hover:text-amber-100 transition-all duration-200 border border-amber-800/30"
                      data-testid={`suggestion-category-${cat.id}`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
