import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Zap, MessageCircle, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Início", href: "/dashboard", icon: Home },
  { name: "Formação", href: "/course", icon: BookOpen },
  { name: "Fluxo de Inteligência", href: "/intelligence", icon: Zap },
  { name: "Comunidade", href: "#", icon: MessageCircle },
  { name: "Configurações", href: "/settings", icon: Settings },
];

export const Sidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col fixed left-0 top-0 bg-white border-r border-gray-200">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200">
        <Link to="/dashboard" className="text-xl font-bold text-gray-900">
          O Terminal
        </Link>
      </div>
      
      <nav className="flex flex-1 flex-col px-4 py-6">
        <ul className="flex flex-1 flex-col gap-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
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
    </div>
  );
};