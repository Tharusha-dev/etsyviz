import { MessageSquare, Users, Globe, Phone, Package, Store } from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
};

export default function Sidebar({ activeTab, setActiveTab, user }: SidebarProps) {
  const tabs = [
    { id: "products", label: "Products", icon: Package, access: user?.prodaccess },
    { id: "categories", label: "Categories", icon: Package, access: user?.prodandstoreaccess },
    { id: "stores", label: "Stores", icon: Store, access: user?.storeaccess },
    { id: "users", label: "Users", icon: Users, access: user?.is_admin },
    { id: "uploads", label: "Uploads", icon: Package, access: true },
    // { id: 'whatsapp', label: 'Whatsapp', icon: Globe },
  ];

  return (
    <aside className="w-64 bg-white shadow-md">
      <nav className="flex flex-col p-4">
        {tabs.map((tab) => (
            tab.access && (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-md text-left transition-colors mb-[2%]",
              activeTab === tab.id
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        )))}
{/* 
        {socket && (
          <button
            key="whatsapp"
            onClick={() => setActiveTab("whatsapp")}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-md text-left transition-colors mb-[2%]",
              activeTab === "whatsapp"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Phone className="w-5 h-5" />
            <span>Whatsapp</span>
          </button>
        )} */}
    
      </nav>
    </aside>
  );
}
