import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useBusinesses, useCities, useCategories } from "@/hooks/use-directory";
import { Header, BottomNavigation } from "@/components/Navigation";
import { BusinessCard } from "@/components/BusinessCard";
import { Loader2, SearchX, Filter, Star, X, MapPin, Navigation, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useGeolocation } from "@/hooks/use-geolocation";
import { parseWorkingHours, isBusinessOpen } from "@shared/schema";

export default function SearchResults() {
  const { t, language } = useI18n();
  const [locationString] = useLocation();
  
  // حالة البحث الفوري
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [selectedCity, setSelectedCity] = useState<number | undefined>(undefined);
  const [sortByDistance, setSortByDistance] = useState(true);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [sortByRating, setSortByRating] = useState(false);

  const { latitude, longitude, loading: geoLoading, permissionDenied, requestLocation } = useGeolocation();
  const { data: cities } = useCities();
  
  // قراءة الـ query من الـ URL أول مرة
  useEffect(() => {
    const getQueryFromURL = (): string => {
      try {
        const hash = window.location.hash;
        if (hash.includes('search?q=')) {
          const qIndex = hash.indexOf('q=') + 2;
          if (qIndex < 2) return "";
          
          let endIndex = hash.indexOf('&', qIndex);
          if (endIndex === -1) endIndex = hash.length;
          
          const encodedQuery = hash.substring(qIndex, endIndex);
          const decodedQuery = decodeURIComponent(encodedQuery);
          return decodedQuery;
        }
        return "";
      } catch (error) {
        return "";
      }
    };
    
    const initialQuery = getQueryFromURL();
    if (initialQuery) {
      setSearchTerm(initialQuery);
    }
  }, []);
  
  const { data: businesses, isLoading, error } = useBusinesses({ 
    search: searchTerm,
    minRating,
    cityId: selectedCity,
    userLat: latitude,
    userLng: longitude,
    sortByDistance,
  });

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

  const clearSearch = () => {
    setSearchTerm("");
  };

  const hasFilters = minRating !== undefined || selectedCity !== undefined || openNowOnly || sortByRating;
  const filterCount = [minRating, selectedCity, openNowOnly, sortByRating].filter(Boolean).length;

  const filteredBusinesses = useMemo(() => {
    if (!businesses) return [];
    let result = [...businesses];
    
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
  }, [businesses, openNowOnly, sortByRating]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-black pb-20">
      <Header title={t("search.results")} backHref="/" />
      
      <main className="container mx-auto px-4 py-6">
        {/* شريط البحث (منسوخ من Home.tsx) */}
        <div className="max-w-lg mx-auto relative mb-6">
          <div className="relative">
            <div className="
              relative flex items-center w-full h-14 rounded-2xl
              bg-card shadow-lg border border-border/50
              focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10
              transition-all duration-300
            ">
              <div className="grid place-items-center h-full w-14 text-muted-foreground group-focus-within:text-primary transition-colors">
                <Navigation className="w-6 h-6" />
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
              >
                {t("search.button") || "بحث"}
              </button>
            </div>
          </div>
        </div>

        {/* زر الفلاتر */}
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

        {/* الفلاتر */}
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
                    {latitude && longitude ? (
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

        {/* عرض النتائج */}
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
                ? `${searchTerm ? `نتائج البحث عن "${searchTerm}"` : "جميع المحلات"} (${filteredBusinesses.length} نتيجة)`
                : `${searchTerm ? `Results for "${searchTerm}"` : "All businesses"} (${filteredBusinesses.length} result${filteredBusinesses.length > 1 ? 's' : ''})`
              }
            </h2>
            {filteredBusinesses.map((business, idx) => (
              <BusinessCard 
                key={business.id} 
                business={business} 
                layout="list" 
                index={idx} 
              />
            ))}
          </div>
        ) : searchTerm ? (
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
                ? `لم نتمكن من العثور على نتائج لـ "${searchTerm}"`
                : `We couldn't find any results for "${searchTerm}"`
              }
            </p>
          </div>
        ) : null}
      </main>

      <BottomNavigation />
    </div>
  );
}
