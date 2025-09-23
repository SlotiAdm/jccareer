import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, BookOpen, MessageCircle, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface IntelligencePost {
  id: string;
  title: string;
  excerpt: string;
  published_at: string;
}

interface CourseProgress {
  totalLessons: number;
  completedLessons: number;
  currentModule: string;
  currentLesson: string;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [recentPosts, setRecentPosts] = useState<IntelligencePost[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent intelligence posts
        const { data: posts } = await supabase
          .from('intelligence_flow_posts')
          .select('id, title, excerpt, published_at')
          .order('published_at', { ascending: false })
          .limit(3);

        if (posts) {
          setRecentPosts(posts);
        }

        // Fetch course progress
        const { data: progressData } = await supabase
          .from('user_lesson_progress')
          .select(`
            lesson_id,
            completed,
            course_lessons(
              title,
              course_modules(title)
            )
          `)
          .eq('user_id', profile?.user_id);

        // Calculate progress (simplified for MVP)
        const totalLessons = 8; // Based on sample data
        const completedLessons = progressData?.filter(p => p.completed).length || 0;
        
        setCourseProgress({
          totalLessons,
          completedLessons,
          currentModule: "Fundamentos da Análise Estratégica",
          currentLesson: "Introdução à Análise Estratégica"
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.user_id) {
      fetchDashboardData();
    }
  }, [profile]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo de volta, {profile?.full_name || 'Analista'}
            </h1>
            <p className="text-gray-600">
              Continue sua jornada de desenvolvimento analítico
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Status da Assinatura */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Status da Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {profile?.subscription_status === 'active' ? 'Ativa' : 'Inativa'}
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  Plano: {profile?.subscription_plan === 'annual' ? 'Anual' : 'Mensal'}
                </p>
              </CardContent>
            </Card>

            {/* Progresso do Curso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  Progresso do Curso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Aulas Concluídas</span>
                    <span>{courseProgress?.completedLessons || 0}/{courseProgress?.totalLessons || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ 
                        width: `${((courseProgress?.completedLessons || 0) / (courseProgress?.totalLessons || 1)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Últimas Análises */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Fluxo de Inteligência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  {recentPosts.length} novas análises disponíveis
                </p>
                <Link to="/intelligence">
                  <Button size="sm" variant="outline" className="w-full">
                    Ver Análises
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Últimas Análises do Fluxo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  ÚLTIMAS ANÁLISES DO FLUXO
                </CardTitle>
                <CardDescription>
                  Conteúdo estratégico mais recente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentPosts.map((post) => (
                  <div key={post.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-grow">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatDate(post.published_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {recentPosts.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    Nenhuma análise disponível no momento
                  </p>
                )}
                
                <Link to="/intelligence">
                  <Button variant="outline" className="w-full">
                    Ver Todas as Análises
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Continue de onde parou */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  CONTINUE DE ONDE PAROU
                </CardTitle>
                <CardDescription>
                  Formação Analista Estratégico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-gray-400" />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {courseProgress?.currentModule}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {courseProgress?.currentLesson}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Módulo 1 - Aula 1/2</span>
                        <span>{Math.round(((courseProgress?.completedLessons || 0) / (courseProgress?.totalLessons || 1)) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full"
                          style={{ 
                            width: `${((courseProgress?.completedLessons || 0) / (courseProgress?.totalLessons || 1)) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <Link to="/course">
                      <Button className="w-full">
                        Continuar Assistindo
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Acesso à Comunidade */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Comunidade Data-Driven Minds
              </CardTitle>
              <CardDescription>
                Conecte-se com outros analistas estratégicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 mb-2">
                    Participe de discussões, compartilhe insights e aprenda com outros profissionais.
                  </p>
                  <Badge variant="outline">+1.2k membros ativos</Badge>
                </div>
                <Button>
                  Acessar Comunidade
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}