"use client"

import { useState, useEffect } from "react"
import { parse } from "csv-parse"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table"
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
import { Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Store {
  store_id: number
  store_name: string
  store_url: string
  store_sub_title: string | null
  welcome_to_our_shop_text: string | null
  store_logo_url: string | null
  store_description: string | null
  most_recent_product_urls: string[]
  store_country: string | null
  star_seller: boolean
  store_last_updated: string
  store_reviews: number | null
  store_review_score: number | null
  on_etsy_since: string | null
  store_sales: number | null
  store_admirers: number | null
  number_of_store_products: number | null
  looking_for_more_urls: string[]
  facebook_url: string | null
  instagram_url: string | null
  pinterest_url: string | null
  tiktok_url: string | null
}

const BATCH_SIZE = 5 // Number of rows to process at once

// Define columns
const columns: ColumnDef<Store>[] = [
  {
    accessorKey: "store_id",
    header: "Store ID",
  },
  {
    accessorKey: "store_name",
    header: "Store Name",
  },
  {
    accessorKey: "store_url",
    header: "Store URL",
    cell: ({ row }) => (
      <a 
        href={row.getValue("store_url")} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        Link
      </a>
    ),
  },
  {
    accessorKey: "store_sub_title",
    header: "Subtitle",
  },
  {
    accessorKey: "welcome_to_our_shop_text",
    header: "Welcome Text",
  },
  {
    accessorKey: "store_logo_url",
    header: "Logo",
    cell: ({ row }) => {
      const url = row.getValue("store_logo_url")
      return url ? (
        <img 
          src={url as string} 
          alt="Store Logo" 
          className="w-16 h-16 object-cover"
        />
      ) : "N/A"
    },
  },
  {
    accessorKey: "store_description",
    header: "Description",
  },
  {
    accessorKey: "most_recent_product_urls",
    header: "Recent Products",
    cell: ({ row }) => {
      const urls = row.getValue("most_recent_product_urls") as string[]
      return urls?.length ? `${urls.length} products` : "None"
    },
  },
  {
    accessorKey: "store_country",
    header: "Country",
  },
  {
    accessorKey: "star_seller",
    header: "Star Seller",
    cell: ({ row }) => row.getValue("star_seller") ? "Yes" : "No",
  },
  {
    accessorKey: "store_last_updated",
    header: "Last Updated",
    cell: ({ row }) => {
      const date = row.getValue("store_last_updated")
      return date ? new Date(date as string).toLocaleDateString() : "N/A"
    },
  },
  {
    accessorKey: "store_reviews",
    header: "Reviews",
    cell: ({ row }) => row.getValue("store_reviews") ?? "N/A",
  },
  {
    accessorKey: "store_review_score",
    header: "Review Score",
    cell: ({ row }) => row.getValue("store_review_score") ?? "N/A",
  },
  {
    accessorKey: "on_etsy_since",
    header: "On Etsy Since",
    cell: ({ row }) => {
      const date = row.getValue("on_etsy_since")
      return date ? new Date(date as string).toLocaleDateString() : "N/A"
    },
  },
  {
    accessorKey: "store_sales",
    header: "Sales",
    cell: ({ row }) => row.getValue("store_sales") ?? "N/A",
  },
  {
    accessorKey: "store_admirers",
    header: "Admirers",
    cell: ({ row }) => row.getValue("store_admirers") ?? "N/A",
  },
  {
    accessorKey: "number_of_store_products",
    header: "Products",
    cell: ({ row }) => row.getValue("number_of_store_products") ?? "N/A",
  },
  {
    accessorKey: "looking_for_more_urls",
    header: "More URLs",
    cell: ({ row }) => {
      const urls = row.getValue("looking_for_more_urls") as string[]
      return urls?.length ? `${urls.length} links` : "None"
    },
  },
  {
    accessorKey: "facebook_url",
    header: "Facebook",
    cell: ({ row }) => {
      const url = row.getValue("facebook_url")
      return url ? (
        <a 
          href={url as string} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Link
        </a>
      ) : "N/A"
    },
  },
  {
    accessorKey: "instagram_url",
    header: "Instagram",
    cell: ({ row }) => {
      const url = row.getValue("instagram_url")
      return url ? (
        <a 
          href={url as string} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Link
        </a>
      ) : "N/A"
    },
  },
  {
    accessorKey: "pinterest_url",
    header: "Pinterest",
    cell: ({ row }) => {
      const url = row.getValue("pinterest_url")
      return url ? (
        <a 
          href={url as string} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Link
        </a>
      ) : "N/A"
    },
  },
  {
    accessorKey: "tiktok_url",
    header: "TikTok",
    cell: ({ row }) => {
      const url = row.getValue("tiktok_url")
      return url ? (
        <a 
          href={url as string} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Link
        </a>
      ) : "N/A"
    },
  },
]

export default function Product() {
  const [products, setProducts] = useState<Store[]>([])
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [totalRows, setTotalRows] = useState(0)
  const [processedRows, setProcessedRows] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Add state for pagination
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10, // Number of rows per page
  })

  const { toast } = useToast()

  // Fetch data function
  const fetchData = async (start: number, size: number) => {
    try {
      const response = await fetch(`${API_URL}/get-rows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'stores',
          start,
          count: size,
        }),
      })
      if (!response.ok) throw new Error('Failed to fetch data')
      const { data, totalCount } = await response.json()
      setTotalRows(totalCount)
      return data
    } catch (error) {
      console.error('Error fetching data:', error)
      return []
    }
  }

  // Initial data fetch
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      const initialData = await fetchData(0, pageSize)
      setProducts(initialData)
      setIsLoading(false)
    }
    loadInitialData()
  }, [])

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Add manual pagination
    manualPagination: true,
    pageCount: Math.ceil(totalRows / pageSize),
    state: {
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onPaginationChange: setPagination,
  })

  // Handle page changes
  useEffect(() => {
    const loadPageData = async () => {
      setIsLoading(true)
      const start = pageIndex * pageSize
      const newData = await fetchData(start, pageSize)
      setProducts(newData)
      setIsLoading(false)
    }
    loadPageData()
  }, [pageIndex, pageSize])

  const validateCSVColumns = (headers: string[]): boolean => {
    const requiredColumns = [
      "store_name",
      "store_url",
      "store_country",
      // Add other required columns as needed
    ]

    const missingColumns = requiredColumns.filter(col => !headers.includes(col))
    
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
          delimiter: ',',
        }, async (err, records) => {
          if (err) {
            console.error("Parsing error:", err)
            toast({
              variant: "destructive",
              title: "CSV Parsing Error",
              description: "Failed to parse the CSV file.",
            })
            setIsUploading(false)
            return
          }

          const headers = Object.keys(records[0] || {})
          if (!validateCSVColumns(headers)) {
            setIsUploading(false)
            return
          }

          let batch: Store[] = []
          let rowCount = 0
          const totalRows = records.length

          for (const record of records) {
            try {
              const processedRecord: Store = {
                ...record,
                store_id: record.store_id ? Number.parseInt(record.store_id) : null,
                store_reviews: record.store_reviews ? Number.parseInt(record.store_reviews) : null,
                store_review_score: record.store_review_score ? Number.parseFloat(record.store_review_score) : null,
                store_sales: record.store_sales ? Number.parseInt(record.store_sales) : null,
                store_admirers: record.store_admirers ? Number.parseInt(record.store_admirers) : null,
                number_of_store_products: record.number_of_store_products ? Number.parseInt(record.number_of_store_products) : null,
                star_seller: record.star_seller?.toLowerCase() === 'y' || record.star_seller === 'true' || record.star_seller === true,
                most_recent_product_urls: record.most_recent_product_urls ? record.most_recent_product_urls.split(',').filter(Boolean) : [],
                looking_for_more_urls: record.looking_for_more_urls ? record.looking_for_more_urls.split(',').filter(Boolean) : [],
              }
              
              batch.push(processedRecord)
              rowCount++

              if (batch.length === BATCH_SIZE) {
                await uploadBatch(batch)
                setProcessedRows(rowCount)
                setProgress((rowCount / totalRows) * 100)
                batch = []
              }
            } catch (error) {
              console.error("Error processing row:", error)
              toast({
                variant: "destructive",
                title: "Data Processing Error",
                description: `Error processing row ${rowCount + 1}: Invalid data format`,
              })
            }
          }

          // Upload remaining rows
          if (batch.length > 0) {
            await uploadBatch(batch)
            setProcessedRows(rowCount)
            setProgress(100)
          }

          setIsUploading(false)
        })
      } catch (error) {
        console.error("File processing error:", error)
        toast({
          variant: "destructive",
          title: "File Processing Error",
          description: "Failed to process CSV file. Please check the file format.",
        })
        setIsUploading(false)
      }
    }

    reader.readAsText(file)
  }

  const uploadBatch = async (batch: Store[]) => {
    try {
      const response = await fetch(`${API_URL}/add-store-batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      })

      if (!response.ok) {
        throw new Error("Failed to upload batch")
      }
      
      // Append new data to the existing products
      setProducts(prev => [...prev, ...batch])
    } catch (error) {
      console.error("Error uploading batch:", error)
    }
  }

  return (
    <div className="container">
      <Card>
        <CardHeader>
          <CardTitle>Product Uploader</CardTitle>
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
          <div className="flex items-center space-x-2">
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              className="flex-grow"
            />
            <Button disabled={isUploading}>
              <Upload className="mr-2 h-4 w-4" /> Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage() || isLoading}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pageIndex + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() || isLoading}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

