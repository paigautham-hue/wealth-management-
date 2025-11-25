import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X, Home, Briefcase, TrendingUp, DollarSign, BarChart3, Brain, CreditCard, Calculator, Users, PieChart, Coins, LineChart } from 'lucide-react';
import { APP_TITLE } from '@/const';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
  { label: 'Portfolio', href: '/portfolio', icon: <Briefcase className="h-4 w-4" /> },
  { label: 'Analytics', href: '/analytics', icon: <BarChart3 className="h-4 w-4" /> },
  { label: 'The Oracle', href: '/oracle', icon: <TrendingUp className="h-4 w-4" /> },
  { label: 'AI Advisor', href: '/wealth-advisor', icon: <Brain className="h-4 w-4" /> },
  { label: 'LRS Tracking', href: '/lrs', icon: <DollarSign className="h-4 w-4" /> },
  { label: 'Liabilities', href: '/liabilities', icon: <CreditCard className="h-4 w-4" /> },
  { label: 'Tax Optimizer', href: '/tax-optimizer', icon: <Calculator className="h-4 w-4" /> },
  { label: 'Risk Analytics', href: '/risk-analytics', icon: <PieChart className="h-4 w-4" /> },
  { label: 'Alternative Investments', href: '/alternative-investments', icon: <Coins className="h-4 w-4" /> },
  { label: 'Scenario Planner', href: '/scenario-planner', icon: <LineChart className="h-4 w-4" /> },
  { label: 'Family Office', href: '/family-office', icon: <Users className="h-4 w-4" /> },
  { label: 'Documents', href: '/documents', icon: <Briefcase className="h-4 w-4" /> },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="font-serif text-xl font-semibold">{APP_TITLE}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    {item.icon}
                    {item.label}
                  </a>
                </Link>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              AETHER V5 - Luxury Wealth Management
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
