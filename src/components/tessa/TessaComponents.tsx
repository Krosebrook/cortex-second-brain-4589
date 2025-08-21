import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TessaComponents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const components = [
    { id: 4, name: "Auto-Prompting Systems", category: "Automation", description: "Self-improving prompt engines that adapt on the fly to a given task.", impact: "Reduces manual prompt engineering, boosting efficiency and cutting operational overhead." },
    { id: 5, name: "Prompt Evolution Engine", category: "Learning", description: "Rewrites and optimizes prompts based on outcomes and feedback.", impact: "Enables continuous learning of AI responses without constant human intervention." },
    { id: 6, name: "Retrieval-Augmented Generation 2.0 (RAG 2.0)", category: "Data", description: "Combines search and generation using vector stores, fusing external data into responses.", impact: "Provides factual accuracy and depth, preventing hallucination." },
    { id: 7, name: "Neuro-Symbolic Reasoning", category: "Reasoning", description: "Blends fuzzy neural logic with hard logic rules.", impact: "Combines human-like intuition with logical consistency, crucial for accuracy." },
    { id: 8, name: "Multi-Agent Simulation", category: "Reasoning", description: "Agents debate, vote, and negotiate for better outputs.", impact: "Drives robust, well-reasoned decisions by allowing agents to 'think' collectively." },
    { id: 9, name: "Temporal-Aware Memory (Chrono-AI)", category: "Memory", description: "Understands when things happened and why that matters; uses time-weighted memory recall.", impact: "Delivers contextually relevant insights by understanding the recency and sequence of events." },
    { id: 10, name: "Agentic Planning", category: "Automation", description: "AI plans multi-step tasks, self-corrects as needed, and executes them autonomously.", impact: "Enables the AI to tackle complex problems by breaking them down into actionable steps." },
    { id: 11, name: "Ethical Reflex Layer", category: "Safety", description: "Flags risky tone and harmful content, and initiates safe operational protocols.", impact: "A non-negotiable investment that prevents direct harm and protects brand reputation." },
    { id: 12, name: "Emotional Resonance Modulation", category: "UX", description: "Adjusts tone, voice, and delivery to match a user's current state.", impact: "Fosters deeper engagement and empathy, making interactions feel genuinely supportive." },
    { id: 13, name: "Long-Form Reflective Alignment", category: "Memory", description: "Synthesizes weeks or months of input into coherent insights.", impact: "Provides longitudinal insight into user patterns and progress." },
    { id: 14, name: "Adaptive Personality Shaping", category: "UX", description: "Agents evolve their tone and voice to match the user's preferences and behavior over time.", impact: "Creates a highly personalized and comfortable user experience." },
    { id: 15, name: "Goal-Weighted Task Prioritization", category: "Automation", description: "Ranks AI actions based on long-term user-defined goals.", impact: "Ensures the AI consistently focuses on what matters most to the user." },
    { id: 16, name: "Narrative Reconstruction Engine", category: "Reasoning", description: "Turns user data into life stories, breakthroughs, and arcs.", impact: "Helps users process their experiences and see their journey with clarity." },
    { id: 17, name: "Conversational Memory Threads", category: "Memory", description: "Maintains multiple conversation threads and switches context seamlessly.", impact: "Allows users to fluidly navigate different topics without losing context." },
    { id: 18, name: "Meta-Task Monitoring", category: "Automation", description: "Tracks the success or failure rate of internal workflows.", impact: "Provides operational transparency and insights into system performance." },
    { id: 19, name: "Feedback Loop Integrators", category: "Learning", description: "Learns from human and system feedback in real time.", impact: "Ensures continuous improvement by directly incorporating lessons from real-world interactions." },
    { id: 20, name: "Modular Agent Switching", category: "Automation", description: "Swaps agents based on scenario or operational logic, even mid-task when needed.", impact: "Guarantees the right expertise for the right moment." },
    { id: 21, name: "Thought Chaining", category: "Reasoning", description: "Simulates internal dialogue or multi-perspective reasoning before generating a response.", impact: "Enables the AI to deliberate and explore multiple angles, leading to more nuanced outputs." },
    { id: 22, name: "Multi-Intent Detection", category: "Reasoning", description: "Parses layered or conflicting user needs in one input.", impact: "Accurately deciphers complex user requests, ensuring all aspects of a prompt are addressed." },
    { id: 23, name: "Operational Protocol Routing", category: "Safety", description: "Routes specific issues to designated system protocols or human review.", impact: "A critical system control that ensures appropriate action for situations requiring special handling." },
    { id: 24, name: "Voice Modality Adaptation", category: "UX", description: "Switches output style (humor, directive, affirming, etc.).", impact: "Provides dynamic communication flexibility, allowing the AI to adopt the most effective delivery style." },
    { id: 25, name: "Memory Timeline Visualizer", category: "UX", description: "Lets users explore their own memory graph or timeline, reconstructing their history.", impact: "Empowers users with self-insight by visually tracking their own journey and progress." },
    { id: 26, name: "Data Provenance Tracker", category: "Data", description: "Logs the origin and confidence of all outputs.", impact: "Provides auditable transparency and accountability for every piece of information generated." },
    { id: 27, name: "Self-Healing Workflow Engine", category: "Automation", description: "Corrects failures or bad outputs on its own.", impact: "Ensures system resilience and uptime, automatically resolving issues without constant human intervention." },
    { id: 28, name: "Adaptive Model Selection", category: "Automation", description: "Dynamically routes prompts to the best-suited model for a task.", impact: "Optimizes performance and cost-efficiency by intelligently choosing the right AI model." }
  ];

  const categories = [...new Set(components.map(c => c.category))];

  const filteredComponents = components.filter(c => {
    const matchesCategory = activeFilter === 'all' || c.category === activeFilter;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      'Automation': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'Learning': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'Data': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'Reasoning': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'Memory': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      'Safety': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'UX': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold text-foreground">Core Components</h1>
        <p className="text-lg text-muted-foreground">
          Explore the 25+ cutting-edge AI breakthroughs that power the Tessa AI system. 
          Use the filters and search to narrow down components.
        </p>
      </div>

      <div className="sticky top-0 bg-background/80 backdrop-blur-sm py-4 z-10 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={activeFilter === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredComponents.map(component => (
          <Card key={component.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2">{component.name}</CardTitle>
                <Badge className={cn("text-xs", getCategoryColor(component.category))}>
                  {component.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <CardDescription className="text-sm">
                {component.description}
              </CardDescription>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">Impact:</p>
                <p className="text-xs text-muted-foreground">{component.impact}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredComponents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No components found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};