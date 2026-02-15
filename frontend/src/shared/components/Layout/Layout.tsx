import { Container } from '@mui/material';
import { FileText } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
}

const Footer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleAnchor = (hash: string) => {
    if (location.pathname === '/') {
      const el = document.getElementById(hash.replace('#', ''));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    navigate(`/${hash}`);
  };

  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4 mt-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xl">ДоговорAI</span>
            </div>
            <p className="text-sm mb-4">
              AI-конструктор договоров для фрилансеров, самозанятых и ИП. Защитите свои интересы за 5
              минут без юриста.
            </p>
            <p className="text-xs">
              Сервис помогает подготовить документы, но не заменяет юридическую консультацию. За
              корректность финального текста отвечает пользователь.
            </p>
          </div>

          <div>
            <h4 className="text-white mb-3">Навигация</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => handleAnchor('#how-it-works')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Как работает
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleAnchor('#pricing')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Тарифы
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleAnchor('#reviews')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Отзывы
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleAnchor('#faq')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white mb-3">Поддержка</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Правила использования
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@dogovarai.ru"
                  className="hover:text-white transition-colors"
                >
                  support@dogovarai.ru
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-sm text-center">
          <p>© {new Date().getFullYear()} ДоговорAI. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export const Layout = ({ children, maxWidth = 'lg', fullWidth = false }: LayoutProps) => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (location.hash) return; // allow in-page anchor scrolling
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.search, location.hash]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 w-full">
        {fullWidth ? (
          children
        ) : (
          <Container
            maxWidth={maxWidth}
            sx={{
              flex: 1,
              py: { xs: 2, md: 4 },
              px: { xs: 2, sm: 3, md: 4 },
            }}
          >
            {children}
          </Container>
        )}
      </main>
      <Footer />
    </div>
  );
};
