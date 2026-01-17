import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KeyRound, MapPin } from 'lucide-react';
import { useFailedLoginAttempts } from '@/hooks/useFailedLoginAttempts';
import { formatTimeAgo } from '@/lib/time-utils';
import { getCountryFlag, formatLocation } from '@/lib/geo-utils';

export function FailedLoginAttempts() {
  const { attempts, isLoading } = useFailedLoginAttempts({ limit: 50 });

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
                      <span>{formatLocation(attempt)}</span>
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
