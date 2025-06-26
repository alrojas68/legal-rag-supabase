import Link from 'next/link';
import { Logo } from './logo';
import { Button } from './ui/button';
import { Upload, MessageSquare, FileText } from 'lucide-react';

interface NavigationProps {
  currentPage?: 'home' | 'upload' | 'documents' | 'chat';
}

export function Navigation({ currentPage = 'home' }: NavigationProps) {
  const navItems = [
    {
      href: '/',
      label: 'Chat',
      icon: MessageSquare,
      active: currentPage === 'home'
    },
    {
      href: '/upload',
      label: 'Subir Docs',
      icon: Upload,
      active: currentPage === 'upload'
    },
    {
      href: '/documents',
      label: 'Documentos',
      icon: FileText,
      active: currentPage === 'documents'
    }
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Logo size={32} />
            </Link>
            
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={item.active ? "default" : "ghost"}
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Sistema Activo</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 