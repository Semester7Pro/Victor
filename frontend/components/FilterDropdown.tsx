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
        className="p-3 rounded-lg transition-colors flex items-center gap-2 border"
        style={{
          backgroundColor: hasActiveFilters 
            ? 'hsl(var(--primary) / 0.1)' 
            : 'hsl(var(--card))',
          borderColor: hasActiveFilters 
            ? 'hsl(var(--primary))' 
            : 'hsl(var(--border))',
          color: hasActiveFilters 
            ? 'hsl(var(--primary))' 
            : 'hsl(var(--foreground))'
        }}
        onMouseEnter={(e) => {
          if (!hasActiveFilters) {
            e.currentTarget.style.backgroundColor = 'hsl(var(--muted))';
          }
        }}
        onMouseLeave={(e) => {
          if (!hasActiveFilters) {
            e.currentTarget.style.backgroundColor = 'hsl(var(--card))';
          }
        }}
        title="Filter documents"
      >
        <Filter className="w-5 h-5" />
        {hasActiveFilters && (
          <span 
            className="text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))'
            }}
          >
            {Object.values(filters).filter(v => v && v.trim() !== "").length}
          </span>
        )}
      </button>

      {/* Filter Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className="sm:max-w-md border"
          style={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))'
          }}
        >
          <DialogHeader 
            className="border-b pb-4"
            style={{ borderColor: 'hsl(var(--border))' }}
          >
            <DialogTitle 
              className="flex items-center gap-3"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'hsl(var(--primary))' }}
              >
                <Filter 
                  className="h-5 w-5"
                  style={{ color: 'hsl(var(--primary-foreground))' }}
                />
              </div>
              <span className="font-semibold text-lg">Filter Documents</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4 max-h-[60vh] overflow-y-auto">
            {/* Category Filter */}
            <div className="space-y-2">
              <Label 
                className="font-medium text-sm"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                Category
              </Label>
              <Select 
                value={filters.category || "all"} 
                onValueChange={(value) => handleFilterChange("category", value === "all" ? "" : value)}
              >
                <SelectTrigger 
                  className="border transition-colors h-11"
                  style={{
                    backgroundColor: 'hsl(var(--muted))',
                    borderColor: 'hsl(var(--primary))'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                  }}
                >
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent 
                  className="border"
                  style={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))'
                  }}
                >
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
              <Label 
                className="font-medium text-sm"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                Language
              </Label>
              <Select 
                value={filters.language || "all"} 
                onValueChange={(value) => handleFilterChange("language", value === "all" ? "" : value)}
              >
                <SelectTrigger 
                  className="border transition-colors h-11"
                  style={{
                    backgroundColor: 'hsl(var(--muted))',
                    borderColor: 'hsl(var(--border))'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--border))';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--border))';
                  }}
                >
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent 
                  className="border"
                  style={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))'
                  }}
                >
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
              <Label 
                className="font-medium text-sm"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                Document Type
              </Label>
              <div className="relative">
                <Select 
                  value={filters.document_type || "all"} 
                  onValueChange={(value) => handleFilterChange("document_type", value === "all" ? "" : value)}
                >
                  <SelectTrigger 
                    className="border transition-colors h-11"
                    style={{
                      backgroundColor: 'hsl(var(--muted))',
                      borderColor: 'hsl(var(--border))'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--border))';
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--border))';
                    }}
                  >
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent 
                    className="border"
                    style={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))'
                    }}
                  >
                    <SelectItem value="all">All Types</SelectItem>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Document ID Search */}
            <div className="space-y-2">
              <Label 
                className="font-medium text-sm"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                Document ID (contains)
              </Label>
              <Input
                value={filters.document_id || ""}
                onChange={(e) => handleFilterChange("document_id", e.target.value)}
                placeholder="e.g., RTEAct, NEP2020, RUSA"
                className="border transition-colors h-11"
                style={{
                  backgroundColor: 'hsl(var(--muted))',
                  borderColor: 'hsl(var(--border))'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--border))';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                  e.currentTarget.style.boxShadow = '0 0 0 3px hsl(var(--ring) / 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--border))';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label 
                className="font-medium text-sm flex items-center gap-2"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                <Calendar 
                  className="h-4 w-4"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                />
                Published Date Range
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    type="date"
                    value={filters.date_from || ""}
                    onChange={(e) => handleFilterChange("date_from", e.target.value)}
                    className="border transition-colors h-11"
                    style={{
                      backgroundColor: 'hsl(var(--muted))',
                      borderColor: 'hsl(var(--border))'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--border))';
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                      e.currentTarget.style.boxShadow = '0 0 0 3px hsl(var(--ring) / 0.2)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--border))';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <Input
                    type="date"
                    value={filters.date_to || ""}
                    onChange={(e) => handleFilterChange("date_to", e.target.value)}
                    className="border transition-colors h-11"
                    style={{
                      backgroundColor: 'hsl(var(--muted))',
                      borderColor: 'hsl(var(--border))'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--border))';
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                      e.currentTarget.style.boxShadow = '0 0 0 3px hsl(var(--ring) / 0.2)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--border))';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div 
                className="space-y-2 pt-2 border-t"
                style={{ borderColor: 'hsl(var(--border))' }}
              >
                <p 
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  Active Filters:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value || value.trim() === "") return null;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => clearSingleFilter(key as keyof SearchFilters)}
                        className="px-3 py-1.5 border rounded-lg text-xs flex items-center gap-2 transition-colors"
                        style={{
                          backgroundColor: 'hsl(var(--primary) / 0.1)',
                          borderColor: 'hsl(var(--primary) / 0.3)',
                          color: 'hsl(var(--primary))'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.2)';
                          e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.1)';
                          e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.3)';
                        }}
                      >
                        <span className="font-semibold">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span className="font-medium">
                          {value.length > 20 ? value.substring(0, 20) + "..." : value}
                        </span>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div 
            className="flex gap-3 pt-4 border-t"
            style={{ borderColor: 'hsl(var(--border))' }}
          >
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="flex-1 h-11"
            >
              Clear All
            </Button>
            <Button
              onClick={applyFilters}
              className="flex-1 h-11"
            >
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}