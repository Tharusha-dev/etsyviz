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
import { Download, Search, X, ChevronRight } from "lucide-react";
import { Checkbox } from "./checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

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

// Add new interface for category hierarchy
interface CategoryItem {
  id: number;
  category_name: string;
  level: number;
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [categoryHierarchy, setCategoryHierarchy] = useState<CategoryItem[][]>([]);
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<number[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

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

  // Fetch initial top-level categories
  useEffect(() => {
    const fetchTopCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/category-hierarchy`);
        const data = await response.json();
        setCategoryHierarchy([data]);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchTopCategories();
  }, []);

  // Add effect to count active filters
  useEffect(() => {
    const count = Object.keys(filters).filter(key => {
      const value = filters[key];
      return value !== "" && value !== null && value !== undefined && 
             !(Array.isArray(value) && value.length === 0);
    }).length;
    setActiveFilterCount(count);
  }, [filters]);

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

  // Handle category selection
  const handleCategorySelect = async (categoryId: number, level: number) => {
    try {
      // Update selected path
      const newPath = [...selectedCategoryPath.slice(0, level), categoryId];
      setSelectedCategoryPath(newPath);

      // Fetch child categories
      const response = await fetch(`${API_URL}/category-hierarchy/${categoryId}`);
      const children = await response.json();

      // Update hierarchy
      const newHierarchy = [...categoryHierarchy.slice(0, level + 1)];
      if (children.length > 0) {
        newHierarchy.push(children);
      }
      setCategoryHierarchy(newHierarchy);

      // If this is a leaf category (no children), use it as filter
      if (children.length === 0) {
        const selectedCategory = categoryHierarchy[level].find(c => c.id === categoryId);
        if (selectedCategory) {
          handleFilterChange('category_name', selectedCategory.category_name);
        }
      }
    } catch (error) {
      console.error('Error handling category selection:', error);
    }
  };

  const clearFilters = () => {
    // Reset all state values
    setFilters({});
    setSearchValue("");
    setSelectedCountry("");
    setSelectedCategory("");
    setSelectedBrand("");
    setSelectedCategories([]);
    setSelectedBrands([]);
    
    // Reset category hierarchy state
    setSelectedCategoryPath([]);
    setCategoryHierarchy([categoryHierarchy[0]]); // Keep only the top-level categories

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

  // Replace the existing category dropdown with this:
  const renderCategoryDropdowns = () => (
    <div className="space-y-2 flex flex-col">
      <label>Categories</label>
      <div className="flex gap-2 flex-wrap">
        {categoryHierarchy.map((categories, level) => (
          <div key={level} className="flex items-center">
            <Select
              value={selectedCategoryPath[level]?.toString() || ''}
              onValueChange={(value) => handleCategorySelect(parseInt(value), level)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {level < categoryHierarchy.length - 1 && (
              <ChevronRight className="h-4 w-4 mx-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
        </Button>

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

      {isExpanded && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
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
                  placeholder="Search in products..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Common date filters for both stores and products */}
              <div className="space-y-2">
                <label>On Etsy Since</label>
                <DatePicker
                  onChange={(date) => handleFilterChange("on_etsy_since_from", date)}
                />
                <DatePicker
                  onChange={(date) => handleFilterChange("on_etsy_since_to", date)}
                />
              </div>

              {type === "stores" && (
                <>
                  {/* Store Country Dropdown */}
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

                  {/* Star Seller dropdown */}
                  <div className="space-y-2">
                    <label>Star Seller</label>
                    <Select
                      onValueChange={(value) => handleFilterChange("star_seller", value === "true")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Store numeric filters */}
                  <div className="space-y-2">
                    <label>Store Ratings</label>
                    <Input
                      type="number"
                      placeholder="From"
                      onChange={(e) => handleFilterChange("store_review_score_from", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      onChange={(e) => handleFilterChange("store_review_score_to", e.target.value)}
                    />
                  </div>

                  {/* Add other store numeric filters similarly */}
                  {/* Store Sales, Store Admirers, Store Number of Products */}
                </>
              )}

              {type === "products" && (
                <>
                  {/* Product-specific date filters */}
                  <div className="space-y-2">
                    <label>Last Reviews</label>
                    <DatePicker
                      onChange={(date) => handleFilterChange("date_of_latest_review_from", date)}
                    />
                    <DatePicker
                      onChange={(date) => handleFilterChange("date_of_latest_review_to", date)}
                    />
                  </div>

                  <div className="space-y-2 flex flex-col">
                    <label>Last Listed</label>
                    <DatePicker
                      onChange={(date) => handleFilterChange("date_listed_from", date)}
                    />
                    <DatePicker
                      onChange={(date) => handleFilterChange("date_listed_to", date)}
                    />
                  </div>

                  {/* Categories Multi-select */}
                  {renderCategoryDropdowns()}

                  {/* Checkboxes */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ad"
                        onCheckedChange={(checked) => handleFilterChange("ad", checked)}
                      />
                      <label htmlFor="ad">Advertisement</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="digital"
                        onCheckedChange={(checked) => handleFilterChange("digital_download", checked)}
                      />
                      <label htmlFor="digital">Digital Download</label>
                    </div>
                  </div>

                  {/* Numeric range filters */}
                  <div className="space-y-2">
                    <label>Last 24 Hours</label>
                    <Input
                      type="number"
                      placeholder="From"
                      onChange={(e) => handleFilterChange("last_24_hours_from", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      onChange={(e) => handleFilterChange("last_24_hours_to", e.target.value)}
                    />
                  </div>

                  {/* Number in Basket */}
                  <div className="space-y-2">
                    <label>Number in Basket</label>
                    <Input
                      type="number"
                      placeholder="From"
                      onChange={(e) => handleFilterChange("number_in_basket_from", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      onChange={(e) => handleFilterChange("number_in_basket_to", e.target.value)}
                    />
                  </div>

                  {/* Product Reviews */}
                  <div className="space-y-2">
                    <label>Product Reviews</label>
                    <Input
                      type="number"
                      placeholder="From"
                      onChange={(e) => handleFilterChange("product_reviews_from", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      onChange={(e) => handleFilterChange("product_reviews_to", e.target.value)}
                    />
                  </div>

                  {/* Product Ratings */}
                  <div className="space-y-2">
                    <label>Product Ratings</label>
                    <Input
                      type="number"
                      placeholder="From"
                      step="0.1"
                      min="0"
                      max="5"
                      onChange={(e) => handleFilterChange("ratingvalue_from", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      step="0.1"
                      min="0"
                      max="5"
                      onChange={(e) => handleFilterChange("ratingvalue_to", e.target.value)}
                    />
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <label>Price (USD)</label>
                    <Input
                      type="number"
                      placeholder="From"
                      step="0.01"
                      onChange={(e) => handleFilterChange("price_usd_from", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      step="0.01"
                      onChange={(e) => handleFilterChange("price_usd_to", e.target.value)}
                    />
                  </div>

                  {/* Sale Price */}
                  <div className="space-y-2">
                    <label>Sale Price (USD)</label>
                    <Input
                      type="number"
                      placeholder="From"
                      step="0.01"
                      onChange={(e) => handleFilterChange("sale_price_usd_from", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      step="0.01"
                      onChange={(e) => handleFilterChange("sale_price_usd_to", e.target.value)}
                    />
                  </div>

                  {/* Add other numeric filters similarly */}
                  {/* Number in Basket, Product Reviews, Product Ratings, Price, Sale Price */}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
