import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KeyRound, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FailedLoginAttempt {
  id: string;
  email: string;
  ip_address: string;
  user_agent: string | null;
  attempted_at: string;
  country: string | null;
  city: string | null;
  region: string | null;
  country_code: string | null;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

function getCountryFlag(countryCode: string | null): string {
  if (!countryCode || countryCode === 'XX') return '🌐';
  // Convert country code to flag emoji
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function FailedLoginAttempts() {
  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ['failed-login-attempts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('failed_login_attempts')
        .select('*')
        .order('attempted_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []).map(attempt => ({
        ...attempt,
        ip_address: String(attempt.ip_address),
      })) as FailedLoginAttempt[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-orange-500" />
          Failed Login Attempts
        </CardTitle>
        <CardDescription>Recent failed authentication attempts with geolocation</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : attempts.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No failed login attempts</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {attempts.map((attempt) => (
              <div key={attempt.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl">
                  {getCountryFlag(attempt.country_code)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm truncate">{attempt.email}</p>
                    <Badge variant="outline" className="text-xs">
                      {attempt.ip_address}
                    </Badge>
                  </div>
                  {(attempt.city || attempt.country) && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {[attempt.city, attempt.region, attempt.country]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(attempt.attempted_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
