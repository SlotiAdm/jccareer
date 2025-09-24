import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Zap, MessageCircle, Settings, LogOut, Menu, X, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const baseNavigation = [
  { name: "Início", href: "/dashboard", icon: Home },
  { name: "Comunidade", href: "#", icon: MessageCircle },
  { name: "Configurações", href: "/settings", icon: Settings },
];

export const Sidebar = () => {
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // Adicionar link admin apenas para administradores
  const navigation = profile?.is_admin 
    ? [
        ...baseNavigation.slice(0, -1), // Todos exceto configurações
        { name: "Admin", href: "/admin", icon: Shield },
        baseNavigation[baseNavigation.length - 1] // Configurações por último
      ]
    : baseNavigation;

  const sidebarContent = (
    <>
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
        <Link to="/dashboard" className="text-xl font-bold text-gray-900">
          BussulaC
        </Link>
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <nav className="flex flex-1 flex-col px-4 py-6">
        <ul className="flex flex-1 flex-col gap-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  onClick={() => isMobile && setIsOpen(false)}
                  className={cn(
                    "group flex gap-x-3 rounded-lg p-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              </li>
            );
          })}
          
          <li className="mt-auto">
            <button
              onClick={signOut}
              className="group flex w-full gap-x-3 rounded-lg p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Sair
            </button>
          </li>
        </ul>
      </nav>
    </>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile menu button */}
        <Button
          variant="outline"
          size="sm"
          className="fixed top-4 left-4 z-40 lg:hidden"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile sidebar overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-30 lg:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
            <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 overflow-y-auto overscroll-contain">
              {sidebarContent}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col fixed left-0 top-0 bg-white border-r border-gray-200 z-30">
      {sidebarContent}
    </div>
  );
};