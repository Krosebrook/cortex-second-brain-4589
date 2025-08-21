import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, AlertTriangle, CheckCircle, Settings } from 'lucide-react';

export const TessaGuardrails = () => {
  const guardrails = [
    {
      title: "Automated Checkpoints & Backups",
      description: "At every key milestone, the MCP triggers verified backups to designated storage. Workflows are paused until a human administrator confirms the backup and review.",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Automated System Administrator Reminders",
      description: "The MCP sends consolidated reminders to the administrator, including a summary of completed milestones and next steps, to streamline human oversight.",
      icon: Settings,
      color: "text-blue-600"
    },
    {
      title: "Hallucination Detection",
      description: "Operates as a critical cross-verification layer on all AI outputs. Content is cross-referenced against its original context and verified sources.",
      icon: AlertTriangle,
      color: "text-orange-600"
    },
    {
      title: "Robust Security & Privacy",
      description: "All data is encrypted at rest and in transit. Access control is implemented at every layer, enforcing granular, role-based access to ensure a privacy-first, secure-by-design posture.",
      icon: Lock,
      color: "text-purple-600"
    },
    {
      title: "Ethical Review & Operational Routing",
      description: "The Ethical Reflex Layer and Operational Protocol Routing actively monitor for risky patterns, routing alerts to human experts for critical decision-making.",
      icon: Shield,
      color: "text-red-600"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold text-foreground">System-Wide & Operational Guardrails</h1>
        <p className="text-lg text-muted-foreground">
          These are the non-negotiable security and governance pillars of the Tessa AI system, 
          ensuring responsible and reliable operation.
        </p>
      </div>

      <div className="space-y-6">
        {guardrails.map((item, index) => (
          <Card key={index} className="border-2 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
        <h3 className="text-xl font-bold text-foreground mb-3 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-orange-600" />
          Non-Negotiable Investment
        </h3>
        <p className="text-muted-foreground">
          These guardrails represent a non-negotiable investment against reputational damage and legal liabilities. 
          The Ethical Reflex Layer and comprehensive security measures ensure that Tessa AI operates within 
          ethical boundaries while maintaining the highest standards of data protection and operational integrity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200">Proactive Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 dark:text-green-300 text-sm">
              Continuous monitoring of system behavior, user interactions, and output quality 
              ensures early detection of potential issues before they escalate.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200">Human-in-the-Loop</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Critical decisions and edge cases are automatically routed to human experts, 
              ensuring responsible AI deployment with appropriate oversight.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};