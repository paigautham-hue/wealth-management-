import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import FamilyOffice from "@/pages/FamilyOffice";
import Liabilities from "@/pages/Liabilities";
import TaxOptimizer from "@/pages/TaxOptimizer";
import RiskAnalytics from "@/pages/RiskAnalytics";
import AlternativeInvestments from "@/pages/AlternativeInvestments";
import ScenarioPlanner from "@/pages/ScenarioPlanner";
import Portfolio from "./pages/Portfolio";
import AddAsset from "./pages/AddAsset";
import LRS from "./pages/LRS";
import Oracle from "./pages/Oracle";
import Documents from "./pages/Documents";
import Analytics from "./pages/Analytics";
import WealthAdvisor from "./pages/WealthAdvisor";
import { PWAInstallBanner } from "./components/PWAInstallBanner";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/family-office" component={FamilyOffice} />
      <Route path="/liabilities" component={Liabilities} />
      <Route path="/tax-optimizer" component={TaxOptimizer} />
      <Route path="/risk-analytics" component={RiskAnalytics} />
      <Route path="/alternative-investments" component={AlternativeInvestments} />
      <Route path="/scenario-planner" component={ScenarioPlanner} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/portfolio/add" component={AddAsset} />
      <Route path="/lrs" component={LRS} />
      <Route path="/oracle" component={Oracle} />
      <Route path="/documents" component={Documents} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/wealth-advisor" component={WealthAdvisor} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * AETHER V5 - Main App Component
 * Luxury wealth management platform with Alabaster design system
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <PWAInstallBanner />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
