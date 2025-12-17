import { PageWrapper } from '@/components/layout/PageWrapper';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StoresManager, SyncDashboard, SyncedProductsTable } from '@/components/stores';
import { Store, BarChart3, Package } from 'lucide-react';

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
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
          </TabsList>
          <TabsContent value="stores">
            <StoresManager />
          </TabsContent>
          <TabsContent value="products">
            <SyncedProductsTable />
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
