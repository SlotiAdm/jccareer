import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Play, CheckCircle, ChevronDown, Download, FileText, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  content: string;
  materials_url: string;
  order_index: number;
  duration_minutes: number;
  completed?: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

export default function Course() {
  const { profile } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [openModules, setOpenModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // Fetch modules with lessons
        const { data: modulesData } = await supabase
          .from('course_modules')
          .select(`
            *,
            course_lessons(*)
          `)
          .order('order_index');

        // Fetch user progress
        const { data: progressData } = await supabase
          .from('user_lesson_progress')
          .select('lesson_id, completed')
          .eq('user_id', profile?.user_id);

        const progressMap = new Map(
          progressData?.map(p => [p.lesson_id, p.completed]) || []
        );

        const formattedModules = modulesData?.map(module => ({
          ...module,
          lessons: module.course_lessons
            .sort((a, b) => a.order_index - b.order_index)
            .map(lesson => ({
              ...lesson,
              completed: progressMap.get(lesson.id) || false
            }))
        })) || [];

        setModules(formattedModules);

        // Auto-select first lesson if none selected
        if (formattedModules.length > 0 && formattedModules[0].lessons.length > 0) {
          setSelectedLesson(formattedModules[0].lessons[0]);
          setOpenModules([formattedModules[0].id]);
        }

      } catch (error) {
        console.error('Error fetching course data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.user_id) {
      fetchCourseData();
    }
  }, [profile]);

  const markLessonCompleted = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: profile?.user_id,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString()
        });

      if (!error) {
        // Update local state
        setModules(prev => prev.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson =>
            lesson.id === lessonId ? { ...lesson, completed: true } : lesson
          )
        })));
      }
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
    }
  };

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
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
      
      <main className="flex-1 ml-64 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar do Curso */}
          <div className="w-80 border-r border-gray-200 bg-white overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Formação Analista Estratégico
              </h1>
              <p className="text-sm text-gray-600">
                Desenvolva habilidades analíticas de elite
              </p>
            </div>
            
            <div className="p-4 space-y-4">
              {modules.map((module) => (
                <Collapsible
                  key={module.id}
                  open={openModules.includes(module.id)}
                  onOpenChange={() => toggleModule(module.id)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {module.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {module.lessons.length} aulas
                      </p>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      openModules.includes(module.id) && "rotate-180"
                    )} />
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="mt-2 space-y-1">
                    {module.lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3",
                          selectedLesson?.id === lesson.id
                            ? "bg-primary text-white"
                            : "hover:bg-gray-50"
                        )}
                      >
                        <div className="flex-shrink-0">
                          {lesson.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-medium truncate">
                            {lesson.title}
                          </p>
                          <p className="text-xs opacity-75">
                            {lesson.duration_minutes} min
                          </p>
                        </div>
                      </button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>

          {/* Área do Conteúdo */}
          <div className="flex-1 overflow-y-auto">
            {selectedLesson ? (
              <div className="p-8">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedLesson.title}
                  </h1>
                  <p className="text-gray-600">
                    {selectedLesson.description}
                  </p>
                </div>

                {/* Video Player */}
                <Card className="mb-6">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                      <div className="text-center text-white">
                        <Play className="h-16 w-16 mx-auto mb-4 opacity-75" />
                        <p className="text-lg mb-2">Player de Vídeo</p>
                        <p className="text-sm opacity-75">
                          {selectedLesson.video_url ? 'Vídeo disponível' : 'Vídeo em breve'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lesson Content */}
                {selectedLesson.content && (
                  <Card className="mb-6">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Conteúdo da Aula
                      </h3>
                      <div className="prose max-w-none">
                        <p className="text-gray-600 whitespace-pre-line">
                          {selectedLesson.content || 'Conteúdo em texto estará disponível aqui, incluindo resumos da aula, pontos-chave e exercícios práticos.'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Materials and Actions */}
                <div className="flex items-center gap-4">
                  {!selectedLesson.completed && (
                    <Button 
                      onClick={() => markLessonCompleted(selectedLesson.id)}
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Marcar como Concluída
                    </Button>
                  )}
                  
                  {selectedLesson.materials_url && (
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Baixar Materiais
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Selecione uma aula
                  </h2>
                  <p className="text-gray-600">
                    Escolha uma aula na barra lateral para começar a estudar
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}