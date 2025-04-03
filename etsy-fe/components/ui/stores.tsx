"use client"

import { useState, useEffect, useCallback } from "react"
import { parse } from "csv-parse"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
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
import { Upload, Download, ArrowUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ExpandableText from "./expandableText"
import SettingsDropdown from "./settings"
import Filters from "./filters"
import { Badge } from "@/components/ui/badge"
import { HistoryPopup } from "./history-popup"

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

interface HistoryData {
  time_added: string;
  [key: string]: any;
}

const BATCH_SIZE = 5 // Number of rows to process at once
const createHistoryCell = (key: string, formatter?: (value: any) => string) => ({
  cell: ({ row }: { row: any }) => {
    const [showHistory, setShowHistory] = useState(false);
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);

    const handleClick = async () => {
      const response = await fetch(
        `${API_URL}/store-history/${encodeURIComponent(row.getValue("store_name"))}/${key}`
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

// Helper function to create a sortable header
const createSortableHeader = (label: string) => {
  return ({ column }: { column: any }) => {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="p-0 hover:bg-transparent"
      >
        {label}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    );
  };
};

// Define columns
const columns: ColumnDef<Store>[] = [
  {
    accessorKey: "store_logo_url",
    header: "Logo",
    cell: ({ row }) => {
      const url = row.getValue("store_logo_url")
      return url ? (
        <img 
          src={url as string} 
          alt="Store Logo" 
          className="w-12 h-12 object-contain rounded-md"
        />
      ) : "N/A"
    },
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
    cell: ({ row }) => (
      <ExpandableText text={row.getValue("welcome_to_our_shop_text")} />
    ),
  },

  {
    accessorKey: "store_description",
    header: "Description",
    cell: ({ row }) => (
      <ExpandableText text={row.getValue("store_description")} />
    ),
  },
  {
    accessorKey: "most_recent_product_urls",
    header: "Recent Products",
    cell: ({ row }) => {
      const urls = row.getValue("most_recent_product_urls") as string[]
      return urls?.length ? (
        <div className="flex flex-col gap-1">
          {urls.map((url, index) => (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Link
            </a>
          ))}
        </div>
      ) : "None"
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
    header: createSortableHeader("Last Updated"),
    cell: ({ row }) => {
      const date = row.getValue("store_last_updated")
      return date ? new Date(date as string).toLocaleDateString() : "N/A"
    },
  },
  {
    accessorKey: "store_reviews",
    header: createSortableHeader("Reviews"),
    ...createHistoryCell("store_reviews")
  },
  {
    accessorKey: "store_review_score",
    header: createSortableHeader("Review Score"),
    ...createHistoryCell("store_review_score")
  },
  {
    accessorKey: "on_etsy_since",
    header: createSortableHeader("On Etsy Since"),
    cell: ({ row }) => {
      const date = row.getValue("on_etsy_since")
      return date ? new Date(date as string).toLocaleDateString() : "N/A"
    },
  },
  {
    accessorKey: "store_sales",
    header: createSortableHeader("Sales"),
    ...createHistoryCell("store_sales")
  },
  {
    accessorKey: "store_admirers",
    header: createSortableHeader("Admirers"),
    ...createHistoryCell("store_admirers")
  },
  {
    accessorKey: "number_of_store_products",
    header: createSortableHeader("Products"),
    ...createHistoryCell("number_of_store_products")
  },
  // {
  //   accessorKey: "looking_for_more_urls",
  //   header: "More URLs",
  //   cell: ({ row }) => {
  //     const urls = row.getValue("looking_for_more_urls") as string[]
  //     return urls?.length ? `${urls.length} links` : "None"
  //   },
  // },
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

export default function Stores() {
  const [products, setProducts] = useState<Store[]>([])
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [totalRows, setTotalRows] = useState(0)
  const [processedRows, setProcessedRows] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({})
  
  // Add state for sorting
  const [sorting, setSorting] = useState<SortingState>([])
  
  // Add state for pagination
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const { toast } = useToast()

  // Add state for total filtered count
  const [totalFilteredCount, setTotalFilteredCount] = useState<number>(0);

  // Update fetchData function to include sorting parameters
  const fetchData = async (start: number, size: number, currentFilters = filters, currentSorting = sorting) => {
    try {
      setIsLoading(true);
      
      // Convert sorting state to a format the server can understand
      const sortParams = currentSorting.length > 0 ? {
        column: currentSorting[0].id,
        direction: currentSorting[0].desc ? 'desc' : 'asc'
      } : null;
      
      const response = await fetch(`${API_URL}/get-rows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'stores',
          start,
          count: size,
          filters: currentFilters,
          sort: sortParams
        }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const { data, totalCount } = await response.json();
      setTotalRows(totalCount);
      setTotalFilteredCount(totalCount);
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
    await fetchData(0, pageSize, newFilters, sorting);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [pageSize, sorting]);

  // Handle sorting changes
  useEffect(() => {
    fetchData(pageIndex * pageSize, pageSize, filters, sorting);
  }, [sorting, pageIndex, pageSize]);

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalRows / pageSize),
    state: {
      pagination: {
        pageIndex,
        pageSize,
      },
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  })

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

  const handleExport = async () => {
    try {
      // Convert sorting state to a format the server can understand
      const sortParams = sorting.length > 0 ? {
        column: sorting[0].id,
        direction: sorting[0].desc ? 'desc' : 'asc'
      } : null;
      
      const response = await fetch(`${API_URL}/export-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'stores',
          filters: filters,
          sort: sortParams  // Add sorting parameters to the export request
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
      const fields = Object.keys(data[0]).filter(key => key !== 'id'); // Exclude the id field
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
      a.download = `stores_export_${new Date().toISOString()}.csv`;
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
      <h1 className="text-[2rem] font-bold" style={{fontSize: "2rem"}}>Stores</h1>

        <SettingsDropdown />
      </div>
      <Filters 
        type="stores" 
        onFilterChange={handleFilterChange}
        totalFilteredCount={totalFilteredCount}
        handleExport={handleExport}
        isLoading={isLoading}
      />
      {/* <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Stores</CardTitle>
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


