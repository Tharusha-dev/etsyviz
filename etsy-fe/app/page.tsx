"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import Products from "@/components/ui/products";
import Categories from "@/components/ui/categories";
import Stores from "@/components/ui/stores";
import Users from "@/components/ui/users";
import { getCookie, hasCookie, deleteCookie } from "cookies-next/client";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";
import Uploads from "@/components/ui/uploads";
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { parse } from "csv-parse"

interface UploadHistory {
  id: number
  file_type: string
  rows_processed: number
  time_added: string
  status: string
  error_message: string | null
}


export default function Home() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("products");
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([])
  const { toast } = useToast()
  const BATCH_SIZE = 5

  const [selectedType, setSelectedType] = useState<string>("product")

  // Add upload state at the parent level
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    progress: 0,
    totalRows: 0,
    processedRows: 0
  });

  const [navCollapsed, setNavCollapsed] = useState(false);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/upload-history`)
      if (!response.ok) throw new Error('Failed to fetch history')
      const data = await response.json()
      setUploadHistory(data)
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const validateCSVColumns = (headers: string[], type: string): boolean => {
    const requiredColumns: Record<string, string[]> = {
      product: ["product_id", "product_title"],
      store: ["store_name", "store_url", "store_country"],
      category: ["search_url", "category_tree", "product_url", "product_id"]
    }

    const missingColumns = requiredColumns[type].filter(col => !headers.includes(col))
    
    if (missingColumns.length > 0) {
      toast({
        variant: "destructive",
        title: "Invalid CSV Format",
        description: `Missing required columns: ${missingColumns.join(", ")}`,
      })
      return false
    }
    
    return true
  }

  const processFile = async (file: File) => {
    if (!selectedType) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file type before uploading",
      })
      return
    }

    setUploadState(prev => ({ ...prev, isUploading: true, progress: 0, processedRows: 0 }))

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        parse(text, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        }, async (err, records) => {
          if (err) {
            await logUpload(selectedType, 0, 'failed', err.message)
            toast({
              variant: "destructive",
              title: "CSV Parsing Error",
              description: "Failed to parse the CSV file.",
            })
            setUploadState(prev => ({ ...prev, isUploading: false }))
            return
          }

          const headers = Object.keys(records[0] || {})
          if (!validateCSVColumns(headers, selectedType)) {
            await logUpload(selectedType, 0, 'failed', 'Invalid columns')
            setUploadState(prev => ({ ...prev, isUploading: false }))
            return
          }

          const totalRows = records.length
          setUploadState(prev => ({ ...prev, totalRows }))
          
          // Process records in batches
          let processedCount = 0
          
          // Process in chunks of BATCH_SIZE
          for (let i = 0; i < totalRows; i += BATCH_SIZE) {
            const batchRecords = records.slice(i, i + BATCH_SIZE)
            const batch = batchRecords.map(record => {
              return selectedType === "product" 
                ? transformProduct(record) 
                : selectedType === "store" 
                  ? transformStore(record) 
                  : transformCategory(record)
            })
            
            try {
              await uploadBatch(batch, selectedType)
              processedCount += batch.length
              setUploadState(prev => ({
                ...prev,
                processedRows: processedCount,
                progress: (processedCount / totalRows) * 100
              }))
            } catch (error) {
              console.error("Error uploading batch:", error)
              // Continue with next batch even if there's an error
            }
          }

          await logUpload(selectedType, processedCount, 'success')
          await fetchHistory()
          setUploadState(prev => ({ ...prev, isUploading: false }))
        })
      } catch (error) {
        await logUpload(selectedType, 0, 'failed')
        toast({
          variant: "destructive",
          title: "File Processing Error",
          description: "Failed to process CSV file.",
        })
        setUploadState(prev => ({ ...prev, isUploading: false }))
      }
    }

    reader.readAsText(file)
  }
  function transformProduct(record: any) {
    return {
      ...record,
      date_listed: record.date_listed ? new Date(record.date_listed).toISOString() : null,
      last_24_hours: record.last_24_hours ? Number.parseInt(record.last_24_hours) : null,
      number_in_basket: record.number_in_basket ? Number.parseInt(record.number_in_basket) : null,
      product_reviews: record.product_reviews ? Number.parseInt(record.product_reviews) : null,
      rating_value: record.rating_value ? Number.parseFloat(record.rating_value) : null,
      number_of_favourties: record.number_of_favourties ? Number.parseInt(record.number_of_favourties) : null,
      price_usd: record.price_usd ? Number.parseInt(record.price_usd) : null,
      sale_price_usd: record.sale_price_usd ? Number.parseInt(record.sale_price_usd) : null,
      store_reviews: record.store_reviews ? Number.parseInt(record.store_reviews) : null,
      store_sales: record.store_sales ? Number.parseInt(record.store_sales) : null,
      store_admirers: record.store_admirers ? Number.parseInt(record.store_admirers) : null,
      number_of_store_products: record.number_of_store_products
        ? Number.parseInt(record.number_of_store_products)
        : null,
    }
  
  }
  
  function transformStore(record: any) {
    return {
      ...record,
      store_id: record.store_id ? Number.parseInt(record.store_id) : null,
      store_reviews: record.store_reviews ? Number.parseInt(record.store_reviews) : null,
      store_review_score: record.store_review_score ? Number.parseFloat(record.store_review_score) : null,
      store_sales: record.store_sales ? Number.parseInt(record.store_sales) : null,
      store_admirers: record.store_admirers ? Number.parseInt(record.store_admirers) : null,
      number_of_store_products: record.number_of_store_products ? Number.parseInt(record.number_of_store_products) : null,
      star_seller: record.star_seller?.toLowerCase() === 'y' || record.star_seller === 'true' ||record.star_seller === 'True' || record.star_seller === true,
      most_recent_product_urls: record.most_recent_product_urls ? record.most_recent_product_urls.split(',').filter(Boolean) : [],
      looking_for_more_urls: record.looking_for_more_urls ? record.looking_for_more_urls.split(',').filter(Boolean) : [],
    }
  }
  
  function transformCategory(record: any) {
    return {
      ...record,
      is_ad: record.is_ad?.toLowerCase() === 'y' || record.is_ad === 'true' || record.is_ad === true,
      star_seller: record.star_seller?.toLowerCase() === 'y' || record.star_seller === 'true' || record.star_seller === true,
      store_reviews_number: record.store_reviews_number ? Number.parseInt(record.store_reviews_number) : null,
      store_reviews_score: record.store_reviews_score ? Number.parseFloat(record.store_reviews_score) : null,
  
    }}
  const uploadBatch = async (batch: any[], type: string) => {
    const endpoint = `${API_URL}/add-${type}-batch`
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    })

    if (!response.ok) throw new Error("Failed to upload batch")
  }

  const logUpload = async (fileType: string, rowsProcessed: number, status: string, errorMessage?: string) => {
    try {
      await fetch(`${API_URL}/upload-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_type: fileType,
          rows_processed: rowsProcessed,
          status,
          error_message: errorMessage
        }),
      })
    } catch (error) {
      console.error("Error logging upload:", error)
    }
  }


  async function getUser() {
    let res = await fetch(`${API_URL}/get-user`, {
      headers: {
        auth: `${getCookie("userToken")}`,
      },
    });

    const data = await res.json();

    if (data?.relogin) {
      deleteCookie("userToken");

      router.push("/login");
    }

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
     {user && <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        collapsed={navCollapsed}
        setCollapsed={setNavCollapsed}
      />}
     {uploadState.isUploading && (
          <div className="mb-4 p-4 bg-white rounded-lg shadow">
            <div className="space-y-2">
              <Progress value={uploadState.progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Uploading... {uploadState.processedRows} of {uploadState.totalRows} rows ({Math.round(uploadState.progress)}%)
              </p>
            </div>
          </div>
        )}
      <main className={`flex-1 p-6 overflow-auto ${navCollapsed ? 'ml-16' : ''}`}>
        {activeTab === "products" && user && (user as any)?.prodaccess && <Products />}
        {activeTab === "categories" && user && (user as any)?.prodandstoreaccess && <Categories />}
        {activeTab === "stores" && user && (user as any)?.storeaccess && <Stores />}
        {activeTab === "uploads" && (
          <Uploads 
            uploadState={uploadState}
            setUploadState={setUploadState}
            setUploadHistory = {setUploadHistory}
            processFile={processFile}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            uploadHistory={uploadHistory}
          />
        )}
        {isAdmin && <>{activeTab === "users" && <Users />}</>}
      </main>
    </div>
  );
}

