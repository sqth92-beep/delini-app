import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { PreviewShell } from "@/components/PreviewShell";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import CategoryList from "@/pages/CategoryList";
import CategoryDetail from "@/pages/CategoryDetail";
import BusinessDetail from "@/pages/BusinessDetail";
import SearchResults from "@/pages/SearchResults";
import MapView from "@/pages/MapView";
import Offers from "@/pages/Offers";
import Favorites from "@/pages/Favorites";
import Compare from "@/pages/Compare";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import { NotificationPrompt } from "@/components/NotificationPrompt";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/categories" component={CategoryList} />
      <Route path="/categories/:id" component={CategoryDetail} />
      <Route path="/businesses/:id" component={BusinessDetail} />
      <Route path="/search" component={SearchResults} />
      <Route path="/map" component={MapView} />
      <Route path="/offers" component={Offers} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/compare" component={Compare} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/preview" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    const initOneSignal = () => {
      // الوصول للمكتبة
      const OneSignal = (window as any).plugins?.OneSignal || (window as any).OneSignal;
      
      if (OneSignal) {
        try {
          // الطريقة الصحيحة والحديثة للتعريف (Initialize)
          // ملاحظة: d4d5d6d7 هو معرف تطبيقك الصحيح
          OneSignal.initialize("d4d5d6d7-eece-42c5-b891-94560d5ad7e3");
          
          console.log("OneSignal Initialized for DeLiNi");

        } catch (e) {
          console.error("OneSignal Error:", e);
        }
      }
    };

    // التشغيل عند جاهزية الجهاز
    if ((window as any).cordova) {
        document.addEventListener("deviceready", initOneSignal, false);
    } else {
        // للمتصفح العادي (إختياري)
        initOneSignal();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <NotificationPrompt />
          <Router />
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
