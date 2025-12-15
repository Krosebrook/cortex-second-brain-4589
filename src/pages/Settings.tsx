import React from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageWrapper } from '@/components/layout/PageWrapper';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';

const Settings = () => {
  const showContent = useAnimateIn(false, 300);
  
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
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
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
                    id="notifications"
                    label="Notifications"
                    description="Receive notifications about updates and activity"
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
            
            <TabsContent value="appearance">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-foreground">Appearance</CardTitle>
                  <CardDescription>
                    Customize how your second brain looks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                    id="compact-view"
                    label="Compact View"
                    description="Display more content with less spacing"
                  />
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

export default Settings;
