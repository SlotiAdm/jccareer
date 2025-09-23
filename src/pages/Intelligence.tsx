import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, User, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface IntelligencePost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  published_at: string;
}

export default function Intelligence() {
  const [posts, setPosts] = useState<IntelligencePost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<IntelligencePost[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPost, setSelectedPost] = useState<IntelligencePost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await supabase
          .from('intelligence_flow_posts')
          .select('*')
          .order('published_at', { ascending: false });

        if (data) {
          setPosts(data);
          setFilteredPosts(data);
        }
      } catch (error) {
        console.error('Error fetching intelligence posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPosts(posts);
    } else {
      const filtered = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPosts(filtered);
    }
  }, [searchTerm, posts]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
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
      
      <main className="flex-1 ml-64 overflow-hidden">
        <div className="flex h-full">
          {/* Lista de Posts */}
          <div className="w-96 border-r border-gray-200 bg-white overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold text-gray-900">
                  Fluxo de Inteligência
                </h1>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar análises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {filteredPosts.map((post) => (
                <Card
                  key={post.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedPost?.id === post.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedPost(post)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.published_at)}
                      <User className="h-3 w-3 ml-2" />
                      {post.author}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {post.excerpt}
                    </p>
                  </CardContent>
                </Card>
              ))}
              
              {filteredPosts.length === 0 && searchTerm && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Nenhuma análise encontrada para "{searchTerm}"
                  </p>
                </div>
              )}
              
              {posts.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">
                    Nenhuma análise disponível no momento
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Conteúdo do Post */}
          <div className="flex-1 overflow-y-auto">
            {selectedPost ? (
              <article className="p-8 max-w-4xl mx-auto">
                <header className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {selectedPost.title}
                  </h1>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(selectedPost.published_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {selectedPost.author}
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="mb-6">
                    Análise Estratégica
                  </Badge>
                </header>

                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({children}) => <h1 className="text-2xl font-bold text-gray-900 mt-8 mb-4">{children}</h1>,
                      h2: ({children}) => <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">{children}</h2>,
                      h3: ({children}) => <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">{children}</h3>,
                      p: ({children}) => <p className="text-gray-700 mb-4 leading-relaxed">{children}</p>,
                      ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                      li: ({children}) => <li className="text-gray-700">{children}</li>,
                      strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                      blockquote: ({children}) => (
                        <blockquote className="border-l-4 border-primary pl-4 italic text-gray-600 my-4">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {selectedPost.content}
                  </ReactMarkdown>
                </div>

                <footer className="mt-12 pt-8 border-t border-gray-200">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      💡 Aplicação Prática
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Use os frameworks e insights apresentados nesta análise em suas próprias 
                      decisões estratégicas. Compartilhe seus resultados na comunidade!
                    </p>
                  </div>
                </footer>
              </article>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Zap className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Selecione uma análise
                  </h2>
                  <p className="text-gray-600">
                    Escolha uma análise na lista para visualizar o conteúdo completo
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