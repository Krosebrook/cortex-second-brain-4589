import React from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PageWrapper } from '@/components/layout/PageWrapper';
import { PageHeader } from '@/components/ui/page-header';
import { Bell, RotateCcw, CheckCircle, MessageSquare, Shield, AlertTriangle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { CacheManagement } from '@/components/settings/CacheManagement';

interface NotificationPreferences {
  enabled: boolean;
  chat: boolean;
  knowledge: boolean;
  security: boolean;
  system: boolean;
  emailDigest: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  chat: true,
  knowledge: true,
  security: true,
  system: true,
  emailDigest: false,
};

const Settings = () => {
  const showContent = useAnimateIn(false, 300);
  const [notificationPrefs, setNotificationPrefs] = useLocalStorage<NotificationPreferences>(
    'notification-preferences',
    DEFAULT_PREFERENCES
  );
  const [completedTours, setCompletedTours] = useLocalStorage<string[]>('completed-tours', []);

  const handleNotificationChange = (key: keyof NotificationPreferences, value: boolean) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: value }));
    toast.success('Notification preferences updated');
  };

  const handleRestartTour = (tourId: string, tourName: string) => {
    setCompletedTours(prev => prev.filter(id => id !== tourId));
    toast.success(`${tourName} tour has been reset. Visit the page to start the tour.`);
  };

  const handleRestartAllTours = () => {
    setCompletedTours([]);
    toast.success('All feature tours have been reset');
  };

  const tourList = [
    { id: 'dashboard', name: 'Dashboard Tour', description: 'Learn about your knowledge stats and quick actions' },
    { id: 'import', name: 'Import Tour', description: 'Discover how to import content into your second brain' },
    { id: 'search', name: 'Chat Tour', description: 'Learn how to chat with Tessa AI assistant' },
  ];
  
  return (
    <PageWrapper containerSize="lg">
      <AnimatedTransition show={showContent} animation="slide-up">
        <PageHeader
          title="Settings"
          description="Customize your digital second brain"
          className="text-center"
        />
        
        <div className="max-w-3xl mx-auto">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
              <TabsTrigger value="tours">Tours</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-foreground">General Settings</CardTitle>
                  <CardDescription>
                    Manage your account settings and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <SettingItem
                    id="auto-save"
                    label="Auto-save"
                    description="Automatically save changes as you work"
                    defaultChecked
                  />
                  <SettingItem
                    id="dark-mode"
                    label="Dark Mode"
                    description="Toggle between light and dark themes"
                    defaultChecked
                  />
                  <SettingItem
                    id="animations"
                    label="Animations"
                    description="Enable smooth transitions and animations"
                    defaultChecked
                  />
                  <SettingItem
                    id="ai-suggestions"
                    label="AI Suggestions"
                    description="Allow AI to provide content suggestions"
                    defaultChecked
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Bell size={20} />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Control what notifications you receive and how
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div>
                      <Label htmlFor="notifications-master" className="text-base text-foreground font-medium">
                        Enable Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Master toggle for all notifications
                      </p>
                    </div>
                    <Switch 
                      id="notifications-master" 
                      checked={notificationPrefs.enabled}
                      onCheckedChange={(checked) => handleNotificationChange('enabled', checked)}
                    />
                  </div>

                  <div className={notificationPrefs.enabled ? '' : 'opacity-50 pointer-events-none'}>
                    <h4 className="text-sm font-medium text-foreground mb-4">Notification Categories</h4>
                    <div className="space-y-4">
                      <NotificationCategory
                        id="chat-notifications"
                        icon={<MessageSquare size={18} className="text-primary" />}
                        label="Chat & AI Responses"
                        description="Get notified when Tessa responds to your messages"
                        checked={notificationPrefs.chat}
                        onCheckedChange={(checked) => handleNotificationChange('chat', checked)}
                      />
                      <NotificationCategory
                        id="knowledge-notifications"
                        icon={<Sparkles size={18} className="text-accent" />}
                        label="Knowledge Updates"
                        description="Notifications about imported items and auto-tagging"
                        checked={notificationPrefs.knowledge}
                        onCheckedChange={(checked) => handleNotificationChange('knowledge', checked)}
                      />
                      <NotificationCategory
                        id="security-notifications"
                        icon={<Shield size={18} className="text-destructive" />}
                        label="Security Alerts"
                        description="Important security notifications and login alerts"
                        checked={notificationPrefs.security}
                        onCheckedChange={(checked) => handleNotificationChange('security', checked)}
                      />
                      <NotificationCategory
                        id="system-notifications"
                        icon={<AlertTriangle size={18} className="text-warning" />}
                        label="System Updates"
                        description="Platform updates, maintenance, and announcements"
                        checked={notificationPrefs.system}
                        onCheckedChange={(checked) => handleNotificationChange('system', checked)}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-medium text-foreground mb-4">Email Notifications</h4>
                    <NotificationCategory
                      id="email-digest"
                      icon={<Bell size={18} className="text-muted-foreground" />}
                      label="Weekly Email Digest"
                      description="Receive a weekly summary of your activity and insights"
                      checked={notificationPrefs.emailDigest}
                      onCheckedChange={(checked) => handleNotificationChange('emailDigest', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="storage">
              <CacheManagement />
            </TabsContent>

            <TabsContent value="tours">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <RotateCcw size={20} />
                    Feature Tours
                  </CardTitle>
                  <CardDescription>
                    Restart interactive tutorials to learn platform features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {completedTours.length} of {tourList.length} tours completed
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRestartAllTours}
                      disabled={completedTours.length === 0}
                    >
                      <RotateCcw size={16} className="mr-2" />
                      Restart All Tours
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {tourList.map((tour) => {
                      const isCompleted = completedTours.includes(tour.id);
                      return (
                        <div 
                          key={tour.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            {isCompleted ? (
                              <CheckCircle size={20} className="text-green-500" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium text-foreground">{tour.name}</p>
                              <p className="text-sm text-muted-foreground">{tour.description}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestartTour(tour.id, tour.name)}
                            disabled={!isCompleted}
                          >
                            <RotateCcw size={16} className="mr-2" />
                            Restart
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="integrations">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-foreground">Integrations</CardTitle>
                  <CardDescription>
                    Connect your second brain with external services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <SettingItem
                    id="google-drive"
                    label="Google Drive"
                    description="Import and sync files from Google Drive"
                  />
                  <SettingItem
                    id="notion"
                    label="Notion"
                    description="Sync with your Notion workspaces"
                  />
                  <SettingItem
                    id="github"
                    label="GitHub"
                    description="Connect to your GitHub repositories"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AnimatedTransition>
    </PageWrapper>
  );
};

interface SettingItemProps {
  id: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
}

const SettingItem = ({ id, label, description, defaultChecked }: SettingItemProps) => (
  <div className="flex items-center justify-between">
    <div>
      <Label htmlFor={id} className="text-base text-foreground">{label}</Label>
      <p className="text-sm text-muted-foreground">
        {description}
      </p>
    </div>
    <Switch id={id} defaultChecked={defaultChecked} />
  </div>
);

interface NotificationCategoryProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const NotificationCategory = ({ id, icon, label, description, checked, onCheckedChange }: NotificationCategoryProps) => (
  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <Label htmlFor={id} className="text-sm font-medium text-foreground">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

export default Settings;
