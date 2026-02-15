import { FileText, Menu, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useLogout } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/ui';

type NavItem = { name: string; href: string };

const anchorLinks: NavItem[] = [
  { name: 'Как работает', href: '#how-it-works' },
  { name: 'Тарифы', href: '#pricing' },
  { name: 'Отзывы', href: '#reviews' },
  { name: 'FAQ', href: '#faq' },
];

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const logout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const productLinks = useMemo(
    () => [
      { name: 'Дашборд', href: '/dashboard' },
      { name: 'Шаблоны', href: '/templates' },
      { name: 'Подписка', href: '/billing' },
      { name: 'Профиль', href: '/profile' },
    ],
    []
  );

  const navigateAnchor = (href: string) => {
    if (href.startsWith('#')) {
      const targetId = href.slice(1);
      if (location.pathname === '/') {
        const el = typeof document !== 'undefined' ? document.getElementById(targetId) : null;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        navigate(`/${href}`);
      }
    } else {
      navigate(href);
    }
    setMobileMenuOpen(false);
  };

  const handleStart = () => {
    navigate(isAuthenticated ? '/new-contract' : '/register');
    setMobileMenuOpen(false);
  };

  const handleGuest = () => {
    navigate('/guest-contract');
    setMobileMenuOpen(false);
  };

  const handleLogin = () => {
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">ДоговорAI</span>
            </button>
          </div>

          {!isAuthenticated && (
            <div className="hidden md:flex items-center gap-8">
              {anchorLinks.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => navigateAnchor(item.href)}
                  className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {productLinks.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => navigate(item.href)}
                    className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    {item.name}
                  </button>
                ))}
                <Button variant="outline" onClick={handleStart}>
                  Новый договор
                </Button>
                <Button variant="ghost" onClick={handleLogout}>
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
                  onClick={handleLogin}
                >
                  Войти
                </button>
                <Button onClick={handleStart}>Создать договор</Button>
                <Button variant="outline" onClick={handleGuest}>
                  Без регистрации
                </Button>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-700"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-4">
              {!isAuthenticated &&
                anchorLinks.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => navigateAnchor(item.href)}
                    className="text-gray-700 hover:text-blue-600 transition-colors px-2 py-2 text-left cursor-pointer"
                  >
                    {item.name}
                  </button>
                ))}

              <div className="pt-4 border-t border-gray-200 flex flex-col gap-3">
                {isAuthenticated ? (
                  <>
                    {productLinks.map((item) => (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => navigate(item.href)}
                        className="text-gray-700 hover:text-blue-600 transition-colors px-2 py-2 text-left cursor-pointer"
                      >
                        {item.name}
                      </button>
                    ))}
                    <div className="flex gap-2 flex-col">
                      <Button variant="outline" className="w-full" onClick={handleStart}>
                        Новый договор
                      </Button>
                      <Button variant="ghost" className="w-full" onClick={handleLogout}>
                        Выйти
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="text-gray-700 hover:text-blue-600 transition-colors px-2 py-2 text-left cursor-pointer"
                      onClick={handleLogin}
                    >
                      Войти
                    </button>
                    <div className="flex gap-2 flex-col">
                      <Button className="w-full" onClick={handleStart}>
                        Создать договор
                      </Button>
                      <Button variant="outline" className="w-full" onClick={handleGuest}>
                        Без регистрации
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
