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
import { Download, Search, X, ChevronRight, Plus } from "lucide-react";
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
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [categoryHierarchy, setCategoryHierarchy] = useState<CategoryItem[][]>([]);
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<number[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [storeReviewScoreFrom, setStoreReviewScoreFrom] = useState<string>("");
  const [storeReviewScoreTo, setStoreReviewScoreTo] = useState<string>("");
  const [categoryPaths, setCategoryPaths] = useState<Array<number[]>>([[]]);

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
      //@ts-ignore
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

  // Update handleCategorySelect to work with multiple paths
  const handleCategorySelect = (categoryId: number, level: number, pathIndex: number = 0) => {
    // Create a copy of all paths
    const newCategoryPaths = [...categoryPaths];
    
    // Update the specific path
    const newPath = [...newCategoryPaths[pathIndex]];
    // Truncate the path at this level and add the new selection
    newPath.length = level;
    newPath.push(categoryId);
    newCategoryPaths[pathIndex] = newPath;
    
    setCategoryPaths(newCategoryPaths);
    
    // Fetch subcategories for this selection
    fetchCategoryChildren(categoryId, level + 1, pathIndex);
    
    // Apply filter with all selected categories
    const selectedCategories = newCategoryPaths
      .map(path => path[path.length - 1])
      .filter(Boolean);
      
    if (selectedCategories.length > 0) {
      handleFilterChange("category_ids", selectedCategories);
    }
  };
  
  // Fetch category children for a specific path
  const fetchCategoryChildren = async (parentId: number | null, level: number, pathIndex: number) => {
    try {
      const response = await fetch(`${API_URL}/category-hierarchy/${parentId || ''}`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      
      // Update the hierarchy for this specific level and path
      const newHierarchy = [...categoryHierarchy];
      
      // Ensure the hierarchy has enough levels
      while (newHierarchy.length <= level) {
        newHierarchy.push([]);
      }
      
      newHierarchy[level] = data;
      setCategoryHierarchy(newHierarchy);
    } catch (error) {
      console.error('Error fetching category children:', error);
    }
  };
  
  // Add a new category path
  const addCategoryPath = () => {
    setCategoryPaths([...categoryPaths, []]);
  };
  
  // Remove a category path
  const removeCategoryPath = (pathIndex: number) => {
    if (categoryPaths.length <= 1) return; // Keep at least one path
    
    const newPaths = categoryPaths.filter((_, index) => index !== pathIndex);
    setCategoryPaths(newPaths);
    
    // Update filters with remaining categories
    const selectedCategories = newPaths
      .map(path => path[path.length - 1])
      .filter(Boolean);
      
    if (selectedCategories.length > 0) {
      handleFilterChange("category_ids", selectedCategories);
    } else {
      // Clear the filter if no categories are selected
      handleFilterChange("category_ids", null);
    }
  };
  
  // Render multiple category trees
  const renderCategoryDropdowns = () => (
    <div className="space-y-2 flex flex-col">
      <label>Categories</label>
      <div className="space-y-4">
        {categoryPaths.map((path, pathIndex) => (
          <div key={`path-${pathIndex}-${path.join('-')}`} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-2 items-center">
                {categoryHierarchy.map((categories, level) => {
                  // Only show this level dropdown if all previous levels in this path have selections
                  if (level > 0 && !path[level - 1]) return null;
                  
                  return (
                    <div key={`${pathIndex}-${level}`} className="flex items-center">
                      <Select
                        key={`select-${pathIndex}-${level}-${path[level] || 'empty'}`}
                        value={path[level]?.toString() || ''}
                        onValueChange={(value) => handleCategorySelect(parseInt(value), level, pathIndex)}
                      >
                        <SelectTrigger className="w-[180px]">
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
                      {level < categoryHierarchy.length - 1 && path[level] && (
                        <ChevronRight className="h-4 w-4 mx-2" />
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Add remove button for paths after the first one */}
              {pathIndex > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeCategoryPath(pathIndex)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
        
        {/* Add button for new category path */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={addCategoryPath}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Category
        </Button>
      </div>
    </div>
  );

  const clearFilters = () => {
    // Reset all state values
    setFilters({});
    setSearchValue("");
    setSelectedCountry("");
    setSelectedCategory("");
    setSelectedBrand("");
    setSelectedCategories([]);
    setSelectedCountries([]);
    setSelectedBrands([]);
    
    // Reset category paths and hierarchy state
    setCategoryPaths([[]]);
    setSelectedCategoryPath([]);
    setCategoryHierarchy([categoryHierarchy[0]]); // Keep only the top-level categories
    setStoreReviewScoreFrom("");
    setStoreReviewScoreTo("");

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

  // Add a function to handle multiple selection
  const handleMultiSelect = (field: string, value: string, currentValues: string[], setValues: React.Dispatch<React.SetStateAction<string[]>>) => {
    let newValues;
    if (currentValues.includes(value)) {
      newValues = currentValues.filter(v => v !== value);
    } else {
      newValues = [...currentValues, value];
    }
    setValues(newValues);
    handleFilterChange(field, newValues.length > 0 ? newValues : null);
  };

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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {selectedCountries.length > 0 
                            ? `${selectedCountries.length} selected` 
                            : "Select countries"}
                          <ChevronRight className="h-4 w-4 ml-2 rotate-90" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 max-h-[300px] overflow-auto">
                        <DropdownMenuLabel>Countries</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {filterOptions.countries.map((country) => (
                          <DropdownMenuCheckboxItem
                            key={country}
                            checked={selectedCountries.includes(country)}
                            onCheckedChange={() => 
                              handleMultiSelect("countries", country, selectedCountries, setSelectedCountries)
                            }
                          >
                            {country}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
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

                  {/* Store Reviews */}
                  <div className="space-y-2">
                    <label>Store Reviews</label>
                    <Input
                      type="number"
                      placeholder="From"
                      onChange={(e) => handleFilterChange("store_reviews_from", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      onChange={(e) => handleFilterChange("store_reviews_to", e.target.value)}
                    />
                  </div>

                  {/* Store Sales */}
                  <div className="space-y-2">
                    <label>Store Sales</label>
                    <Input
                      type="number"
                      placeholder="From"
                      onChange={(e) => handleFilterChange("store_sales_from", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      onChange={(e) => handleFilterChange("store_sales_to", e.target.value)}
                    />
                  </div>

                  {/* Store Admirers */}
                  <div className="space-y-2">
                    <label>Store Admirers</label>
                    <Input
                      type="number"
                      placeholder="From"
                      onChange={(e) => handleFilterChange("store_admirers_from", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      onChange={(e) => handleFilterChange("store_admirers_to", e.target.value)}
                    />
                  </div>

                  {/* Store Products */}
                  <div className="space-y-2">
                    <label>Store Products</label>
                    <Input
                      type="number"
                      placeholder="From"
                      onChange={(e) => handleFilterChange("number_of_store_products_from", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      onChange={(e) => handleFilterChange("number_of_store_products_to", e.target.value)}
                    />
                  </div>

                  {/* Last Updated */}
                  <div className="space-y-2">
                    <label>Last Updated</label>
                    <DatePicker
                      onChange={(date) => handleFilterChange("store_last_updated_from", date)}
                    />
                    <DatePicker
                      onChange={(date) => handleFilterChange("store_last_updated_to", date)}
                    />
                  </div>

                  {/* Store Review Score */}
                  <div className="space-y-2">
                    <label>Store Review Score</label>
                    <Input
                      type="number"
                      placeholder="From"
                      value={storeReviewScoreFrom}
                      onChange={(e) => {
                        setStoreReviewScoreFrom(e.target.value);
                        handleFilterChange("store_review_score_from", e.target.value);
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      value={storeReviewScoreTo}
                      onChange={(e) => {
                        setStoreReviewScoreTo(e.target.value);
                        handleFilterChange("store_review_score_to", e.target.value);
                      }}
                    />
                  </div>
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

                  {/* Countries Multi-select */}
                  <div className="space-y-2">
                    <label>Countries</label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          {selectedCountries.length > 0 
                            ? `${selectedCountries.length} selected` 
                            : "Select countries"}
                          <ChevronRight className="h-4 w-4 ml-2 rotate-90" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 max-h-[300px] overflow-auto">
                        <DropdownMenuLabel>Countries</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {filterOptions.countries.map((country) => (
                          <DropdownMenuCheckboxItem
                            key={country}
                            checked={selectedCountries.includes(country)}
                            onCheckedChange={() => 
                              handleMultiSelect("countries", country, selectedCountries, setSelectedCountries)
                            }
                          >
                            {country}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Category Hierarchy */}
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
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="star_seller"
                        onCheckedChange={(checked) => handleFilterChange("star_seller", checked)}
                      />
                      <label htmlFor="star_seller">Star Seller</label>
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

                  {/* Favorites */}
                  <div className="space-y-2">
                    <label>Favorites</label>
                    <Input
                      type="number"
                      placeholder="From"
                      onChange={(e) => handleFilterChange("number_of_favourties_from", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      onChange={(e) => handleFilterChange("number_of_favourties_to", e.target.value)}
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

                  {/* Store Reviews */}
                  <div className="space-y-2">
                    <label>Store Reviews</label>
                    <Input
                      type="number"
                      placeholder="From"
                      onChange={(e) => handleFilterChange("store_reviews_from", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      onChange={(e) => handleFilterChange("store_reviews_to", e.target.value)}
                    />
                  </div>

                  {/* Store Sales */}
                  <div className="space-y-2">
                    <label>Store Sales</label>
                    <Input
                      type="number"
                      placeholder="From"
                      onChange={(e) => handleFilterChange("store_sales_from", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      onChange={(e) => handleFilterChange("store_sales_to", e.target.value)}
                    />
                  </div>

                  {/* Store Admirers */}
                  <div className="space-y-2">
                    <label>Store Admirers</label>
                    <Input
                      type="number"
                      placeholder="From"
                      onChange={(e) => handleFilterChange("store_admirers_from", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      onChange={(e) => handleFilterChange("store_admirers_to", e.target.value)}
                    />
                  </div>

                  {/* Store Products */}
                  <div className="space-y-2">
                    <label>Store Products</label>
                    <Input
                      type="number"
                      placeholder="From"
                      onChange={(e) => handleFilterChange("number_of_store_products_from", e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="To"
                      onChange={(e) => handleFilterChange("number_of_store_products_to", e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
