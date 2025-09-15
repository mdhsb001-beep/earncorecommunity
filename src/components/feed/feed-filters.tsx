"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X, TrendingUp, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface FeedFiltersProps {
  currentCommunity?: string;
  currentPlatform?: string;
  currentSortBy?: string;
  currentSortType?: string;
  currentSearch?: string;
  currentMinQualityScore?: number;
  currentAuthentic?: boolean;
}

export function FeedFilters({
  currentCommunity,
  currentPlatform,
  currentSortBy = "createdAt",
  currentSortType = "desc",
  currentSearch,
  currentMinQualityScore,
  currentAuthentic = true,
}: FeedFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchValue, setSearchValue] = useState(currentSearch || "");
  const [qualityScore, setQualityScore] = useState([currentMinQualityScore || 0]);
  const [isAuthentic, setIsAuthentic] = useState(currentAuthentic);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const platforms = [
    { value: "reddit", label: "Reddit" },
    { value: "twitter", label: "Twitter" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "medium", label: "Medium" },
  ];

  const sortOptions = [
    { value: "createdAt", label: "Latest", icon: Clock },
    { value: "totalEngagement", label: "Most Popular", icon: TrendingUp },
    { value: "qualityScore", label: "Highest Quality", icon: Star },
  ];

  const updateFilters = (newFilters: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    const basePath = currentCommunity 
      ? `/dashboard/feed/${currentCommunity}`
      : "/dashboard/feed";
    
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchValue });
  };

  const handlePlatformChange = (platform: string) => {
    updateFilters({ platform: platform === "all" ? undefined : platform });
  };

  const handleSortChange = (sortBy: string) => {
    updateFilters({ sortBy, sortType: "desc" });
  };

  const handleAdvancedFilters = () => {
    updateFilters({
      minQualityScore: qualityScore[0] > 0 ? qualityScore[0].toString() : undefined,
      authentic: isAuthentic ? "true" : "false",
    });
    setIsFiltersOpen(false);
  };

  const clearFilters = () => {
    setSearchValue("");
    setQualityScore([0]);
    setIsAuthentic(true);
    
    const basePath = currentCommunity 
      ? `/dashboard/feed/${currentCommunity}`
      : "/dashboard/feed";
    
    router.push(basePath);
  };

  const activeFiltersCount = [
    currentPlatform,
    currentSearch,
    currentSortBy !== "createdAt",
    currentMinQualityScore && currentMinQualityScore > 0,
    !currentAuthentic,
  ].filter(Boolean).length;

  return (
    <Card className="p-4 space-y-4">
      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchValue("");
                  updateFilters({ search: undefined });
                }}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </form>

        {/* Platform Filter */}

        {/* Advanced Filters */}
        <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Advanced Filters</h4>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>

              {/* Quality Score */}
              <div className="space-y-2">
                <Label>Minimum Quality Score: {qualityScore[0]}%</Label>
                <Slider
                  value={qualityScore}
                  onValueChange={setQualityScore}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>

              {/* Authentic Content */}
              <div className="flex items-center justify-between">
                <Label htmlFor="authentic">Authentic Content Only</Label>
                <Switch
                  id="authentic"
                  checked={isAuthentic}
                  onCheckedChange={setIsAuthentic}
                />
              </div>

              <Button onClick={handleAdvancedFilters} className="w-full">
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Sort Options */}
      <div className="flex flex-wrap gap-2">
        {sortOptions.map((option) => {
          const Icon = option.icon;
          const isActive = currentSortBy === option.value;
          
          return (
            <Button
              key={option.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleSortChange(option.value)}
              className="flex items-center space-x-2"
            >
              <Icon className="h-4 w-4" />
              <span>{option.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {currentSearch && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{currentSearch}"
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchValue("");
                  updateFilters({ search: undefined });
                }}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {currentPlatform && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Platform: {platforms.find(p => p.value === currentPlatform)?.label}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilters({ platform: undefined })}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {currentMinQualityScore && currentMinQualityScore > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Quality: {currentMinQualityScore}%+
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFilters({ minQualityScore: undefined })}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
}