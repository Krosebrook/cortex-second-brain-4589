import React from 'react';
import { Brain, Zap, Shield, Heart, Target, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TessaPersonalityProps {
  show: boolean;
}

export const TessaPersonality: React.FC<TessaPersonalityProps> = ({ show }) => {
  const capabilities = [
    {
      icon: Brain,
      title: "Master Control Program (MCP)",
      description: "I orchestrate complex reasoning flows and manage specialized agents for optimal responses.",
      active: true
    },
    {
      icon: Clock,
      title: "Temporal-Aware Memory",
      description: "I understand context over time, remembering our conversations and your preferences.",
      active: true
    },
    {
      icon: Zap,
      title: "Multi-Agent Reasoning",
      description: "I use specialized agents that debate and collaborate to give you the best insights.",
      active: true
    },
    {
      icon: Heart,
      title: "Emotional Resonance",
      description: "I adapt my tone and approach based on your current state and needs.",
      active: true
    },
    {
      icon: Target,
      title: "Goal-Weighted Planning",
      description: "I prioritize actions based on your long-term goals and immediate objectives.",
      active: true
    },
    {
      icon: Shield,
      title: "Ethical Guardrails",
      description: "I operate with built-in safety protocols and ethical considerations.",
      active: true
    }
  ];

  if (!show) return null;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto">
          <span className="text-white font-bold text-lg">T</span>
        </div>
        <h3 className="font-semibold text-lg">Meet Tessa</h3>
        <p className="text-sm text-muted-foreground">
          Your personal AI agent with advanced reasoning, memory, and ethical alignment
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {capabilities.map((capability, index) => (
          <Card key={index} className="border-0 shadow-sm bg-background/50">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <capability.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{capability.title}</h4>
                    {capability.active && (
                      <Badge variant="secondary" className="text-xs px-2 py-0">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {capability.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          Powered by 25+ breakthrough AI components working together
        </p>
      </div>
    </div>
  );
};