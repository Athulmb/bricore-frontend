import { Search, Bell, Plus, ChevronDown, AlertTriangle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
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
import { Badge } from '../ui/badge';
import { useCurrency, currencies, CurrencyCode } from '../../context/CurrencyContext';
import { useUpdateSettings } from '../../hooks/useSettings';
import { Globe } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const updateSettings = useUpdateSettings();
  const navigate = useNavigate();

  const handleCurrencyChange = async (code: CurrencyCode) => {
    // Update local state first for immediate UI response
    setCurrency(code);
    // Update backend settings
    await updateSettings.mutateAsync({ currency: code });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentCurrency = currencies[currency];

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-10 bg-white border-gray-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600 px-2 h-9">
              <span className="font-semibold text-sm">{currentCurrency.symbol}</span>
              <span className="text-xs font-medium uppercase">{currentCurrency.code}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Change Currency</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.values(currencies) as any[]).map((c) => (
              <DropdownMenuItem
                key={c.code}
                onClick={() => handleCurrencyChange(c.code as CurrencyCode)}
                className="flex items-center justify-between"
              >
                <span>{c.label} ({c.code})</span>
                <span className="font-mono font-bold">{c.symbol}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-6 w-px bg-gray-200" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="h-8 w-8 rounded-full bg-[#974926] text-white flex items-center justify-center">
                <span className="text-sm">{user?.initials || 'JD'}</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{user?.name || 'John Doe'}</p>
                <p className="text-xs text-gray-500">{user?.role || 'Operations Manager'}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuItem>Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}