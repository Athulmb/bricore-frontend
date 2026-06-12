import { Search, Bell, ChevronDown, LogOut, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useCurrency, currencies, CurrencyCode } from '../../context/CurrencyContext';
import { useUpdateSettings } from '../../hooks/useSettings';

export function Header() {
  const { user, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const updateSettings = useUpdateSettings();

  const handleCurrencyChange = async (code: CurrencyCode) => {
    setCurrency(code);
    await updateSettings.mutateAsync({ currency: code });
  };

  const handleLogout = () => {
    logout();
    // NOTE: No navigate('/login') here. logout() clears the user state,
    // which causes ProtectedRoute to render <Navigate to="/login" /> automatically.
  };

  const currentCurrency = currencies[currency];

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.initials || 'SA';

  return (
    <header className="h-14 glass-panel flex items-center justify-between px-5">
      {/* Left: Search */}
      <div className="flex items-center gap-3 flex-1 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full h-9 pl-9 pr-4 text-sm bg-white/[0.05] border border-white/10 rounded-lg text-white/80 placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#E8491F]/30 focus:border-[#E8491F]/40 transition-all"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">

        {/* Currency Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.06] border border-white/10 hover:bg-white/[0.10] hover:border-white/20 transition-all text-white/70">
              <Globe className="h-3.5 w-3.5 text-white/40" />
              <span className="text-xs font-bold text-white/80">{currentCurrency.symbol}</span>
              <span className="text-xs font-semibold uppercase text-white/50">{currentCurrency.code}</span>
              <ChevronDown className="h-3 w-3 text-white/40" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 shadow-xl bg-[#1a1a1e] border-white/10 text-white/80">
            <DropdownMenuLabel className="text-xs text-white/40 font-semibold uppercase tracking-wider">Currency</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            {(Object.values(currencies) as any[]).map((c) => (
              <DropdownMenuItem
                key={c.code}
                onClick={() => handleCurrencyChange(c.code as CurrencyCode)}
                className={`flex items-center justify-between text-sm cursor-pointer hover:bg-white/10 ${currency === c.code ? 'text-[#E8491F]' : 'text-white/70'}`}
              >
                <span>{c.label} ({c.code})</span>
                <span className="font-mono font-bold text-xs">{c.symbol}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <button className="relative h-8 w-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center hover:bg-white/[0.10] hover:border-white/20 transition-all text-white/50">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-[#E8491F] rounded-full ring-2 ring-[#0f0f10]" />
        </button>

        <div className="h-5 w-px bg-white/10 mx-1" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 h-9 pl-1 pr-3 rounded-xl hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all group">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#E8491F] to-[#C93D18] text-white flex items-center justify-center shadow-sm shadow-[#E8491F]/30 flex-shrink-0">
                <span className="text-[11px] font-bold">{userInitials}</span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[13px] font-semibold text-white/85 leading-none">{user?.name || 'System Admin'}</p>
                <p className="text-[10px] text-white/35 mt-0.5 leading-none capitalize">{user?.role || 'Admin'}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-white/30 group-hover:text-white/50 transition-colors" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 shadow-xl bg-[#1a1a1e] border-white/10 text-white/80">
            <div className="px-3 py-2.5 border-b border-white/10">
              <p className="text-sm font-semibold text-white/90">{user?.name || 'System Admin'}</p>
              <p className="text-xs text-white/40 capitalize">{user?.role || 'Admin'}</p>
            </div>
            <div className="py-1">
              <DropdownMenuItem className="text-sm cursor-pointer text-white/70 hover:bg-white/10 hover:text-white">Profile Settings</DropdownMenuItem>
              <DropdownMenuItem className="text-sm cursor-pointer text-white/70 hover:bg-white/10 hover:text-white">Team</DropdownMenuItem>
              <DropdownMenuItem className="text-sm cursor-pointer text-white/70 hover:bg-white/10 hover:text-white">Preferences</DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer text-sm"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick Logout button */}
        <button
          onClick={handleLogout}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
          title="Logout"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}