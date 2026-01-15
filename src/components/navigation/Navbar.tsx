/**
 * Refactored Navbar Component
 * Uses centralized navigation configuration and improved patterns
 */

import { useState, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, LogIn, LogOut, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { NotificationCenter } from '@/components/features/NotificationCenter';
import { StatusIndicator } from '@/components/connection/StatusIndicator';
import { SyncStatusIndicator } from '@/components/sync/SyncStatusIndicator';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { CORTEX_NAV_ITEMS, AUTH_NAV_ITEMS, ADMIN_NAV_ITEM, isActiveRoute } from '@/constants/navigation';
import { ROUTES } from '@/constants';
import type { NavItem } from '@/types';

// ============================================
// Sub-components
// ============================================

interface NavItemButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

const NavItemButton = ({ item, isActive, onClick }: NavItemButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={item.to}
          className={cn(
            "relative flex items-center justify-center px-4 py-3 rounded-lg transition-base",
            "hover:bg-primary/10 hover:text-primary",
            "focus-ring",
            isActive ? "bg-primary/10 text-primary" : "text-foreground/80"
          )}
          onClick={onClick}
          aria-current={isActive ? 'page' : undefined}
        >
          <span className={cn(
            "transition-colors",
            isActive ? "text-primary" : "text-foreground/60"
          )}>
            {item.icon}
          </span>
          {isActive && (
            <span className="ml-2 font-medium">{item.label}</span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>{item.label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

interface SubMenuItemProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

const SubMenuItem = ({ item, isActive, onClick }: SubMenuItemProps) => {
  return (
    <Link
      to={item.to}
      className={cn(
        "flex items-center gap-2 p-2 rounded-md transition-base",
        "hover:bg-primary/10 hover:text-primary",
        "focus-ring",
        isActive ? "bg-primary/10 text-primary" : ""
      )}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={cn(
        "transition-colors",
        isActive ? "text-primary" : "text-foreground/60"
      )}>
        {item.icon}
      </span>
      <span>{item.label}</span>
    </Link>
  );
};

// ============================================
// Main Navbar Component
// ============================================

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin } = useUserRole();
  const [activeId, setActiveId] = useState<string>('');

  // Determine active state from current route
  const currentPath = location.pathname;

  const handleNavClick = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const handleLogin = useCallback(() => {
    navigate(ROUTES.AUTH);
  }, [navigate]);

  // Check if any Cortex submenu item is active
  const isCortexActive = useMemo(() => {
    return CORTEX_NAV_ITEMS.some(item => isActiveRoute(currentPath, item.to));
  }, [currentPath]);

  // Navigation items based on auth state and role
  const navItems = useMemo(() => {
    if (!isAuthenticated) return [];
    const items = [...AUTH_NAV_ITEMS];
    if (isAdmin) {
      items.push(ADMIN_NAV_ITEM);
    }
    return items;
  }, [isAuthenticated, isAdmin]);

  return (
    <TooltipProvider>
      <header 
        className="glass-panel fixed top-6 left-1/2 transform -translate-x-1/2 z-40 rounded-lg px-1 py-1"
        role="navigation"
        aria-label="Main navigation"
      >
        <nav className="flex items-center">
          {/* Cortex Dropdown Menu */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-3 rounded-lg transition-base",
                    "hover:bg-primary/10 hover:text-primary",
                    isCortexActive ? "bg-primary/10 text-primary" : "text-foreground/80"
                  )}
                >
                  <Brain 
                    size={20} 
                    className={cn(
                      "transition-colors",
                      isCortexActive ? "text-primary" : "text-foreground/60"
                    )} 
                  />
                  <span className="font-medium">Cortex</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[200px] gap-1 p-2 bg-popover">
                    {CORTEX_NAV_ITEMS.map((item) => (
                      <SubMenuItem
                        key={item.id}
                        item={item}
                        isActive={isActiveRoute(currentPath, item.to)}
                        onClick={() => handleNavClick(item.id)}
                      />
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Auth Navigation Items */}
          {navItems.map((item) => (
            <NavItemButton
              key={item.id}
              item={item}
              isActive={isActiveRoute(currentPath, item.to)}
              onClick={() => handleNavClick(item.id)}
            />
          ))}

          {/* Sync Status & Notification Center (authenticated only) */}
          {isAuthenticated && (
            <>
              <SyncStatusIndicator />
              <NotificationCenter />
            </>
          )}

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg ml-1"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle {theme === 'dark' ? 'light' : 'dark'} mode</p>
            </TooltipContent>
          </Tooltip>

          {/* Auth Button */}
          {isAuthenticated ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-primary hover:text-primary-foreground"
                  onClick={handleLogout}
                  aria-label="Log out"
                >
                  <LogOut size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              <StatusIndicator />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-primary hover:text-primary-foreground"
                    onClick={handleLogin}
                    aria-label="Log in"
                  >
                    <LogIn size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Login</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </nav>
      </header>
    </TooltipProvider>
  );
};

export default Navbar;
