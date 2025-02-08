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
import SettingsDropdown from "./settings"

interface Category {
  search_url: string
  category_tree: string
  product_url: string
  product_id: string
  product_name: string
  is_ad: boolean
  star_seller: boolean
  store_reviews_number: number | null
  store_reviews_score: number | null
  store_name: string
  store_url: string
}

const BATCH_SIZE = 5 // Number of rows to process at once

// Add this new component before the columns definition
const ExpandableText = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (text.length < 100) return <span>{text}</span>;
  
  return (
    <div>
      <div className={`${!isExpanded ? "line-clamp-2" : ""}`}>
        {text}
      </div>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-blue-600 hover:underline mt-1"
      >
        {isExpanded ? "Show Less" : "Read More"}
      </button>
    </div>
  );
};

// Define columns
const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "search_url",
    header: "Search URL",
    cell: ({ row }) => (
      <a 
        href={row.getValue("search_url")} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        Link
      </a>
    ),
  },
  {
    accessorKey: "category_tree",
    header: "Category Tree",
    cell: ({ row }) => (
      <ExpandableText text={row.getValue("category_tree")} />
    ),
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
    accessorKey: "product_name",
    header: "Product Name",
    cell: ({ row }) => (
      <ExpandableText text={row.getValue("product_name")} />
    ),
  },
  {
    accessorKey: "is_ad",
    header: "Is Ad",
    cell: ({ row }) => row.getValue("is_ad") ? "Yes" : "No",
  },
  {
    accessorKey: "star_seller",
    header: "Star Seller",
    cell: ({ row }) => row.getValue("star_seller") ? "Yes" : "No",
  },
  {
    accessorKey: "store_reviews_number",
    header: "Store Reviews",
    cell: ({ row }) => row.getValue("store_reviews_number") ?? "N/A",
  },
  {
    accessorKey: "store_reviews_score",
    header: "Review Score",
    cell: ({ row }) => {
      const score = row.getValue("store_reviews_score")
      return score ? `${score} / 5` : "N/A"
    },
  },
  {
    accessorKey: "store_name",
    header: "Store Name",
    cell: ({ row }) => (
      <ExpandableText text={row.getValue("store_name")} />
    ),
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
]

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
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
          table: 'categories',
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
      setCategories(initialData)
      setIsLoading(false)
    }
    loadInitialData()
  }, [])

  const table = useReactTable({
    data: categories,
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
      setCategories(newData)
      setIsLoading(false)
    }
    loadPageData()
  }, [pageIndex, pageSize])

  const validateCSVColumns = (headers: string[]): boolean => {
    const requiredColumns = [
      "search_url",
      "category_tree",
      "product_url",
      "product_id",
      "product_name",
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

          let batch: Category[] = []
          let rowCount = 0
          const totalRows = records.length

          for (const record of records) {
            try {
              const processedRecord: Category = {
                ...record,
                is_ad: record.is_ad?.toLowerCase() === 'y' || record.is_ad === 'true' || record.is_ad === true,
                star_seller: record.star_seller?.toLowerCase() === 'y' || record.star_seller === 'true' || record.star_seller === true,
                store_reviews_number: record.store_reviews_number ? Number.parseInt(record.store_reviews_number) : null,
                store_reviews_score: record.store_reviews_score ? Number.parseFloat(record.store_reviews_score) : null,
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

  const uploadBatch = async (batch: Category[]) => {
    try {
      const response = await fetch(`${API_URL}/add-category-batch`, {
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
      setCategories(prev => [...prev, ...batch])
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
          <CardTitle>Categories</CardTitle>
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

