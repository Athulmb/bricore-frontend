import { Link, useLocation } from 'react-router';
import logo from 'figma:asset/9da5b009b8b3fc0b9c283aeaa1449171e6c6a89d.png';
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
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  {
    path: '/yard-intake',
    label: 'Yard Intake',
    icon: TruckIcon,
    children: [
      { path: '/yard-intake', label: 'Intake Dashboard' },
      { path: '/client-management?type=Supplier', label: 'Companies' },
      { path: '/vehicle-management', label: 'Vehicles' },
      { path: '/material-management', label: 'Material Types' },
    ]
  },
  { path: '/crushing-processing', label: 'Crushing & Processing', icon: Hammer },
  { path: '/assaying-testing', label: 'Assaying & Testing', icon: Beaker },
  { path: '/inspection-certification', label: 'Inspection & Certification', icon: FileCheck },
  { path: '/bagging-warehousing', label: 'Bagging & Warehousing', icon: Package },
  { path: '/loading-dispatch', label: 'Loading & Dispatch', icon: ShipIcon },
  { path: '/export-documentation', label: 'Export Documentation', icon: FileText },
  { path: '/invoices-financials', label: 'Invoices & Financials', icon: DollarSign },
  { path: '/quotations', label: 'Quotations', icon: FileText },
  { path: '/weighbridge', label: 'Weighbridge', icon: Scale },
  { path: '/transportation', label: 'Transportation', icon: Navigation },
  { path: '/inventory-traceability', label: 'Inventory & Traceability', icon: Archive },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/client-management', label: 'Client Management', icon: Building2 },
  { path: '/user-management', label: 'User Management', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/contact-us', label: 'Contact Us', icon: Phone },
];

export function Sidebar() {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Yard Intake']);

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(i => i !== label)
        : [...prev, label]
    );
  };

  return (
    <aside className="w-64 bg-[#203727] text-white flex flex-col">
      <div className="p-6 border-b border-[#2d4d39]">
        <img src={logo} alt="GME Interchange" className="h-12 w-auto mb-2" />
        <p className="text-xs text-slate-300 mt-1">Operations Platform</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path && !item.children;
          const isExpanded = expandedItems.includes(item.label);
          const hasChildren = !!item.children;

          return (
            <div key={item.label}>
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={`w-full flex items-center justify-between px-6 py-2.5 transition-colors text-slate-300 hover:bg-[#2d4d39] hover:text-white ${isExpanded ? 'bg-[#2d4d39]/50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-6 py-2.5 transition-colors ${isActive
                    ? 'bg-[#974926] text-white border-l-4 border-[#b85a2e]'
                    : 'text-slate-300 hover:bg-[#2d4d39] hover:text-white'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )}

              {hasChildren && isExpanded && (
                <div className="bg-[#1a2f21] py-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      className={`flex items-center pl-14 pr-6 py-2 text-xs transition-colors ${location.pathname === (child.path.split('?')[0])
                        ? 'text-[#f08b5e] font-medium'
                        : 'text-slate-400 hover:text-white hover:bg-[#2d4d39]'
                        }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#2d4d39] text-xs text-slate-400">
        <p>Version 2.4.1</p>
        <p className="mt-1">© 2026 GME Interchange</p>
      </div>
    </aside>
  );
}