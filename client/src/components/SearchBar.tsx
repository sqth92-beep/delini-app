import { Search } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useNavigate } from "wouter"; // ✅ استخدام الـ router الحقيقي

export function SearchBar({ initialValue = "" }: { initialValue?: string }) {
  const { t } = useI18n();
  const [value, setValue] = useState(initialValue);
  const navigate = useNavigate(); // ✅ هذا يعمل في APK

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = value.trim();
    
    if (query) {
      // ✅ طريقة موثوقة تعمل في APK وWeb
      const searchUrl = `/search?q=${encodeURIComponent(query)}`;
      
      // الطريقة الأساسية
      navigate(searchUrl);
      
      // تأكيد للـ WebView في Capacitor
      if (typeof window !== 'undefined' && window.history) {
        try {
          window.history.pushState({}, '', searchUrl);
          window.dispatchEvent(new PopStateEvent('popstate'));
        } catch (err) {
          console.log("History API not available in this environment");
        }
      }
    } else {
      navigate('/search');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full group">
      <div className="
        relative flex items-center w-full h-14 rounded-2xl
        bg-card shadow-lg border border-border/50
        focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10
        transition-all duration-300
      ">
        <div className="grid place-items-center h-full w-14 text-muted-foreground group-focus-within:text-primary transition-colors">
          <Search className="w-6 h-6" />
        </div>
        <input
          className="peer h-full w-full outline-none text-base text-foreground placeholder:text-muted-foreground bg-transparent ml-4 font-medium"
          type="text"
          id="search"
          placeholder={t("search.placeholder")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          data-testid="input-search"
        />
        <button 
          type="submit"
          className="
            absolute left-2 bg-primary text-white p-2.5 rounded-xl
            hover:bg-primary/90 hover:scale-105 active:scale-95
            transition-all duration-200
            shadow-lg shadow-primary/20
          "
          data-testid="button-search"
        >
          {t("search.button")}
        </button>
      </div>
      
      {/* مساعدة للمستخدم */}
      {value.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 px-2">
          <div className="text-xs text-muted-foreground bg-popover/80 backdrop-blur-sm rounded-lg p-2 border">
            {t("search.pressEnter") || "Press Enter to search"}
          </div>
        </div>
      )}
    </form>
  );
}
