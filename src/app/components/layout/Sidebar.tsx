import { Link, useLocation } from 'react-router';
import logo from '../../../assets/logo-02 1.png';
import {
  LayoutDashboard,
  TruckIcon,
  Hammer,
  Beaker,
  FileCheck,
  Package,
  ShipIcon,
  Scale,
  Navigation,
  FileText,
  DollarSign,
  Archive,
  BarChart3,
  Users,
  Settings,
  Phone,
  Building2,
  ChevronDown,
  ChevronRight,
  Quote,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useState } from 'react';

const navGroups = [
  {
    groupLabel: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    groupLabel: 'Operations',
    items: [
      {
        path: '/yard-intake',
        label: 'Yard Intake',
        icon: TruckIcon,
        children: [
          { path: '/yard-intake', label: 'Intake Dashboard' },
          { path: '/client-management?type=Supplier', label: 'Companies' },
          { path: '/vehicle-management', label: 'Vehicles' },
          { path: '/material-management', label: 'Material Types' },
        ],
      },
      { path: '/crushing-processing', label: 'Crushing & Processing', icon: Hammer },
      { path: '/assaying-testing', label: 'Assaying & Testing', icon: Beaker },
      { path: '/inspection-certification', label: 'Inspection & Cert.', icon: FileCheck },
      { path: '/bagging-warehousing', label: 'Bagging & Warehousing', icon: Package },
      { path: '/loading-dispatch', label: 'Loading & Dispatch', icon: ShipIcon },
    ],
  },
  {
    groupLabel: 'Commerce',
    items: [
      { path: '/export-documentation', label: 'Export Documentation', icon: FileText },
      { path: '/invoices-financials', label: 'Invoices & Financials', icon: DollarSign },
      { path: '/quotations', label: 'Quotations', icon: Quote },
      { path: '/weighbridge', label: 'Weighbridge', icon: Scale },
      { path: '/transportation', label: 'Transportation', icon: Navigation },
      { path: '/inventory-traceability', label: 'Inventory & Traceability', icon: Archive },
    ],
  },
  {
    groupLabel: 'Management',
    items: [
      { path: '/reports', label: 'Reports', icon: BarChart3 },
      { path: '/client-management', label: 'Client Management', icon: Building2 },
      { path: '/user-management', label: 'User Management', icon: Users },
      { path: '/settings', label: 'Settings', icon: Settings },
      { path: '/contact-us', label: 'Contact Us', icon: Phone },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Yard Intake']);
  const [collapsed, setCollapsed] = useState(false);

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  return (
    <aside
      className={`${collapsed ? 'w-[68px]' : 'w-64'} h-screen bg-[#0D0D0D] text-white flex flex-col transition-all duration-300 ease-in-out relative border-r border-white/5`}
    >
      {/* Logo Header */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/5 ${collapsed ? 'justify-center' : ''}`}>
        <img src={logo} alt="Britcore" className="h-9 w-auto flex-shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Operations</p>
            <p className="text-[10px] text-white/40 tracking-widest">Platform</p>
          </div>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-[72px] z-10 h-6 w-6 rounded-full bg-[#E8491F] text-white flex items-center justify-center shadow-lg shadow-[#E8491F]/30 hover:bg-[#C93D18] transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeftOpen className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
      </button>

      {/* Navigation — scrollable, fills remaining height */}
      <nav className="flex-1 min-h-0 overflow-y-auto py-3 space-y-0.5">
        {navGroups.map((group) => (
          <div key={group.groupLabel} className="mb-2">
            {/* Group Label */}
            {!collapsed && (
              <p className="px-4 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-white/25 select-none">
                {group.groupLabel}
              </p>
            )}
            {collapsed && <div className="mx-3 my-2 h-px bg-white/10" />}

            {group.items.map((item) => {
              const Icon = item.icon;
              const hasChildren = !!(item as any).children;
              const isExpanded = expandedItems.includes(item.label);
              const isActive = !hasChildren && location.pathname === item.path;
              const isChildActive = hasChildren &&
                (item as any).children.some(
                  (c: any) => location.pathname === c.path.split('?')[0]
                );

              return (
                <div key={item.label}>
                  {hasChildren ? (
                    <button
                      onClick={() => toggleExpand(item.label)}
                      title={collapsed ? item.label : undefined}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 mx-1 rounded-lg transition-all duration-150 text-left
                        ${collapsed ? 'justify-center w-[calc(100%-8px)]' : ''}
                        ${isChildActive || isExpanded
                          ? 'bg-white/8 text-white'
                          : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                        }
                      `}
                    >
                      <div className={`flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center transition-all
                        ${isChildActive ? 'bg-[#E8491F] shadow-sm shadow-[#E8491F]/40' : 'bg-white/5'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {!collapsed && (
                        <>
                          <span className="text-[13px] font-medium flex-1">{item.label}</span>
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={`
                        flex items-center gap-3 px-3 py-2 mx-1 rounded-lg transition-all duration-150
                        ${collapsed ? 'justify-center' : ''}
                        ${isActive
                          ? 'bg-[#E8491F]/15 text-white'
                          : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                        }
                      `}
                    >
                      <div className={`flex-shrink-0 h-8 w-8 rounded-md flex items-center justify-center transition-all
                        ${isActive ? 'bg-[#E8491F] shadow-sm shadow-[#E8491F]/40' : 'bg-white/5'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {!collapsed && (
                        <span className={`text-[13px] font-medium ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                      )}
                      {isActive && !collapsed && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#E8491F]" />
                      )}
                    </Link>
                  )}

                  {/* Children dropdown */}
                  {hasChildren && isExpanded && !collapsed && (
                    <div className="ml-4 mt-0.5 mb-1 border-l border-white/10 pl-2 space-y-0.5">
                      {(item as any).children.map((child: any) => {
                        const childActive = location.pathname === child.path.split('?')[0];
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] transition-all
                              ${childActive
                                ? 'text-[#FF6B45] font-semibold bg-[#E8491F]/10'
                                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                              }`}
                          >
                            <ChevronRight className="h-2.5 w-2.5 flex-shrink-0 opacity-50" />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[10px] text-white/25 font-medium">v2.4.1 · © 2026 Britcore</p>
          </div>
        </div>
      )}
    </aside>
  );
}