import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Button } from "./button";
import { DatePicker } from "./datePicker";
import { API_URL } from "@/lib/config";
import { Download, Search, X } from "lucide-react";

interface FilterProps {
  type: "products" | "stores";
  onFilterChange: (filters: any) => void;
  totalFilteredCount: number;
  handleExport: any;
  isLoading: boolean;
}

interface FilterOptions {
  countries: string[];
  categories: string[];
  brands: string[];
}

export default function Filters({
  type,
  onFilterChange,
  totalFilteredCount,
  handleExport,
  isLoading,
}: FilterProps) {
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    countries: [],
    categories: [],
    brands: [],
  });
  const [searchValue, setSearchValue] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");

  useEffect(() => {
    // Fetch filter options
    const fetchOptions = async () => {
      try {
        const response = await fetch(`${API_URL}/filter-options/${type}`);
        const data = await response.json();
        // Extract string values from the response
        setFilterOptions({
          countries: data.countries
            .map((c: any) => c.store_country)
            .filter(Boolean),
          categories: data.categories
            .map((c: any) => c.category_name)
            .filter(Boolean),
          brands: data.brands.map((b: any) => b.brand).filter(Boolean),
        });
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };
    fetchOptions();
  }, [type]);

  const handleFilterChange = (field: string, value: any) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Add debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue !== undefined) {
        handleFilterChange("jsonSearch", searchValue);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const clearFilters = () => {
    // Reset all state values
    setFilters({});
    setSearchValue("");
    setSelectedCountry("");
    setSelectedCategory("");
    setSelectedBrand("");

    // Reset all form elements to default values
    const dateInputs = document.querySelectorAll('input[type="date"]');
    //@ts-ignore
    dateInputs.forEach((input: HTMLInputElement) => {
      input.value = "";
    });

    const numberInputs = document.querySelectorAll('input[type="number"]');
    //@ts-ignore

    numberInputs.forEach((input: HTMLInputElement) => {
      input.value = "";
    });

    // Reset select elements to show placeholder
    const selectElements = document.querySelectorAll("[data-value]");
    selectElements.forEach((select: any) => {
      select.removeAttribute("data-value");
    });

    // Notify parent component
    onFilterChange({});
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
        {/* <CardTitle className="text-xl font-bold">Filters</CardTitle> */}
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      </CardHeader>
      <CardContent className="p-3">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search in JSON data..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Date filters */}
          <div className="space-y-2">
            <label>First Uploaded</label>
            <DatePicker
              onChange={(date) => handleFilterChange("time_scraped_from", date)}
            />
            <DatePicker
              onChange={(date) => handleFilterChange("time_scraped_to", date)}
            />
          </div>

          {/* Numeric range filters */}
          <div className="space-y-2">
            <label>Store Reviews</label>
            <Input
              type="number"
              placeholder="From"
              onChange={(e) =>
                handleFilterChange("store_reviews_from", e.target.value)
              }
            />
            <Input
              type="number"
              placeholder="To"
              onChange={(e) =>
                handleFilterChange("store_reviews_to", e.target.value)
              }
            />
          </div>

          {/* Dropdown filters */}
          <div className="space-y-2">
            <label>Store Country</label>
            <Select
              value={selectedCountry}
              onValueChange={(value) => {
                setSelectedCountry(value);
                handleFilterChange("store_country", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product-specific filters */}
          {type === "products" && (
            <>
              <div className="space-y-2">
                <label>Category</label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => {
                    setSelectedCategory(value);
                    handleFilterChange("category", value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label>Brand</label>
                <Select
                  value={selectedBrand}
                  onValueChange={(value) => {
                    setSelectedBrand(value);
                    handleFilterChange("brand", value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          {/* Export section moved outside of product-specific filters */}
          <div className="flex items-end justify-end gap-4 col-span-full">
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
          {/* Add more filters based on your requirements */}
        </div>
      </CardContent>
    </Card>
  );
}
