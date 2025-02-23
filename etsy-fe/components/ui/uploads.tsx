"use client"

import { useState, useEffect } from "react"
import { parse } from "csv-parse"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { API_URL } from "@/lib/config"
import { useToast } from "@/hooks/use-toast"

interface UploadHistory {
  id: number
  file_type: string
  rows_processed: number
  time_added: string
  status: string
  error_message: string | null
}

const BATCH_SIZE = 5

export default function Uploads() {
  const [selectedType, setSelectedType] = useState<string>("product")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [totalRows, setTotalRows] = useState(0)
  const [processedRows, setProcessedRows] = useState(0)
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([])
  const { toast } = useToast()

  // Fetch upload history
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

    setIsUploading(true)
    setProgress(0)
    setProcessedRows(0)

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
            setIsUploading(false)
            return
          }

          const headers = Object.keys(records[0] || {})
          if (!validateCSVColumns(headers, selectedType)) {
            await logUpload(selectedType, 0, 'failed', 'Invalid columns')
            setIsUploading(false)
            return
          }

          let batch = []
          let rowCount = 0
          const totalRows = records.length
          setTotalRows(totalRows)

          for (const record of records) {
            const transformedRecord = selectedType === "product" ? transformProduct(record) : selectedType === "store" ? transformStore(record) : transformCategory(record)
            batch.push(transformedRecord)
            rowCount++

            if (batch.length === BATCH_SIZE) {
              try {
                await uploadBatch(batch, selectedType)
                setProcessedRows(rowCount)
                setProgress((rowCount / totalRows) * 100)
                batch = []
              } catch (error) {
                console.error("Error uploading batch:", error)
              }
            }
          }

          if (batch.length > 0) {
            try {
              await uploadBatch(batch, selectedType)
              setProcessedRows(rowCount)
              setProgress(100)
            } catch (error) {
              console.error("Error uploading final batch:", error)
            }
          }

          await logUpload(selectedType, rowCount, 'success')
          await fetchHistory()
          setIsUploading(false)
        })
      } catch (error) {
        await logUpload(selectedType, 0, 'failed')
        toast({
          variant: "destructive",
          title: "File Processing Error",
          description: "Failed to process CSV file.",
        })
        setIsUploading(false)
      }
    }

    reader.readAsText(file)
  }

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file to upload",
      })
      return
    }

    if (!selectedType) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file type before uploading",
      })
      return
    }

    await processFile(selectedFile)
  }

  return (
    <div className="container">
      <Card>
        <CardHeader>
          <CardTitle>Upload Data</CardTitle>
        </CardHeader>
        <CardContent>
          {isUploading && (
            <div className="space-y-2 mb-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Processed {processedRows} of {totalRows} rows ({Math.round(progress)}%)
              </p>
            </div>
          )}
          <div className="flex items-center space-x-4 mb-4">
            <Select 
              defaultValue="product" 
              onValueChange={setSelectedType}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select file type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="store">Stores</SelectItem>
                <SelectItem value="category">Categories</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="flex-grow"
            />
            <Button 
              onClick={handleUpload}
              disabled={isUploading || !selectedFile}
            >
              Upload
            </Button>
          </div>
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              Selected file: {selectedFile.name}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Upload History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Rows Processed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploadHistory.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="capitalize">{entry.file_type}</TableCell>
                  <TableCell>{new Date(entry.time_added).toLocaleString()}</TableCell>
                  <TableCell>{entry.rows_processed}</TableCell>
                  <TableCell className="capitalize">{entry.status}</TableCell>
                  <TableCell>{entry.error_message || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}


function transformProduct(record: any) {
  return {
    ...record,
    date_listed: record.date_listed ? new Date(record.date_listed).toISOString() : null,
    last_24_hours: record.last_24_hours ? Number.parseInt(record.last_24_hours) : null,
    number_in_basket: record.number_in_basket ? Number.parseInt(record.number_in_basket) : null,
    product_reviews: record.product_reviews ? Number.parseInt(record.product_reviews) : null,
    ratingValue: record.ratingValue ? Number.parseFloat(record.ratingValue) : null,
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