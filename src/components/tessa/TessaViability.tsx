import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Users, Zap, Shield, Code } from 'lucide-react';

export const TessaViability = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 400;
    canvas.height = 400;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 140;
    
    const labels = ['Scalability', 'Ethical Alignment', 'Innovation', 'Cost-Effectiveness', 'Market Fit', 'Implementation'];
    const scores = [90, 95, 90, 75, 85, 70];
    const maxScore = 100;

    // Draw background circles
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 5) * i, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    const angleStep = (2 * Math.PI) / labels.length;
    
    for (let i = 0; i < labels.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Draw data polygon
    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.strokeStyle = 'rgb(99, 102, 241)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    for (let i = 0; i < scores.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const score = scores[i];
      const distance = (score / maxScore) * radius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw data points
    ctx.fillStyle = 'rgb(99, 102, 241)';
    for (let i = 0; i < scores.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const score = scores[i];
      const distance = (score / maxScore) * radius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw labels
    ctx.fillStyle = '#334155';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < labels.length; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const labelDistance = radius + 20;
      const x = centerX + Math.cos(angle) * labelDistance;
      const y = centerY + Math.sin(angle) * labelDistance;
      
      ctx.fillText(labels[i], x, y + 4);
    }

  }, []);

  const viabilityMetrics = [
    {
      label: "Scalability",
      score: 90,
      icon: TrendingUp,
      description: "Modular architecture supports horizontal scaling",
      color: "text-green-600"
    },
    {
      label: "Ethical Alignment", 
      score: 95,
      icon: Shield,
      description: "Built-in ethical guardrails and human oversight",
      color: "text-blue-600"
    },
    {
      label: "Innovation",
      score: 90,
      icon: Zap,
      description: "25+ breakthrough components push AI boundaries",
      color: "text-yellow-600"
    },
    {
      label: "Cost-Effectiveness",
      score: 75,
      icon: DollarSign,
      description: "Adaptive model selection optimizes resource usage",
      color: "text-purple-600"
    },
    {
      label: "Market Fit",
      score: 85,
      icon: Users,
      description: "Addresses personalization and automation needs",
      color: "text-orange-600"
    },
    {
      label: "Implementation",
      score: 70,
      icon: Code,
      description: "Complex but manageable with phased approach",
      color: "text-red-600"
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    if (score >= 80) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    if (score >= 70) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold text-foreground">Project Viability Analysis</h1>
        <p className="text-lg text-muted-foreground">
          A visual analysis of the Tessa AI project's strengths and considerations, based on the 
          architectural blueprint. This chart synthesizes the project's potential for real-world success.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Viability Radar Chart</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <canvas 
              ref={canvasRef} 
              className="max-w-full h-auto"
              style={{ maxHeight: '400px' }}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-foreground">Detailed Metrics</h3>
          {viabilityMetrics.map((metric, index) => (
            <Card key={index} className="hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                    <span className="font-semibold text-foreground">{metric.label}</span>
                  </div>
                  <Badge className={getScoreColor(metric.score)}>
                    {metric.score}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200">Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-green-700 dark:text-green-300 text-sm">
              <li>• Comprehensive ethical framework</li>
              <li>• Modular, scalable architecture</li>
              <li>• Cutting-edge innovation stack</li>
              <li>• Strong personalization capabilities</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-200">Considerations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-orange-700 dark:text-orange-300 text-sm">
              <li>• High implementation complexity</li>
              <li>• Significant resource requirements</li>
              <li>• Need for specialized expertise</li>
              <li>• Extended development timeline</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};