import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Star, Target, Zap } from 'lucide-react';

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at?: string;
}

interface BadgeDisplayProps {
  badges: BadgeData[];
  className?: string;
}

export function BadgeDisplay({ badges, className }: BadgeDisplayProps) {
  const getIcon = (iconName: string) => {
    const icons = {
      trophy: Trophy,
      star: Star,
      target: Target,
      zap: Zap,
    };
    return icons[iconName as keyof typeof icons] || Trophy;
  };

  if (badges.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Suas Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            Complete módulos para conquistar suas primeiras badges!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Suas Conquistas ({badges.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {badges.map((badge) => {
            const IconComponent = getIcon(badge.icon);
            return (
              <div
                key={badge.id}
                className="flex flex-col items-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-2">
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold text-sm text-center text-gray-900 mb-1">
                  {badge.name}
                </h4>
                <p className="text-xs text-gray-600 text-center mb-2">
                  {badge.description}
                </p>
                {badge.earned_at && (
                  <Badge variant="secondary" className="text-xs">
                    {new Date(badge.earned_at).toLocaleDateString('pt-BR')}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}