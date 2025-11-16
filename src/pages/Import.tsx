
import React from 'react';
import ImportPanel from '@/components/ImportPanel';
import { KnowledgeList } from '@/components/knowledge/KnowledgeList';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Import = () => {
  const showContent = useAnimateIn(false, 300);
  
  return (
    <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
      <AnimatedTransition show={showContent} animation="slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground mt-2">
            Manage your knowledge and import data from various sources
          </p>
        </div>
        
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="browse">Browse Knowledge</TabsTrigger>
            <TabsTrigger value="import">Import Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="browse" className="mt-6">
            <KnowledgeList />
          </TabsContent>
          
          <TabsContent value="import" className="mt-6">
            <ImportPanel />
          </TabsContent>
        </Tabs>
      </AnimatedTransition>
    </div>
  );
};

export default Import;
