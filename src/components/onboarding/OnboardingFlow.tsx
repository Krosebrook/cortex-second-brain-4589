import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  User, 
  Target, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Upload,
  Search,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Your Second Brain',
    description: 'Let\'s set up your digital knowledge companion',
    icon: Brain
  },
  {
    id: 'profile',
    title: 'Tell Us About Yourself',
    description: 'Help us personalize your experience',
    icon: User
  },
  {
    id: 'interests',
    title: 'What Are You Interested In?',
    description: 'Select topics that matter to you',
    icon: Target
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start building your second brain',
    icon: CheckCircle
  }
];

const interests = [
  'Artificial Intelligence', 'Machine Learning', 'Web Development', 'Data Science',
  'Design', 'Product Management', 'Startups', 'Blockchain', 'Cloud Computing',
  'DevOps', 'Research', 'Writing', 'Marketing', 'Finance', 'Psychology', 'Philosophy'
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({
    name: '',
    role: '',
    goals: '',
    interests: [] as string[]
  });

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Save user data
    localStorage.setItem('onboardingComplete', 'true');
    localStorage.setItem('userData', JSON.stringify(userData));
    toast.success('Welcome to your second brain!');
    onComplete();
  };

  const toggleInterest = (interest: string) => {
    setUserData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true;
      case 1: return userData.name.trim() !== '';
      case 2: return userData.interests.length > 0;
      case 3: return true;
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
                <Brain className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3">Welcome to Your Second Brain</h2>
              <p className="text-muted-foreground">
                Transform how you capture, organize, and discover knowledge. 
                Let's get you started on your journey to enhanced productivity and creativity.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <Upload className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Import</p>
                <p className="text-xs text-muted-foreground">Add your content</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <Search className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Search</p>
                <p className="text-xs text-muted-foreground">Find insights</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <Brain className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium">Organize</p>
                <p className="text-xs text-muted-foreground">Create cortexes</p>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-3">Tell Us About Yourself</h2>
              <p className="text-muted-foreground">
                Help us personalize your second brain experience
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">What's your name?</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={userData.name}
                  onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">What's your role or profession?</Label>
                <Input
                  id="role"
                  placeholder="e.g., Developer, Designer, Researcher"
                  value={userData.role}
                  onChange={(e) => setUserData(prev => ({ ...prev, role: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goals">What do you hope to achieve with your second brain?</Label>
                <Input
                  id="goals"
                  placeholder="e.g., Better research organization, knowledge discovery"
                  value={userData.goals}
                  onChange={(e) => setUserData(prev => ({ ...prev, goals: e.target.value }))}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-3">What Are You Interested In?</h2>
              <p className="text-muted-foreground">
                Select topics to help us suggest relevant content and organize your knowledge
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {interests.map((interest) => (
                <div key={interest} className="flex items-center space-x-2">
                  <Checkbox
                    id={interest}
                    checked={userData.interests.includes(interest)}
                    onCheckedChange={() => toggleInterest(interest)}
                  />
                  <Label 
                    htmlFor={interest} 
                    className="text-sm cursor-pointer"
                  >
                    {interest}
                  </Label>
                </div>
              ))}
            </div>
            {userData.interests.length > 0 && (
              <div className="bg-primary/5 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Selected interests:</p>
                <div className="flex flex-wrap gap-2">
                  {userData.interests.map((interest) => (
                    <span 
                      key={interest}
                      className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3">You're All Set!</h2>
              <p className="text-muted-foreground">
                Your second brain is ready. Start by importing your first content or exploring the features.
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-lg">
              <h3 className="font-semibold mb-3">Next Steps:</h3>
              <div className="space-y-2 text-sm text-left">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Import your first content via the Import page</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Try searching your knowledge base</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Organize content into cortexes</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            {React.createElement(steps[currentStep].icon, { className: "h-6 w-6 text-primary" })}
            <CardTitle>{steps[currentStep].title}</CardTitle>
          </div>
          <CardDescription>{steps[currentStep].description}</CardDescription>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};