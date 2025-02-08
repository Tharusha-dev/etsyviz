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
import ExpandableText from "./expandableText"
import SettingsDropdown from "./settings"

interface Product {
  time_scraped: string
  cid: string
  pjson: string
  productJ: string
  breadcrumbJ: string
  category_name: string
  category_tree: string
  category_url: string
  product_url: string
  product_id: string
  product_id_new: string
  product_title: string
  brand: string
  image: string
  last_24_hours: number
  number_in_basket: number
  product_reviews: number
  ratingValue: number
  date_of_latest_review: string
  date_listed: string
  number_of_favourties: number
  related_searches: string
  star_seller: string
  ad: string
  digital_download: string
  price_usd: number
  sale_price_usd: number
  store_reviews: number
  store_name: string
  store_url: string
  store_country: string
  on_etsy_since: string
  store_sales: number
  store_admirers: number
  number_of_store_products: number
  facebook_url: string
  instagram_url: string
  pinterest_url: string
  tiktok_url: string
}

const BATCH_SIZE = 5 // Number of rows to process at once

// Define columns
const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "time_scraped",
    header: "Time Scraped",
  },
  {
    accessorKey: "cid",
    header: "CID",
  },
  {
    accessorKey: "pjson",
    header: "Product JSON",
    cell: ({ row }) => (
      <ExpandableText text={row.getValue("pjson")} />
    ),
  },
  {
    accessorKey: "productJ",
    header: "Product J",
    cell: ({ row }) => (
      <ExpandableText text={row.getValue("productJ")} />
    ),
  },
  {
    accessorKey: "breadcrumbJ",
    header: "Breadcrumb",
    cell: ({ row }) => (
      <ExpandableText text={row.getValue("breadcrumbJ")} />
    ),
  },
  {
    accessorKey: "category_name",
    header: "Category Name",
  },
  {
    accessorKey: "category_tree",
    header: "Category Tree",
    cell: ({ row }) => (
      <ExpandableText text={row.getValue("category_tree")} />
    ),
  },
  {
    accessorKey: "category_url",
    header: "Category URL",
  },
  {
    accessorKey: "product_url",
    header: "Product URL",
    cell: ({ row }) => (
      <a 
        href={row.getValue("product_url")} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        Link
      </a>
    ),
  },
  {
    accessorKey: "product_id",
    header: "Product ID",
  },
  {
    accessorKey: "product_id_new",
    header: "New Product ID",
  },
  {
    accessorKey: "product_title",
    header: "Product Title",
    cell: ({ row }) => (
      <ExpandableText text={row.getValue("product_title")} />
    ),
  },
  {
    accessorKey: "brand",
    header: "Brand",
  },
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => (
      <img 
        src={row.getValue("image")} 
        alt={row.getValue("product_title")} 
        className="w-16 h-16 object-cover"
      />
    ),
  },
  {
    accessorKey: "last_24_hours",
    header: "Last 24 Hours",
    cell: ({ row }) => row.getValue("last_24_hours") ?? "N/A",
  },
  {
    accessorKey: "number_in_basket",
    header: "In Basket",
    cell: ({ row }) => row.getValue("number_in_basket") ?? "N/A",
  },
  {
    accessorKey: "product_reviews",
    header: "Reviews",
    cell: ({ row }) => row.getValue("product_reviews") ?? "N/A",
  },
  {
    accessorKey: "ratingValue",
    header: "Rating",
    cell: ({ row }) => row.getValue("ratingValue") ?? "N/A",
  },
  {
    accessorKey: "date_of_latest_review",
    header: "Latest Review Date",
  },
  {
    accessorKey: "date_listed",
    header: "Date Listed",
  },
  {
    accessorKey: "number_of_favourties",
    header: "Favorites",
    cell: ({ row }) => row.getValue("number_of_favourties") ?? "N/A",
  },
  {
    accessorKey: "related_searches",
    header: "Related Searches",
    cell: ({ row }) => (
      <ExpandableText text={row.getValue("related_searches")} />
    ),
  },
  {
    accessorKey: "star_seller",
    header: "Star Seller",
  },
  {
    accessorKey: "ad",
    header: "Ad",
  },
  {
    accessorKey: "digital_download",
    header: "Digital Download",
  },
  {
    accessorKey: "price_usd",
    header: "Price (USD)",
    cell: ({ row }) => {
      const price = row.getValue("price_usd")
      return price ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(price as number) : "N/A"
    },
  },
  {
    accessorKey: "sale_price_usd",
    header: "Sale Price (USD)",
    cell: ({ row }) => {
      const price = row.getValue("sale_price_usd")
      return price ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(price as number) : "N/A"
    },
  },
  {
    accessorKey: "store_reviews",
    header: "Store Reviews",
    cell: ({ row }) => row.getValue("store_reviews") ?? "N/A",
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
    accessorKey: "store_country",
    header: "Store Country",
  },
  {
    accessorKey: "on_etsy_since",
    header: "On Etsy Since",
  },
  {
    accessorKey: "store_sales",
    header: "Store Sales",
    cell: ({ row }) => row.getValue("store_sales") ?? "N/A",
  },
  {
    accessorKey: "store_admirers",
    header: "Store Admirers",
    cell: ({ row }) => row.getValue("store_admirers") ?? "N/A",
  },
  {
    accessorKey: "number_of_store_products",
    header: "Store Products",
    cell: ({ row }) => row.getValue("number_of_store_products") ?? "N/A",
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
  const [products, setProducts] = useState<Product[]>([])
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
          table: 'products',
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
      "time_scraped",
      "cid",
      "pjson",
      "productJ",
      "breadcrumbJ",
      "category_name",
      "category_tree",
      "category_url",
      "product_url",
      "product_id",
      "product_id_new",
      "product_title",
      // ... add other required columns
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
    // setProducts([])
    setProcessedRows(0)

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const parser = parse(text, {
          columns: true,
          skip_empty_lines: true,
        })

        console.log("parser", parser)

        // Get headers from the first row
        const headers = Object.keys(await parser[Symbol.asyncIterator]().next().then(result => result.value))
        
        if (!validateCSVColumns(headers)) {
          setIsUploading(false)
          return
        }

        let batch: Product[] = []
        let rowCount = 0

        for await (const record of parser) {
          try {
            batch.push({
              ...record,
              last_24_hours: record.last_24_hours ? Number.parseInt(record.last_24_hours) : null,
              number_in_basket: record.number_in_basket ? Number.parseInt(record.number_in_basket) : null,
              product_reviews: record.product_reviews ? Number.parseInt(record.product_reviews) : null,
              ratingValue: record.ratingValue ? Number.parseInt(record.ratingValue) : null,
              number_of_favourties: record.number_of_favourties ? Number.parseInt(record.number_of_favourties) : null,
              price_usd: record.price_usd ? Number.parseInt(record.price_usd) : null,
              sale_price_usd: record.sale_price_usd ? Number.parseInt(record.sale_price_usd) : null,
              store_reviews: record.store_reviews ? Number.parseInt(record.store_reviews) : null,
              store_sales: record.store_sales ? Number.parseInt(record.store_sales) : null,
              store_admirers: record.store_admirers ? Number.parseInt(record.store_admirers) : null,
              number_of_store_products: record.number_of_store_products
                ? Number.parseInt(record.number_of_store_products)
                : null,
            })
          } catch (error) {
            toast({
              variant: "destructive",
              title: "Data Processing Error",
              description: `Error processing row ${rowCount + 1}: Invalid data format`,
            })
            setIsUploading(false)
            return
          }

          rowCount++

          if (batch.length === BATCH_SIZE) {
            await uploadBatch(batch)
            setProducts((prev) => [...prev, ...batch])
            setProcessedRows(rowCount)
            setProgress((rowCount / totalRows) * 100)
            batch = []
          }
        }

        // Upload remaining rows
        if (batch.length > 0) {
          await uploadBatch(batch)
          setProducts((prev) => [...prev, ...batch])
          setProcessedRows(rowCount)
          setProgress(100)
        }

        setIsUploading(false)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "File Processing Error",
          description: "Failed to process CSV file. Please check the file format.",
        })
        setIsUploading(false)
      }
    }

    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "File Reading Error",
        description: "Failed to read the CSV file.",
      })
      setIsUploading(false)
    }

    // Count total rows first
    const countReader = new FileReader()
    countReader.onload = (event) => {
      const text = event.target?.result as string
      const rowCount = text.split("\n").length - 1 // -1 for header
      setTotalRows(rowCount)
      reader.readAsText(file) // Start actual processing
    }
    countReader.readAsText(file)
  }

  const uploadBatch = async (batch: Product[]) => {
    try {
      const response = await fetch(`${API_URL}/add-product-batch`, {
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
      <div className="flex justify-end mb-4">
        <SettingsDropdown />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
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
            
          </div>
        </CardContent>
      </Card>

      <Card className="mt-5">
        
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table className="p-0">
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

