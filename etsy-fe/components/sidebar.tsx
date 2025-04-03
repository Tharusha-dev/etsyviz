import { MessageSquare, Users, Globe, Phone, Package, Store, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type SidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
};

export default function Sidebar({ activeTab, setActiveTab, user, collapsed = false, setCollapsed }: SidebarProps) {
  const tabs = [
    { id: "products", label: "Products", icon: Package, access: user?.prodaccess },
    { id: "categories", label: "Categories", icon: Package, access: user?.prodandstoreaccess },
    { id: "stores", label: "Stores", icon: Store, access: user?.storeaccess },
    { id: "users", label: "Users", icon: Users, access: user?.is_admin },
    { id: "uploads", label: "Uploads", icon: Package, access: true },
    // { id: 'whatsapp', label: 'Whatsapp', icon: Globe },
  ];

  const toggleCollapse = () => {
    if (setCollapsed) {
      setCollapsed(!collapsed);
    }
  };

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-white shadow-md transition-all duration-300 relative`}>
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
              title={collapsed ? tab.label : undefined}
            >
              <tab.icon className="w-5 h-5" />
              {!collapsed && <span>{tab.label}</span>}
            </button>
          )
        ))}
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
      
      <button 
        onClick={toggleCollapse}
        className="absolute right-[-12px] top-4 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
      >
        {collapsed ? 
          <ChevronRight className="w-4 h-4 text-gray-600" /> : 
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        }
      </button>
    </aside>
  );
}
