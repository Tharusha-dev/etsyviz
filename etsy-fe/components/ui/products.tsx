"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Upload, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ExpandableText from "./expandableText"
import SettingsDropdown from "./settings"
import Filters from "./filters"
import { HistoryPopup } from "./history-popup"
import { Badge } from "@/components/ui/badge"

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
interface HistoryData {
  time_added: string;
  [key: string]: any;
}
const createHistoryCell = (key: string, formatter?: (value: any) => string) => ({
  cell: ({ row }: { row: any }) => {
    const [showHistory, setShowHistory] = useState(false);
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);

    const handleClick = async () => {
      const response = await fetch(
        `${API_URL}/product-history/${row.getValue("product_id")}/${key}`
      );
      const data = await response.json();
      setHistoryData(data);
      setShowHistory(true);
    };

    const value = row.getValue(key);
    const displayValue = formatter ? formatter(value) : (value ?? "N/A");

    return (
      <>
        <Badge
          onClick={handleClick}
          className="hover:underline cursor-pointer"
        >
          {displayValue}
        </Badge>
        <HistoryPopup
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
    //@ts-ignore

          data={historyData}
          fieldName={key}
        />
      </>
    );
  },
});

// Define columns
const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "product_title",
    header: "Product Title",
    cell: ({ row }) => (
      <ExpandableText text={row.getValue("product_title")} />
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
    cell: ({ row }) => (
      <a 
        href={row.getValue("category_url")} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        Link
      </a>
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
    ...createHistoryCell("last_24_hours")
  },
  {
    accessorKey: "number_in_basket",
    header: "In Basket",
    ...createHistoryCell("number_in_basket")
  },
  {
    accessorKey: "product_reviews",
    header: "Reviews",
    // cell: ({ row }) => row.getValue("product_reviews") ?? "N/A",
    ...createHistoryCell("product_reviews")

  },
  {
    accessorKey: "ratingValue",
    header: "Rating",
    // cell: ({ row }) => row.getValue("ratingValue") ?? "N/A",
    ...createHistoryCell("ratingValue")

    
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
    // cell: ({ row }) => row.getValue("number_of_favourties") ?? "N/A",
    ...createHistoryCell("number_of_favourties")

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
    // cell: ({ row }) => {
    //   const price = row.getValue("price_usd")
    //   return price ? new Intl.NumberFormat('en-US', {
    //     style: 'currency',
    //     currency: 'USD'
    //   }).format(price as number) : "N/A"
    // },
    ...createHistoryCell("price_usd")
    
  },
  {
    accessorKey: "sale_price_usd",
    header: "Sale Price (USD)",
    // cell: ({ row }) => {
    //   const price = row.getValue("sale_price_usd")
    //   return price ? new Intl.NumberFormat('en-US', {
    //     style: 'currency',
    //     currency: 'USD'
    //   }).format(price as number) : "N/A"
    // },
    ...createHistoryCell("sale_price_usd")

  },
  {
    accessorKey: "store_reviews",
    header: "Store Reviews",
    // cell: ({ row }) => row.getValue("store_reviews") ?? "N/A",
    ...createHistoryCell("store_reviews")

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
    // ...createHistoryCell("store_sales")

  },
  {
    accessorKey: "store_admirers",
    header: "Store Admirers",
    cell: ({ row }) => row.getValue("store_admirers") ?? "N/A",
    // ...createHistoryCell("store_admirers")

  },
  {
    accessorKey: "number_of_store_products",
    header: "Store Products",
    cell: ({ row }) => row.getValue("number_of_store_products") ?? "N/A",
    // ...createHistoryCell("number_of_store_products")

  },
  // {
  //   accessorKey: "facebook_url",
  //   header: "Facebook",
  //   cell: ({ row }) => {
  //     const url = row.getValue("facebook_url")
  //     return url ? (
  //       <a 
  //         href={url as string} 
  //         target="_blank" 
  //         rel="noopener noreferrer"
  //         className="text-blue-600 hover:underline"
  //       >
  //         Link
  //       </a>
  //     ) : "N/A"
  //   },
  // },
  // {
  //   accessorKey: "instagram_url",
  //   header: "Instagram",
  //   cell: ({ row }) => {
  //     const url = row.getValue("instagram_url")
  //     return url ? (
  //       <a 
  //         href={url as string} 
  //         target="_blank" 
  //         rel="noopener noreferrer"
  //         className="text-blue-600 hover:underline"
  //       >
  //         Link
  //       </a>
  //     ) : "N/A"
  //   },
  // },
  // {
  //   accessorKey: "pinterest_url",
  //   header: "Pinterest",
  //   cell: ({ row }) => {
  //     const url = row.getValue("pinterest_url")
  //     return url ? (
  //       <a 
  //         href={url as string} 
  //         target="_blank" 
  //         rel="noopener noreferrer"
  //         className="text-blue-600 hover:underline"
  //       >
  //         Link
  //       </a>
  //     ) : "N/A"
  //   },
  // },
  // {
  //   accessorKey: "tiktok_url",
  //   header: "TikTok",
  //   cell: ({ row }) => {
  //     const url = row.getValue("tiktok_url")
  //     return url ? (
  //       <a 
  //         href={url as string} 
  //         target="_blank" 
  //         rel="noopener noreferrer"
  //         className="text-blue-600 hover:underline"
  //       >
  //         Link
  //       </a>
  //     ) : "N/A"
  //   },
  // },
]

export default function Product() {
  const [products, setProducts] = useState<Product[]>([])
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [totalRows, setTotalRows] = useState(0)
  const [processedRows, setProcessedRows] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({})

  // Add state for pagination
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const { toast } = useToast()

  // Add new state for total filtered count
  const [totalFilteredCount, setTotalFilteredCount] = useState<number>(0);

  // Update fetchData function to set total filtered count
  const fetchData = async (start: number, size: number, currentFilters = filters) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/get-rows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'products',
          start,
          count: size,
          filters: currentFilters,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const { data, totalCount } = await response.json();
      setTotalRows(totalCount);
      setTotalFilteredCount(totalCount); // Set the filtered count
      setProducts(data);
      setIsLoading(false);
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
      return [];
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchData(0, pageSize);
  }, [pageSize]);

  // Handle filter changes
  const handleFilterChange = useCallback(async (newFilters: any) => {
    setFilters(newFilters);
    await fetchData(0, pageSize, newFilters); // Immediately fetch with new filters
    setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page
  }, [pageSize]);

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
    fetchData(pageIndex * pageSize, pageSize);
  }, [pageIndex, pageSize]);

  const validateCSVColumns = (headers: string[]): boolean => {
    const requiredColumns = [
      "product_name",
      "category_name",
      "category_tree",
      "category_url",
      "product_url",
      "product_id",
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

  // Add export function
  const handleExport = async () => {
    try {
      const response = await fetch(`${API_URL}/export-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'products',
          filters: filters,
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const data = await response.json();
      
      if (data.length === 0) {
        toast({
          variant: "destructive",
          title: "Export Failed",
          description: "No data to export",
        });
        return;
      }

      // Get field names from the first data object
      const fields = Object.keys(data[0]).filter(key => !["time_scraped", "cid", "pjson", "productj","breadcrumbj"].includes(key)); // Exclude the id field
      const headers = fields.join(',');

      const rows = data.map((row: any) => 
        fields
          .map(field => {
            const value = row[field];
            // Handle different value types
            if (value === null || value === undefined) return '';
            if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
            if (Array.isArray(value)) return `"${value.join(', ')}"`;
            if (typeof value === 'boolean') return value ? 'true' : 'false';
            if (value instanceof Date) return value.toISOString();
            return value;
          })
          .join(',')
      );

      const csv = [headers, ...rows].join('\n');

      // Create and download file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_export_${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: `${data.length} rows exported to CSV`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export data to CSV",
      });
    }
  };

  return (
    <div className="container">
       <div className="flex justify-between mb-4">
      <h1 className="text-[2rem] font-bold" style={{fontSize: "2rem"}}>Products</h1>

        <SettingsDropdown />
      </div>
      <Filters 
        type="products" 
        onFilterChange={handleFilterChange}
        totalFilteredCount={totalFilteredCount}
        handleExport={handleExport}
        isLoading={isLoading}
      />
      {/* <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Products</CardTitle>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {totalFilteredCount} results found
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isLoading}
              >
                <Download className="mr-2 h-4 w-4" />
                Export to CSV
              </Button>
            </div>
          </div>
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
      </Card> */}

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

