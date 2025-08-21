import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, Brain, Database, Zap } from 'lucide-react';

export const TessaArchitecture = () => {
  const agents = [
    { name: "Alpha", description: "Handles motivation, guidance, and accountability.", color: "bg-rose-100 border-rose-300 dark:bg-rose-900 dark:border-rose-700" },
    { name: "Beta", description: "Generates insights and synthesizes data for awareness.", color: "bg-amber-100 border-amber-300 dark:bg-amber-900 dark:border-amber-700" },
    { name: "Gamma", description: "Analyzes patterns and generates content.", color: "bg-lime-100 border-lime-300 dark:bg-lime-900 dark:border-lime-700" },
    { name: "Delta", description: "Creates communications and documentation.", color: "bg-emerald-100 border-emerald-300 dark:bg-emerald-900 dark:border-emerald-700" },
    { name: "Epsilon", description: "Manages community interactions and moderation.", color: "bg-cyan-100 border-cyan-300 dark:bg-cyan-900 dark:border-cyan-700" },
    { name: "Protocol Review", description: "Routes issues requiring specific protocols or human oversight.", color: "bg-slate-200 border-slate-400 dark:bg-slate-700 dark:border-slate-500" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold text-foreground">System Architecture</h1>
        <p className="text-lg text-muted-foreground">
          This diagram illustrates the central nervous system of Tessa AI, showing how the core MCP 
          interacts with a team of specialized agents and foundational systems.
        </p>
      </div>

      <Card className="p-8">
        <CardContent className="p-0">
          <div className="flex flex-col items-center space-y-8">
            {/* Top Layer - Foundational Systems */}
            <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl">
              <Card className="flex-1 bg-teal-50 border-teal-200 dark:bg-teal-950 dark:border-teal-800">
                <CardHeader className="text-center pb-2">
                  <div className="flex items-center justify-center mb-2">
                    <Database className="h-6 w-6 text-teal-600" />
                  </div>
                  <CardTitle className="text-lg text-teal-800 dark:text-teal-200">
                    Agent Recall System
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-teal-700 dark:text-teal-300">
                    Stores and retrieves user preferences, patterns, and states.
                  </p>
                </CardContent>
              </Card>

              <Card className="flex-1 bg-sky-50 border-sky-200 dark:bg-sky-950 dark:border-sky-800">
                <CardHeader className="text-center pb-2">
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="h-6 w-6 text-sky-600" />
                  </div>
                  <CardTitle className="text-lg text-sky-800 dark:text-sky-200">
                    Context Engine
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-sky-700 dark:text-sky-300">
                    Injects emotional, temporal, and user-specific context into prompts.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Connector */}
            <ArrowDown className="h-8 w-8 text-muted-foreground" />

            {/* Master Control Program */}
            <Card className="w-full max-w-md bg-primary/10 border-primary/20">
              <CardHeader className="text-center pb-2">
                <div className="flex items-center justify-center mb-2">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl text-primary font-extrabold">
                  MCP: Master Control Program
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  The central orchestrator for all tasks, logic, and agent delegation.
                </p>
              </CardContent>
            </Card>

            {/* Connector */}
            <ArrowDown className="h-8 w-8 text-muted-foreground" />

            {/* Separator */}
            <div className="w-full h-px bg-border"></div>

            {/* Agent Layer */}
            <div className="w-full">
              <h3 className="text-lg font-semibold text-center mb-6 text-foreground">
                Specialized Agent Squad
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {agents.map((agent, index) => (
                  <Card key={index} className={agent.color}>
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-base font-bold">
                        Agent {agent.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {agent.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg p-6">
        <h3 className="text-xl font-bold text-foreground mb-3">
          🏗️ System Flow
        </h3>
        <p className="text-muted-foreground">
          The architecture follows a hierarchical flow where the foundational systems (Agent Recall and Context Engine) 
          feed into the Master Control Program, which then orchestrates the specialized agent squad. Each agent has 
          distinct capabilities and can be dynamically selected based on the task requirements and user context.
        </p>
      </div>
    </div>
  );
};