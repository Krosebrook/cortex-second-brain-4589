import { PageWrapper } from '@/components/layout/PageWrapper';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StoresManager, SyncDashboard } from '@/components/stores';
import { Store, BarChart3 } from 'lucide-react';

const StoresPage = () => {
  return (
    <PageWrapper>
      <Container size="xl">
        <PageHeader
          title="Store Connections"
          description="Manage your e-commerce platform integrations and view synced data"
        />
        <Tabs defaultValue="stores" className="space-y-6">
          <TabsList>
            <TabsTrigger value="stores" className="gap-2">
              <Store className="h-4 w-4" />
              Stores
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
          </TabsList>
          <TabsContent value="stores">
            <StoresManager />
          </TabsContent>
          <TabsContent value="dashboard">
            <SyncDashboard />
          </TabsContent>
        </Tabs>
      </Container>
    </PageWrapper>
  );
};

export default StoresPage;
