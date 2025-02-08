"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import Products from "@/components/ui/products";
import Categories from "@/components/ui/categories";
import Stores from "@/components/ui/stores";
import Users from "@/components/ui/users";
import { getCookie, hasCookie } from "cookies-next/client";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";

export default function Home() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("products");
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  async function getUser() {
    let res = await fetch(`${API_URL}/get-user`, {
      headers: {
        auth: `${getCookie("userToken")}`,
      },
    });

    const data = await res.json();
    if (data?.length > 0) {
      setUser(data[0]);

      setIsAdmin(data?.[0]?.is_admin);
    } else {
      // router.push("/login");
      setIsAdmin(false);
    }
  }

  useEffect(() => {
    if (hasCookie("userToken") && getCookie("userToken") !== "undefined") {
      getUser();
    } else {
      router.push("/login");
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
     {user && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user}/>}
      <main className="flex-1 p-6 overflow-auto">
        {activeTab === "products" && user && (user as any)?.prodaccess && <Products />}
        {activeTab === "categories" && user && (user as any)?.prodandstoreaccess && <Categories />}
        {activeTab === "stores" && user && (user as any)?.storeaccess && <Stores />}
        {isAdmin && <>{activeTab === "users" && <Users />}</>}
      </main>
    </div>
  );
}
