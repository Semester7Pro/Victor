"use client";

import { useState } from "react";
import { Filter, X, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterDropdownProps {
  onFilterChange: (filters: SearchFilters) => void;
  currentFilters: SearchFilters;
}

export interface SearchFilters {
  category?: string;
  language?: string;
  document_type?: string;
  document_id?: string;
  date_from?: string;
  date_to?: string;
}

const CATEGORIES = [
  "Scraped_moe_archived_press_releases",
  "Scraped_moe_archived_scholarships",
  "moe_scraped_higher_edu_RUSA",
  "scraped_moe_archived_circulars",
  "scraped_moe_documents&reports",
];

const LANGUAGES = [
  "English",
  "Bilingual",
  "Hindi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Marathi",
];

const DOCUMENT_TYPES = [
  "pdf",
  "PDF",
  "doc",
  "docx",
  "txt",
];

export default function FilterDropdown({ onFilterChange, currentFilters }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(currentFilters);

  const hasActiveFilters = Object.values(filters).some(val => val && val.trim() !== "");

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    onFilterChange(filters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    const emptyFilters: SearchFilters = {};
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const clearSingleFilter = (key: keyof SearchFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
  };

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`p-3 rounded-lg transition-all flex items-center gap-2 ${
          hasActiveFilters
            ? "bg-primary/20 border border-primary/50 text-primary"
            : "bg-muted border border-border text-foreground hover:bg-muted/80"
        }`}
        title="Filter documents"
      >
        <Filter className="w-5 h-5" />
        {hasActiveFilters && (
          <span className="text-xs font-semibold bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
            {Object.values(filters).filter(v => v && v.trim() !== "").length}
          </span>
        )}
      </button>

      {/* Filter Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Filter className="h-5 w-5 text-primary" />
              Filter Documents
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Category Filter */}
            <div className="space-y-2">
              <Label className="text-foreground">Category</Label>
              <Select 
                value={filters.category || "all"} 
                onValueChange={(value) => handleFilterChange("category", value === "all" ? "" : value)}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace(/_/g, " ").replace(/scraped |moe /gi, "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language Filter */}
            <div className="space-y-2">
              <Label className="text-foreground">Language</Label>
              <Select 
                value={filters.language || "all"} 
                onValueChange={(value) => handleFilterChange("language", value === "all" ? "" : value)}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Document Type Filter */}
            <div className="space-y-2">
              <Label className="text-foreground">Document Type</Label>
              <Select 
                value={filters.document_type || "all"} 
                onValueChange={(value) => handleFilterChange("document_type", value === "all" ? "" : value)}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Document ID Search */}
            <div className="space-y-2">
              <Label className="text-foreground">Document ID (contains)</Label>
              <Input
                value={filters.document_id || ""}
                onChange={(e) => handleFilterChange("document_id", e.target.value)}
                placeholder="e.g., RTEAct, NEP2020, RUSA"
                className="bg-muted border-border"
              />
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label className="text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Published Date Range
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="date"
                    value={filters.date_from || ""}
                    onChange={(e) => handleFilterChange("date_from", e.target.value)}
                    className="bg-muted border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-1">From</p>
                </div>
                <div>
                  <Input
                    type="date"
                    value={filters.date_to || ""}
                    onChange={(e) => handleFilterChange("date_to", e.target.value)}
                    className="bg-muted border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-1">To</p>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value || value.trim() === "") return null;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => clearSingleFilter(key as keyof SearchFilters)}
                        className="px-2 py-1 bg-primary/20 border border-primary/50 text-primary rounded-md text-xs flex items-center gap-1 hover:bg-primary/30 transition"
                      >
                        <span className="font-medium">{key}:</span>
                        <span>{value.length > 20 ? value.substring(0, 20) + "..." : value}</span>
                        <X className="w-3 h-3" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="flex-1 border-border hover:bg-muted"
            >
              Clear All
            </Button>
            <Button
              onClick={applyFilters}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}