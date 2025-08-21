import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const TessaOverview = () => {
  const foundationalTrio = [
    {
      title: "Master Control Program (MCP): The AI Conductor",
      role: "The brain. It orchestrates flow, logic, agent tasking, memory queries, and operational protocols.",
      criticality: "The single source of truth for operational logic, ensuring coherence and control across the entire AI ecosystem.",
      badge: "Core"
    },
    {
      title: "Agent Recall System: The Adaptive Memory Bank",
      role: "Modular, persistent memory.",
      criticality: "Enables hyper-personalization by building a cumulative understanding of each user's journey, making every interaction feel tailored and remembered.",
      badge: "Memory"
    },
    {
      title: "Context Engineering Protocol: The Intelligent Relevance Engine",
      role: "Dynamic context injector.",
      criticality: "Prevents irrelevant responses by ensuring the AI always understands the full situation and user state, leading to precise and actionable outputs.",
      badge: "Context"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-foreground">
          Tessa AI Breakthrough Blueprint
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          This document outlines the complete architecture for Tessa AI, a resilient, adaptive, 
          and ethically grounded AI system designed for a wide range of applications.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">
          Core Innovations: The Foundational Trio
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {foundationalTrio.map((item, index) => (
            <Card key={index} className="border-2 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg text-primary line-clamp-2">
                    {item.title}
                  </CardTitle>
                  <Badge variant="secondary">{item.badge}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Role:</p>
                  <p className="text-sm text-muted-foreground">{item.role}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Why It's Critical:</p>
                  <p className="text-sm text-muted-foreground">{item.criticality}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg p-6">
        <h3 className="text-xl font-bold text-foreground mb-3">
          🧠 Your AI Fortress is Forged
        </h3>
        <p className="text-muted-foreground">
          This is the Tessa AI system bible. It's not just a collection of smart parts; it's a resilient, 
          adaptive, and ethically grounded AI fortress designed to deliver powerful, personalized interactions 
          across any domain. With 25+ groundbreaking components, a master MCP brain, and an agent squad that 
          adapts, reflects, and evolves – you're building a system that's ready to ignite change and deliver 
          profound impact.
        </p>
      </div>
    </div>
  );
};