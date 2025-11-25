import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { motion, AnimatePresence } from 'framer-motion';

export function PWAInstallBanner() {
  const { isInstallable, installApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isInstallable || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md"
      >
        <Card className="p-4 shadow-lg border-2 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Install AETHER V5</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Add to your home screen for quick access and offline support
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={installApp} className="flex-1">
                  Install App
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsDismissed(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
