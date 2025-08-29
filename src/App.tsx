import { useState } from "react";
import { TestTube } from "lucide-react";
import { Button } from "./components/ui/button";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Treatments } from "./components/Treatments";
import { Prescriptions } from "./components/Prescriptions";
import { Messages } from "./components/Messages";
import { Profile } from "./components/Profile";

// Component for Lab Results
const LabResults = () => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Lab Results</h1>
        <p className="text-gray-600">View your laboratory test results and reports</p>
      </div>
    </div>
    
    <div className="text-center py-12">
      <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <TestTube className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No lab results available</h3>
      <p className="text-gray-600">Your lab results will appear here when available.</p>
    </div>
  </div>
);

// Component for Help
const Help = () => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Help & Support</h1>
        <p className="text-gray-600">Get help with using the patient portal</p>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="font-semibold text-gray-900 mb-2">Frequently Asked Questions</h3>
        <p className="text-gray-600 text-sm mb-4">Find answers to common questions about using the portal.</p>
        <Button variant="outline">View FAQs</Button>
      </div>
      
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="font-semibold text-gray-900 mb-2">Contact Support</h3>
        <p className="text-gray-600 text-sm mb-4">Need help? Our support team is here to assist you.</p>
        <Button variant="outline">Contact Us</Button>
      </div>
    </div>
  </div>
);

export default function App() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />;
      case "treatments":
        return <Treatments />;
      case "prescriptions":
        return <Prescriptions />;
      case "messages":
        return <Messages />;
      case "profile":
        return <Profile />;
      case "lab-results":
        return <LabResults />;
      case "help":
        return <Help />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}