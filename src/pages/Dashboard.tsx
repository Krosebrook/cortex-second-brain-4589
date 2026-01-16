import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useFeatureTour } from '@/hooks/useFeatureTour';
import { Spotlight } from '@/components/onboarding/Spotlight';
import { 
  Brain, 
  Search, 
  Upload, 
  TrendingUp, 
  FileText, 
  Clock, 
  Star,
  Target,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const quickActions = [
  { title: 'Import Content', description: 'Add new knowledge to your brain', icon: Upload, to: '/import', color: 'bg-primary' },
  { title: 'Chat with Tessa', description: 'Your personal AI agent', icon: Search, to: '/search', color: 'bg-accent' },
  { title: 'Manage Cortex', description: 'Organize your knowledge', icon: Brain, to: '/manage', color: 'bg-secondary' },
  { title: 'View Profile', description: 'Update your information', icon: Target, to: '/profile', color: 'bg-muted' },
];

const Dashboard = () => {
  const showContent = useAnimateIn(false, 300);
  const { stats, recentActivity, goals, topTopics, isLoading } = useDashboardData();
  
  // Feature tour
  const tour = useFeatureTour({ tourId: 'dashboard', autoStart: true });

  const statItems = [
    { label: 'Total Items', value: stats.totalItems.toLocaleString(), change: stats.totalItemsChange, icon: Brain },
    { label: 'Searches Today', value: stats.searchesToday.toString(), change: stats.searchesChange, icon: Search },
    { label: 'Items Added', value: stats.itemsThisMonth.toString(), change: stats.itemsChange, icon: Upload },
    { label: 'Knowledge Score', value: `${stats.knowledgeScore}%`, change: stats.scoreChange, icon: TrendingUp },
  ];
  
  return (
    <PageWrapper>
      <AnimatedTransition show={showContent} animation="slide-up">
        <PageHeader
          title="Welcome Back"
          description="Tessa is ready to help you explore your knowledge base with advanced AI capabilities."
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-tour="stats">
          {isLoading ? (
            [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)
          ) : (
            statItems.map((stat, index) => (
              <Card key={index} className={cn("border-border/50 shadow-sm")}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-primary">{stat.change}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card className="border-border/50" data-tour="quick-actions">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Target className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Jump into your most common tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <Link key={index} to={action.to}>
                      <Card className={cn(
                        "transition-all duration-200 border-border/50",
                        "hover:shadow-md hover:border-primary/20"
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={cn("p-2 rounded-lg text-primary-foreground", action.color)}>
                              <action.icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-sm text-foreground">{action.title}</h3>
                              <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Goals Section */}
            <Card className="mt-6 border-border/50" data-tour="goals">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Star className="h-5 w-5 text-primary" />
                  Monthly Goals
                </CardTitle>
                <CardDescription>
                  Track your progress toward knowledge goals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  [1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)
                ) : (
                  goals.map((goal, index) => (
                    <div key={goal.id || index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{goal.title}</span>
                        <span className="text-muted-foreground">{goal.current_value}/{goal.target_value}</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card className="border-border/50" data-tour="activity">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest interactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12" />)
                ) : recentActivity.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No recent activity</p>
                ) : (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0">
                      <div className="p-1.5 rounded-full bg-primary/10 mt-0.5">
                        {activity.type === 'search' && <Search className="h-3 w-3 text-primary" />}
                        {activity.type === 'import' && <Upload className="h-3 w-3 text-primary" />}
                        {activity.type === 'cortex' && <Brain className="h-3 w-3 text-primary" />}
                        {activity.type === 'chat' && <Search className="h-3 w-3 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{activity.content}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))
                )}
                <Button variant="outline" size="sm" className="w-full mt-4">
                  View All Activity
                </Button>
              </CardContent>
            </Card>

            {/* Knowledge Insights */}
            <Card className="mt-6 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
                  Knowledge Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg">
                  <Brain className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground mb-1">Tessa is learning!</p>
                  <p className="text-xs text-muted-foreground">
                    Your AI agent has processed {stats.itemsThisMonth} new items this month, enhancing her reasoning capabilities.
                  </p>
                </div>
                
                <div className="text-xs text-center text-muted-foreground">
                  Your most searched topics: {topTopics.join(', ')}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AnimatedTransition>

      {/* Feature Tour Spotlight */}
      <Spotlight
        isActive={tour.isActive}
        step={tour.currentStep}
        targetElement={tour.targetElement}
        currentStepIndex={tour.currentStepIndex}
        totalSteps={tour.totalSteps}
        progress={tour.progress}
        onNext={tour.next}
        onPrevious={tour.previous}
        onSkip={tour.skip}
        isFirstStep={tour.isFirstStep}
        isLastStep={tour.isLastStep}
      />
    </PageWrapper>
  );
};

export default Dashboard;
