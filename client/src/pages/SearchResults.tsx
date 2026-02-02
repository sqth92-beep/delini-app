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

export default function SearchResults() {
  const { t, language } = useI18n();
  const [locationString] = useLocation();
  
  // 🔧 FIXED: Better URL parsing
  const getQueryFromURL = () => {
    try {
      const queryIndex = locationString.indexOf('?');
      if (queryIndex === -1) return "";
      
      const queryString = locationString.substring(queryIndex + 1);
      const params = new URLSearchParams(queryString);
      return params.get('q')?.trim() || "";
    } catch {
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
  
  // 🔧 FIXED: Add debug logging
  useEffect(() => {
    console.log("🔍 Search query from URL:", query);
    console.log("🔍 Full URL:", locationString);
  }, [query, locationString]);
  
  const { data: businesses, isLoading } = useBusinesses({ 
    search: query, // ✅ Now this should work
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

  // 🔧 FIXED: Show message when no search query
  const hasSearchQuery = query.length > 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title={t("search.results")} backHref="/" />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <SearchBar initialValue={query} />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1"
            data-testid="button-toggle-filters"
          >
            <Filter className="w-4 h-4" />
            {language === "ar" ? "الفلاتر" : "Filters"}
            {hasFilters && (
              <span className="w-5 h-5 rounded-full bg-primary-foreground text-primary text-xs flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </Button>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1 text-muted-foreground"
              data-testid="button-clear-filters"
            >
              <X className="w-4 h-4" />
              {language === "ar" ? "مسح" : "Clear"}
            </Button>
          )}
        </div>

        {/* 🔧 FIXED: Show message when no search term */}
        {!hasSearchQuery && !hasFilters && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="text-blue-700 dark:text-blue-300 text-center">
              {language === "ar" 
                ? "🔍 اكتب في المربع أعلاه للبحث عن محلات معينة، أو استخدم الفلاتر للتصفية."
                : "🔍 Type in the search box above to find specific businesses, or use filters to narrow results."}
            </p>
          </div>
        )}

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Navigation className="w-4 h-4 text-primary" />
                    {language === "ar" ? "الترتيب حسب الموقع" : "Sort by Location"}
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {latitude && longitude ? (
                      <button
                        onClick={() => setSortByDistance(!sortByDistance)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          sortByDistance
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                        data-testid="filter-sort-distance"
                      >
                        {language === "ar" ? "الأقرب أولاً" : "Nearest First"}
                      </button>
                    ) : permissionDenied ? (
                      <span className="text-xs text-muted-foreground">
                        {language === "ar" ? "تم رفض الوصول للموقع" : "Location access denied"}
                      </span>
                    ) : geoLoading ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {language === "ar" ? "جاري تحديد الموقع..." : "Getting location..."}
                      </span>
                    ) : (
                      <button
                        onClick={requestLocation}
                        className="px-3 py-1.5 rounded-full text-sm bg-muted text-muted-foreground hover:bg-muted/80"
                        data-testid="button-enable-location"
                      >
                        {language === "ar" ? "تفعيل الموقع" : "Enable Location"}
                      </button>
                    )}
                  </div>
                </div>

                {cities && cities.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-primary" />
                      {t("city.selectCity")}
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        onClick={() => setSelectedCity(undefined)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          selectedCity === undefined
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                        data-testid="filter-city-all"
                      >
                        {t("city.allCities")}
                      </button>
                      {cities.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => setSelectedCity(city.id)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            selectedCity === city.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
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
                  <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Star className="w-4 h-4 text-primary" />
                    {t("search.minRating")}
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ratingOptions.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => setMinRating(option.value)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          minRating === option.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                        data-testid={`filter-rating-${option.value ?? 'all'}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-primary" />
                    {language === "ar" ? "خيارات إضافية" : "Additional Options"}
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      onClick={() => setOpenNowOnly(!openNowOnly)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1 ${
                        openNowOnly
                          ? "bg-green-500 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      data-testid="filter-open-now"
                    >
                      <Clock className="w-3 h-3" />
                      {language === "ar" ? "مفتوح الآن" : "Open Now"}
                    </button>
                    <button
                      onClick={() => setSortByRating(!sortByRating)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1 ${
                        sortByRating
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
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
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredBusinesses && filteredBusinesses.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">
              {language === "ar" 
                ? `${hasSearchQuery ? `نتائج البحث عن "${query}"` : "جميع المحلات"} (${filteredBusinesses.length} نتيجة)`
                : `${hasSearchQuery ? `Results for "${query}"` : "All businesses"} (${filteredBusinesses.length} result${filteredBusinesses.length > 1 ? 's' : ''})`
              }
            </h2>
            {filteredBusinesses.map((business, idx) => (
              <BusinessCard key={business.id} business={business} layout="list" index={idx} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-20 text-center text-muted-foreground">
            <SearchX className="w-16 h-16 mb-4 opacity-20" />
            <h3 className="text-lg font-bold mb-2">{t("search.noResults")}</h3>
            <p>
              {language === "ar" 
                ? hasSearchQuery 
                  ? `لم نتمكن من العثور على نتائج لـ "${query}"`
                  : "لم نتمكن من العثور على أي محلات."
                : hasSearchQuery
                  ? `We couldn't find any results for "${query}"`
                  : "We couldn't find any businesses."
              }
            </p>
            <p className="text-sm mt-1 mb-4">
              {language === "ar" 
                ? "جرب كلمات مفتاحية أخرى أو قم بتغيير الفلاتر."
                : "Try different keywords or change the filters."
              }
            </p>
            
            {categories && categories.length > 0 && (
              <div className="mt-6 w-full max-w-md">
                <p className="text-sm font-medium mb-3">
                  {language === "ar" ? "تصفح الأقسام:" : "Browse categories:"}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {categories.slice(0, 6).map((cat) => (
                    <Link 
                      key={cat.id}
                      href={`/categories/${cat.id}`}
                      className="px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
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
