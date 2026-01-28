function App() {
  useEffect(() => {
    const initOneSignal = () => {
      const OneSignal = (window as any).plugins?.OneSignal || (window as any).OneSignal;
      
      if (OneSignal) {
        try {
          // 1. التعريف الأساسي
          OneSignal.initialize("d4d5d6d7-eece-42c5-b891-94560d5ad7e3");

          // 2. سطر إضافي لضمان مزامنة الحالة فوراً مع السيرفر
          OneSignal.Notifications.addEventListener("permissionChange", (permission: any) => {
            console.log("DeLiNi Permission Changed:", permission);
          });

          console.log("OneSignal Initialized for DeLiNi");
        } catch (e) {
          console.error("OneSignal Error:", e);
        }
      }
    };

    // التشغيل المباشر لضمان عدم التأخير
    if (document.readyState === "complete" || document.readyState === "interactive") {
        initOneSignal();
    } else {
        document.addEventListener("deviceready", initOneSignal, false);
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
