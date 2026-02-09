import { Search } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useLocation } from "wouter";

export function SearchBar({ initialValue = "", onSearch }: { 
  initialValue?: string;
  onSearch?: (query: string) => void;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState(initialValue);
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = value.trim();
    
    if (query) {
      if (onSearch) {
        onSearch(query);
      } else {
        setLocation(`/search?q=${encodeURIComponent(query)}`);
      }
    } else {
      if (onSearch) {
        onSearch('');
      } else {
        setLocation('/search');
      }
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
    </form>
  );
}
