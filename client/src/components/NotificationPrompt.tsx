import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // إظهار التنبيه بعد 3 ثوانٍ إذا لم يسبق للمستخدم الموافقة
    const timer = setTimeout(() => {
      const alreadyAsked = localStorage.getItem('delini_notified_v1');
      if (!alreadyAsked) {
        setShowPrompt(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    setIsLoading(true);
    
    // طلب الإذن من نظام الأندرويد عبر ون سيجنال
    const OS = (window as any).plugins?.OneSignal || (window as any).OneSignal;
    
    if (OS) {
      OS.promptForPushNotificationsWithUserResponse((accepted: boolean) => {
        console.log("User accepted notifications: ", accepted);
        localStorage.setItem('delini_notified_v1', 'true');
        setShowPrompt(false);
        setIsLoading(false);
      });
    } else {
      // إذا كان يعمل على متصفح عادي
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          localStorage.setItem('delini_notified_v1', 'true');
        }
      }
      setShowPrompt(false);
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('delini_notified_v1', 'true');
    setShowPrompt(false);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
        >
          <Card className="border-amber-500/30 bg-gradient-to-br from-zinc-900 to-zinc-800 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                  <Bell className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-white">تفعيل الإشعارات</h4>
                  <p className="text-sm text-zinc-400">
                    فعّل الإشعارات لتصلك أحدث العروض والمحلات الجديدة في DeLiNi
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={handleAllow}
                      disabled={isLoading}
                      className="bg-amber-500 hover:bg-amber-600 text-black"
                    >
                      {isLoading ? 'جاري التفعيل...' : 'تفعيل'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDismiss}
                      className="text-zinc-400 hover:text-white"
                    >
                      لاحقاً
                    </Button>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-6 w-6 shrink-0 text-zinc-500 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
