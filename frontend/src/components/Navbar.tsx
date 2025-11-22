import { Link } from 'react-router-dom';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from './theme-provider';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex justify-center pt-6 px-4 pointer-events-none">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-5xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-full shadow-sm pointer-events-auto"
      >
        <div className="flex h-14 items-center justify-between px-6">
          {/* Brand */}
          <Link to="/" className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-100 hover:opacity-80 transition-opacity">
            CertVerifier
          </Link>

          {/* Right Side Content */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full w-9 h-9 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-zinc-600 dark:text-zinc-400" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-zinc-600 dark:text-zinc-400" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

            {/* User Actions */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full px-3 h-8 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    {user?.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem disabled>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {user?.role === 'university' && (
                    <Link to="/university">
                      <DropdownMenuItem>
                        Dashboard
                      </DropdownMenuItem>
                    </Link>
                  )}
                  {user?.role === 'student' && (
                    <Link to="/student">
                      <DropdownMenuItem>
                        Dashboard
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" className="rounded-full h-8 px-4 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="outline" className="rounded-full h-8 px-4 text-sm border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </nav>
  );
}
