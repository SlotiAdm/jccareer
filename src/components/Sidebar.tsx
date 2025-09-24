import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useTrialAccess } from "@/hooks/useTrialAccess";
import { TokenDisplay } from "@/components/TokenDisplay";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, MessageSquare, Users, Target, Database, Table, Navigation, Presentation, Settings, Shield, LogOut, Menu, X, BookOpen } from "lucide-react";

const moduleCategories = [
  {
    title: "Principal",
    modules: [
      { 
        name: "dashboard", 
        title: "Dashboard", 
        icon: LayoutDashboard, 
        path: "/dashboard" 
      },
    ]
  },
  {
    title: "Arsenal de Ferramentas",
    modules: [
      { 
        name: "resume_analyzer", 
        title: "Raio-X de Currículo", 
        icon: FileText, 
        path: "/resume-analyzer" 
      },
      { 
        name: "communication_lab", 
        title: "Laboratório de Comunicação", 
        icon: MessageSquare, 
        path: "/communication-lab" 
      },
    ]
  },
  {
    title: "Dojos de Treinamento",
    modules: [
      { 
        name: "interview_dojo", 
        title: "Dojo de Entrevistas", 
        icon: Target, 
        path: "/interview-dojo" 
      },
      { 
        name: "bsc_strategic", 
        title: "BSC Estratégico", 
        icon: Presentation, 
        path: "/bsc-strategic" 
      },
      { 
        name: "erp_simulator", 
        title: "Simulador ERP", 
        icon: Database, 
        path: "/erp-simulator" 
      },
      { name: "spreadsheet_arena", title: "Arena de Planilhas", icon: Table, path: "/spreadsheet-arena" },
    ]
  },
  {
    title: "Suporte",
    modules: [
      { 
        name: "settings", 
        title: "Configurações", 
        icon: Settings, 
        path: "/settings" 
      },
      { 
        name: "documentation", 
        title: "Central de Ajuda", 
        icon: BookOpen, 
        path: "/documentacao" 
      },
    ]
  }
];

export const Sidebar = () => {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { canAccessModule } = useTrialAccess();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-lg border"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <Link to="/dashboard" className="text-xl font-bold text-primary">
            BussulaC
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          {moduleCategories.map((category) => (
            <div key={category.title} className="mb-8">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {category.title}
              </h3>
              <div className="space-y-1">
                {category.modules.map((module) => {
                  const isActive = location.pathname === module.path;
                  const hasAccess = canAccessModule() || module.name === "dashboard" || module.name === "settings" || module.name === "documentation";
                  const IconComponent = module.icon;

                  return (
                    <Link
                      key={module.name}
                      to={module.path}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-primary text-white"
                          : hasAccess
                          ? "text-gray-700 hover:bg-gray-50 hover:text-primary"
                          : "text-gray-400 cursor-not-allowed"
                      )}
                    >
                      <IconComponent className={cn(
                        "mr-3 h-5 w-5 flex-shrink-0",
                        isActive ? "text-white" : hasAccess ? "text-gray-400 group-hover:text-primary" : "text-gray-300"
                      )} />
                      <span className="flex-1">{module.title}</span>
                      {!hasAccess && module.name !== "dashboard" && module.name !== "settings" && module.name !== "documentation" && (
                        <Badge variant="secondary" className="text-xs">
                          Pro
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Admin Section */}
          {profile?.is_admin && (
            <div className="mb-8">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Administração
              </h3>
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  location.pathname === "/admin"
                    ? "bg-red-100 text-red-900"
                    : "text-gray-700 hover:bg-red-50 hover:text-red-900"
                )}
              >
                <Shield className="mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
                Painel Admin
              </Link>
            </div>
          )}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900">
              {profile?.full_name || "Usuário"}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {profile?.strategist_title || "Analista Júnior"}
              </span>
              <Badge variant="outline" className="text-xs">
                Nv. {profile?.strategist_level || 1}
              </Badge>
            </div>
            
            {/* Token Display */}
            <div className="mt-2">
              <TokenDisplay />
            </div>
          </div>
          
          <button
            onClick={signOut}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary rounded-md transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sair
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};