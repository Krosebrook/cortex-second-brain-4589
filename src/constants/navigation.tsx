/**
 * Navigation configuration
 * Centralized navigation items for the application
 */

import {
  Brain,
  Table,
  Search,
  Upload,
  User,
  Settings,
  Info,
  HelpCircle,
  Code,
  Activity,
  Download,
  ShieldAlert,
} from 'lucide-react';
import { ROUTES } from './index';
import type { NavItem } from '@/types';

// ============================================
// Public Navigation (Cortex submenu)
// ============================================

export const CORTEX_NAV_ITEMS: NavItem[] = [
  {
    to: ROUTES.HOME,
    icon: <Info size={18} />,
    label: 'What',
    id: 'what',
  },
  {
    to: ROUTES.WHY,
    icon: <HelpCircle size={18} />,
    label: 'Why',
    id: 'why',
  },
  {
    to: ROUTES.HOW,
    icon: <Code size={18} />,
    label: 'How',
    id: 'how',
  },
];

// ============================================
// Authenticated Navigation
// ============================================

export const AUTH_NAV_ITEMS: NavItem[] = [
  {
    to: ROUTES.DASHBOARD,
    icon: <Brain size={20} />,
    label: 'Dashboard',
    id: 'dashboard',
    protected: true,
  },
  {
    to: ROUTES.MANAGE,
    icon: <Table size={20} />,
    label: 'Manage',
    id: 'manage',
    protected: true,
  },
  {
    to: ROUTES.TESSA,
    icon: <Brain size={20} />,
    label: 'Tessa',
    id: 'tessa',
    protected: true,
  },
  {
    to: ROUTES.SEARCH,
    icon: <Search size={20} />,
    label: 'Chat with Tessa',
    id: 'search',
    protected: true,
  },
  {
    to: ROUTES.IMPORT,
    icon: <Upload size={20} />,
    label: 'Import',
    id: 'import',
    protected: true,
  },
  {
    to: ROUTES.PROFILE,
    icon: <User size={20} />,
    label: 'Profile',
    id: 'profile',
    protected: true,
  },
  {
    to: ROUTES.SETTINGS,
    icon: <Settings size={20} />,
    label: 'Settings',
    id: 'settings',
    protected: true,
  },
];

// Admin-only navigation item
export const ADMIN_NAV_ITEM: NavItem = {
  to: '/admin',
  icon: <ShieldAlert size={20} />,
  label: 'Admin',
  id: 'admin',
  protected: true,
};

// ============================================
// Utility Navigation (always visible)
// ============================================

export const UTILITY_NAV_ITEMS: NavItem[] = [
  {
    to: ROUTES.STATUS,
    icon: <Activity size={20} />,
    label: 'Status',
    id: 'status',
  },
  {
    to: ROUTES.INSTALL,
    icon: <Download size={20} />,
    label: 'Install App',
    id: 'install',
  },
];

// ============================================
// Combined Navigation Helpers
// ============================================

export const getNavItems = (isAuthenticated: boolean): NavItem[] => {
  return isAuthenticated ? AUTH_NAV_ITEMS : [];
};

export const isActiveRoute = (currentPath: string, itemPath: string): boolean => {
  if (itemPath === '/') {
    return currentPath === '/';
  }
  return currentPath.startsWith(itemPath);
};
