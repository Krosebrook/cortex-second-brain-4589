import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Smartphone, Monitor, Share, MoreVertical, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  const renderInstructions = () => {
    if (platform === 'ios') {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground">Install on iOS</h3>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                1
              </div>
              <div>
                <p className="font-medium text-foreground">Tap the Share button</p>
                <p className="text-sm text-muted-foreground">Look for the <Share className="inline w-4 h-4 mx-1" /> icon at the bottom of Safari</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                2
              </div>
              <div>
                <p className="font-medium text-foreground">Select "Add to Home Screen"</p>
                <p className="text-sm text-muted-foreground">Scroll down in the menu and tap this option</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                3
              </div>
              <div>
                <p className="font-medium text-foreground">Confirm installation</p>
                <p className="text-sm text-muted-foreground">Tap "Add" to install Cortex on your home screen</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (platform === 'android') {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground">Install on Android</h3>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                1
              </div>
              <div>
                <p className="font-medium text-foreground">Tap the menu button</p>
                <p className="text-sm text-muted-foreground">Look for <MoreVertical className="inline w-4 h-4 mx-1" /> (three dots) in Chrome or your browser</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                2
              </div>
              <div>
                <p className="font-medium text-foreground">Select "Install app" or "Add to Home screen"</p>
                <p className="text-sm text-muted-foreground">The option may vary depending on your browser</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                3
              </div>
              <div>
                <p className="font-medium text-foreground">Confirm installation</p>
                <p className="text-sm text-muted-foreground">Tap "Install" to add Cortex to your home screen</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-foreground">Install on Desktop</h3>
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              1
            </div>
            <div>
              <p className="font-medium text-foreground">Click the install button below</p>
              <p className="text-sm text-muted-foreground">Or look for the install icon in your browser's address bar</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              2
            </div>
            <div>
              <p className="font-medium text-foreground">Confirm installation</p>
              <p className="text-sm text-muted-foreground">Click "Install" in the browser prompt</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              3
            </div>
            <div>
              <p className="font-medium text-foreground">Launch from desktop</p>
              <p className="text-sm text-muted-foreground">Cortex will be available as a desktop app</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Already Installed!</h1>
          <p className="text-muted-foreground">
            Cortex is already installed on your device. You can access it anytime from your home screen or app menu.
          </p>
          <Button onClick={() => navigate('/')} size="lg" className="w-full">
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Download className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Install Cortex
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get instant access to your second brain. Install Cortex as an app for a faster, native experience.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Monitor className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Native Experience</h3>
            <p className="text-sm text-muted-foreground">
              Works like a native app with a dedicated window
            </p>
          </Card>
          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Offline Access</h3>
            <p className="text-sm text-muted-foreground">
              Access your knowledge base even without internet
            </p>
          </Card>
          <Card className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Faster Loading</h3>
            <p className="text-sm text-muted-foreground">
              Optimized performance with instant startup
            </p>
          </Card>
        </div>

        {/* Install Button (Desktop/Android) */}
        {deferredPrompt && platform !== 'ios' && (
          <Card className="p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Ready to Install</h2>
            <p className="text-muted-foreground">
              Click the button below to install Cortex on your device
            </p>
            <Button onClick={handleInstallClick} size="lg" className="w-full max-w-md">
              <Download className="w-5 h-5 mr-2" />
              Install Cortex
            </Button>
          </Card>
        )}

        {/* Instructions */}
        <Card className="p-8">
          {renderInstructions()}
        </Card>

        {/* Back Button */}
        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
