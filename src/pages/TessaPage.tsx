import { useState } from 'react';
import { TessaOverview } from '@/components/tessa/TessaOverview';
import { TessaComponents } from '@/components/tessa/TessaComponents';
import { TessaArchitecture } from '@/components/tessa/TessaArchitecture';
import { TessaGuardrails } from '@/components/tessa/TessaGuardrails';
import { TessaViability } from '@/components/tessa/TessaViability';
import { TessaImplementation } from '@/components/tessa/TessaImplementation';
import { TessaSidebar } from '@/components/tessa/TessaSidebar';

const TessaPage = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <TessaOverview />;
      case 'components':
        return <TessaComponents />;
      case 'architecture':
        return <TessaArchitecture />;
      case 'guardrails':
        return <TessaGuardrails />;
      case 'viability':
        return <TessaViability />;
      case 'implementation':
        return <TessaImplementation />;
      default:
        return <TessaOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-background">
      <div className="flex h-screen">
        <TessaSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TessaPage;