/**
 * Refactored Navbar Component
 * Desktop: floating glass bar with dropdowns
 * Mobile: hamburger icon → full slide-out sheet
 */

import { useState, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, LogIn, LogOut, Moon, Sun, User, ChevronDown, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { NotificationCenter } from '@/components/features/NotificationCenter';
import { StatusIndicator } from '@/components/connection/StatusIndicator';
import { SyncStatusIndicator } from '@/components/sync/SyncStatusIndicator';
import { ConflictIndicator } from '@/components/navigation/ConflictIndicator';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { CORTEX_NAV_ITEMS, AUTH_NAV_ITEMS, ADMIN_NAV_ITEM, isActiveRoute } from '@/constants/navigation';
import { ROUTES } from '@/constants';
import type { NavItem } from '@/types';

const USER_MENU_IDS = ['profile', 'settings'];

// ============================================
// Desktop Sub-components
// ============================================

const NavItemButton = ({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick: () => void }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Link
        to={item.to}
        className={cn(
          "relative flex items-center justify-center px-4 py-3 rounded-lg transition-base",
          "hover:bg-primary/10 hover:text-primary focus-ring",
          isActive ? "bg-primary/10 text-primary" : "text-foreground/80"
        )}
        onClick={onClick}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className={cn("transition-colors", isActive ? "text-primary" : "text-foreground/60")}>
          {item.icon}
        </span>
        {isActive && <span className="ml-2 font-medium">{item.label}</span>}
      </Link>
    </TooltipTrigger>
    <TooltipContent><p>{item.label}</p></TooltipContent>
  </Tooltip>
);

const SubMenuItem = ({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick: () => void }) => (
  <Link
    to={item.to}
    className={cn(
      "flex items-center gap-2 p-2 rounded-md transition-base",
      "hover:bg-primary/10 hover:text-primary focus-ring",
      isActive ? "bg-primary/10 text-primary" : ""
    )}
    onClick={onClick}
    aria-current={isActive ? 'page' : undefined}
  >
    <span className={cn("transition-colors", isActive ? "text-primary" : "text-foreground/60")}>
      {item.icon}
    </span>
    <span>{item.label}</span>
  </Link>
);

// ============================================
// Mobile Nav Link
// ============================================

const MobileNavLink = ({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick: () => void }) => (
  <Link
    to={item.to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg transition-base",
      "hover:bg-primary/10 hover:text-primary",
      isActive ? "bg-primary/10 text-primary font-medium" : "text-foreground/80"
    )}
    onClick={onClick}
    aria-current={isActive ? 'page' : undefined}
  >
    <span className={cn("transition-colors", isActive ? "text-primary" : "text-foreground/60")}>
      {item.icon}
    </span>
    <span>{item.label}</span>
  </Link>
);

// ============================================
// Main Navbar
// ============================================

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, setActiveId] = useState('');

  const currentPath = location.pathname;

  const handleNavClick = useCallback((id: string) => {
    setActiveId(id);
    setMobileOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setMobileOpen(false);
  }, [logout]);

  const handleLogin = useCallback(() => {
    navigate(ROUTES.AUTH);
    setMobileOpen(false);
  }, [navigate]);

  const isCortexActive = useMemo(
    () => CORTEX_NAV_ITEMS.some(item => isActiveRoute(currentPath, item.to)),
    [currentPath]
  );

  const { mainNavItems, userMenuItems } = useMemo(() => {
    if (!isAuthenticated) return { mainNavItems: [], userMenuItems: [] };
    const allItems = [...AUTH_NAV_ITEMS];
    if (isAdmin) allItems.push(ADMIN_NAV_ITEM);
    return {
      mainNavItems: allItems.filter(item => !USER_MENU_IDS.includes(item.id)),
      userMenuItems: allItems.filter(item => USER_MENU_IDS.includes(item.id)),
    };
  }, [isAuthenticated, isAdmin]);

  const isUserMenuActive = useMemo(
    () => userMenuItems.some(item => isActiveRoute(currentPath, item.to)),
    [userMenuItems, currentPath]
  );

  // All items for mobile menu (flat list)
  const allNavItems = useMemo(() => {
    const items: NavItem[] = [...CORTEX_NAV_ITEMS];
    if (isAuthenticated) {
      const authItems = [...AUTH_NAV_ITEMS];
      if (isAdmin) authItems.push(ADMIN_NAV_ITEM);
      items.push(...authItems);
    }
    return items;
  }, [isAuthenticated, isAdmin]);

  // ─── Mobile ───
  if (isMobile) {
    return (
      <header
        className="glass-panel fixed top-4 left-4 right-4 z-40 rounded-lg px-3 py-2"
        role="navigation"
        aria-label="Main navigation"
      >
        <nav className="flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 text-primary font-semibold" onClick={() => setMobileOpen(false)}>
            <Brain size={22} />
            <span>Cortex</span>
          </Link>

          <div className="flex items-center gap-1">
            {isAuthenticated && <NotificationCenter />}

            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg" aria-label="Open menu">
                  <Menu size={22} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <SheetHeader className="px-4 pt-4 pb-2">
                  <SheetTitle className="flex items-center gap-2 text-primary">
                    <Brain size={20} />
                    Navigation
                  </SheetTitle>
                </SheetHeader>
                <Separator />
                <div className="flex flex-col gap-1 p-3 overflow-y-auto max-h-[calc(100vh-10rem)]">
                  {/* Cortex section */}
                  <p className="px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Cortex
                  </p>
                  {CORTEX_NAV_ITEMS.map(item => (
                    <MobileNavLink
                      key={item.id}
                      item={item}
                      isActive={isActiveRoute(currentPath, item.to)}
                      onClick={() => handleNavClick(item.id)}
                    />
                  ))}

                  {isAuthenticated && (
                    <>
                      <Separator className="my-2" />
                      <p className="px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        App
                      </p>
                      {mainNavItems.map(item => (
                        <MobileNavLink
                          key={item.id}
                          item={item}
                          isActive={isActiveRoute(currentPath, item.to)}
                          onClick={() => handleNavClick(item.id)}
                        />
                      ))}

                      <Separator className="my-2" />
                      <p className="px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Account
                      </p>
                      {userMenuItems.map(item => (
                        <MobileNavLink
                          key={item.id}
                          item={item}
                          isActive={isActiveRoute(currentPath, item.to)}
                          onClick={() => handleNavClick(item.id)}
                        />
                      ))}
                    </>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border bg-background">
                  {isAuthenticated ? (
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleLogout}
                    >
                      <LogOut size={18} />
                      Sign out
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      className="w-full gap-2"
                      onClick={handleLogin}
                    >
                      <LogIn size={18} />
                      Sign in
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>
    );
  }

  // ─── Desktop ───
  return (
    <TooltipProvider>
      <header
        className="glass-panel fixed top-6 left-1/2 transform -translate-x-1/2 z-40 rounded-lg px-1 py-1"
        role="navigation"
        aria-label="Main navigation"
      >
        <nav className="flex items-center">
          {/* Cortex Dropdown */}
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
                  <Brain size={20} className={cn("transition-colors", isCortexActive ? "text-primary" : "text-foreground/60")} />
                  <span className="font-medium">Cortex</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[200px] gap-1 p-2 bg-popover">
                    {CORTEX_NAV_ITEMS.map(item => (
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

          {/* Main Nav Items */}
          {mainNavItems.map(item => (
            <NavItemButton
              key={item.id}
              item={item}
              isActive={isActiveRoute(currentPath, item.to)}
              onClick={() => handleNavClick(item.id)}
            />
          ))}

          {/* User Dropdown (Profile + Settings + Logout) */}
          {isAuthenticated && userMenuItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-3 rounded-lg transition-base",
                    "hover:bg-primary/10 hover:text-primary",
                    isUserMenuActive ? "bg-primary/10 text-primary" : "text-foreground/80"
                  )}
                >
                  <User size={20} className={cn("transition-colors", isUserMenuActive ? "text-primary" : "text-foreground/60")} />
                  <ChevronDown size={14} className="text-foreground/40" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {userMenuItems.map(item => (
                  <DropdownMenuItem key={item.id} asChild>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer",
                        isActiveRoute(currentPath, item.to) && "text-primary"
                      )}
                      onClick={() => handleNavClick(item.id)}
                    >
                      <span className="text-foreground/60">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Status indicators (authenticated) */}
          {isAuthenticated && (
            <>
              <SyncStatusIndicator />
              <ConflictIndicator />
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

          {/* Login (unauthenticated) */}
          {!isAuthenticated && (
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
                <TooltipContent><p>Login</p></TooltipContent>
              </Tooltip>
            </>
          )}
        </nav>
      </header>
    </TooltipProvider>
  );
};

export default Navbar;
