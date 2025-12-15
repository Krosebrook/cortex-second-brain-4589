import { PageWrapper } from '@/components/layout/PageWrapper';
import { Container } from '@/components/ui/container';
import { PageHeader } from '@/components/ui/page-header';
import { StoresManager } from '@/components/stores';

const StoresPage = () => {
  return (
    <PageWrapper>
      <Container size="xl">
        <PageHeader
          title="Store Connections"
          description="Manage your e-commerce platform integrations and API keys"
        />
        <StoresManager />
      </Container>
    </PageWrapper>
  );
};

export default StoresPage;
