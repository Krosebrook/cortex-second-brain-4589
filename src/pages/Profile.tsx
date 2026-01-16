import { useState } from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import ProjectRoadmap from '@/components/ProjectRoadmap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserProfile } from '@/lib/types';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';
import { Mail, Save, X, Plus, ExternalLink } from 'lucide-react';

const initialProfile: UserProfile = {
  name: 'Alex Johnson',
  email: 'alex@example.com',
  description: 'AI researcher and knowledge management enthusiast. Building a digital second brain to enhance creativity and productivity.',
  links: [
    { title: 'Personal Website', url: 'https://example.com' },
    { title: 'GitHub', url: 'https://github.com' },
    { title: 'Twitter', url: 'https://twitter.com' },
  ],
};

const Profile = () => {
  const showContent = useAnimateIn(false, 300);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(initialProfile);
  const [tempLink, setTempLink] = useState({ title: '', url: '' });
  
  const handleEditProfile = () => {
    setTempProfile({...profile});
    setIsEditing(true);
  };
  
  const handleSaveProfile = () => {
    setProfile({...tempProfile});
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
  };
  
  const handleAddLink = () => {
    if (tempLink.title && tempLink.url) {
      setTempProfile({
        ...tempProfile,
        links: [...(tempProfile.links || []), tempLink]
      });
      setTempLink({ title: '', url: '' });
    }
  };
  
  const handleRemoveLink = (index: number) => {
    const newLinks = [...(tempProfile.links || [])];
    newLinks.splice(index, 1);
    setTempProfile({
      ...tempProfile,
      links: newLinks
    });
  };
  
  return (
    <PageWrapper>
      <AnimatedTransition show={showContent} animation="slide-up">
        {!isEditing ? (
          <Card className={cn("w-full mb-8 border-border/50")}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-light text-primary">{profile.name.charAt(0)}</span>
              </div>
              
              <div>
                <CardTitle className="text-foreground">{profile.name}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-1" />
                  {profile.email}
                </CardDescription>
              </div>
              
              <div className="ml-auto flex gap-2 flex-wrap">
                {profile.links?.map((link, index) => (
                  <a 
                    key={index} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg",
                      "bg-primary text-primary-foreground text-sm font-medium",
                      "hover:bg-primary/90 transition-colors"
                    )}
                  >
                    {link.title}
                    <ExternalLink size={14} />
                  </a>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEditProfile}
                className="ml-2"
              >
                Edit Profile
              </Button>
            </CardHeader>
          </Card>
        ) : (
          <Card className={cn("w-full mb-8 border-border/50")}>
            <CardHeader>
              <CardTitle className="text-foreground">Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Name</Label>
                  <Input 
                    id="name" 
                    value={tempProfile.name}
                    onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={tempProfile.email}
                    onChange={(e) => setTempProfile({...tempProfile, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">Description</Label>
                <Input 
                  id="description" 
                  value={tempProfile.description || ''}
                  onChange={(e) => setTempProfile({...tempProfile, description: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-foreground">Links</Label>
                <div className="rounded-md border border-border/50">
                  <div className="space-y-2 p-4">
                    {tempProfile.links?.map((link, index) => (
                      <div key={index} className="flex items-center justify-between gap-2">
                        <div className="flex-1 truncate text-foreground">
                          <span className="font-medium">{link.title}</span>: {link.url}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveLink(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="linkTitle" className="text-foreground">Link Title</Label>
                  <Input 
                    id="linkTitle" 
                    value={tempLink.title}
                    onChange={(e) => setTempLink({...tempLink, title: e.target.value})}
                    placeholder="GitHub"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="linkUrl" className="text-foreground">URL</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="linkUrl" 
                      value={tempLink.url}
                      onChange={(e) => setTempLink({...tempLink, url: e.target.value})}
                      placeholder="https://github.com/username"
                    />
                    <Button onClick={handleAddLink}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
              <Button onClick={handleSaveProfile}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        )}
        
        <PageHeader
          title="Project Roadmap"
          description="Track your project journey from start to completion and collect reviews"
          className="text-center"
        />
        
        <ProjectRoadmap />
      </AnimatedTransition>
    </PageWrapper>
  );
};

export default Profile;
