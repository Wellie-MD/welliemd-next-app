import { 
  Home, 
  Calendar, 
  MessageSquare, 
  User, 
  FileText, 
  Pill,
  TestTube,
  HelpCircle
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

const navigationItems = [
  { icon: Home, label: "Dashboard", id: "dashboard" },
  { icon: Pill, label: "Treatments", id: "treatments" },
  { icon: Pill, label: "Prescriptions", id: "prescriptions" },
  { icon: MessageSquare, label: "Messenger", id: "messages" },
  { icon: User, label: "Account", id: "profile" },
  { icon: TestTube, label: "Labs", id: "lab-results" },
];

const bottomItems = [
  { icon: HelpCircle, label: "Help", id: "help" },
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const NavItem = ({ item }: { item: typeof navigationItems[0] }) => {
    const Icon = item.icon;
    const isActive = activeSection === item.id;
    
    return (
      <li>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50",
            isActive && "text-blue-600 bg-blue-50"
          )}
          onClick={() => onSectionChange(item.id)}
        >
          <Icon className="h-4 w-4 mr-3" />
          <span>{item.label}</span>
        </Button>
      </li>
    );
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-4">
        <p className="text-sm text-gray-500 uppercase tracking-wide">MENU</p>
      </div>
      
      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <ul className="space-y-1">
          {bottomItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </ul>
      </div>
    </div>
  );
}