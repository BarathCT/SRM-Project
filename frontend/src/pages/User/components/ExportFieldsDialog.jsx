import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Search,
  RotateCcw,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  ArrowLeft
} from "lucide-react";

const DEFAULT_LABELS = {
  qRating: "Q Rating",
  doi: "DOI",
  publicationType: "Publication Type",
  subjectArea: "Subject Area",
  subjectCategories: "Subject Categories",
  claimedBy: "Claimed By",
  authorNo: "Author Number",
  isStudentScholar: "Student Scholar",
  studentScholars: "Scholar Names",
  typeOfIssue: "Type of Issue",
  publicationId: "Publication ID",
  pageNo: "Page Numbers",
  department: "Department",
  college: "College",
  institute: "Institute",
  campus: "Campus"
};

const ExportFieldsDialog = ({
  open,
  onOpenChange,
  exportFields,
  onExportFieldsChange,
  onExport,
  isSuperAdmin = false,
  userRole = "user",
  availableFields,
  labels = DEFAULT_LABELS
}) => {
  // Defensive: always have a non-empty object
  const fallbackFields = useMemo(() => {
    if (exportFields && Object.keys(exportFields).length) return exportFields;
    // fallback to all availableFields as true
    if (Array.isArray(availableFields) && availableFields.length > 0) {
      return Object.fromEntries(availableFields.map(f => [f, true]));
    }
    // fallback to some sensible system-wide defaults
    return {
      qRating: true,
      doi: true,
      publicationType: true,
      subjectArea: true,
      claimedBy: true,
      department: true,
      college: true,
      institute: true,
      campus: true
    };
  }, [exportFields, availableFields]);

  // Defensive: always have a non-empty array
  // Derive availableFields from exportFields if not provided
  const fallbackAvailableFields = useMemo(() => {
    if (Array.isArray(availableFields) && availableFields.length > 0) {
      return availableFields;
    }
    // If exportFields is provided, use its keys
    if (exportFields && Object.keys(exportFields).length > 0) {
      return Object.keys(exportFields);
    }
    // Otherwise use fallbackFields keys
    return Object.keys(fallbackFields);
  }, [availableFields, exportFields, fallbackFields]);

  const [search, setSearch] = useState("");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [localExportFields, setLocalExportFields] = useState(fallbackFields);

  // Keep local state in sync with prop changes
  useEffect(() => {
    setLocalExportFields(fallbackFields);
  }, [fallbackFields]);

  const allFields = useMemo(() => fallbackAvailableFields, [fallbackAvailableFields]);

  const selectedFields = useMemo(
    () => allFields.filter(field => localExportFields[field]),
    [allFields, localExportFields]
  );

  const filteredFields = useMemo(() => {
    const q = search.toLowerCase().trim();
    // First filter by selection state if "Selected Only" is active
    let fields = showSelectedOnly ? selectedFields : allFields;
    // Then apply search filter if present
    if (q) {
      fields = fields.filter(
        f =>
          f.toLowerCase().includes(q) ||
          (labels[f]?.toLowerCase().includes(q))
      );
    }
    return fields;
  }, [search, allFields, labels, showSelectedOnly, selectedFields]);

  const toggleField = useCallback(
    (field, value) => {
      setLocalExportFields(prev => {
        const newFields = { ...prev, [field]: value };
        onExportFieldsChange?.(newFields);
        return newFields;
      });
    },
    [onExportFieldsChange]
  );

  const clearAll = useCallback(() => {
    const newFields = Object.fromEntries(allFields.map(f => [f, false]));
    setLocalExportFields(newFields);
    onExportFieldsChange?.(newFields);
  }, [allFields, onExportFieldsChange]);

  const selectAll = useCallback(() => {
    const newFields = Object.fromEntries(allFields.map(f => [f, true]));
    setLocalExportFields(newFields);
    onExportFieldsChange?.(newFields);
  }, [allFields, onExportFieldsChange]);

  const resetSearch = useCallback(() => {
    setSearch("");
    setShowSelectedOnly(false);
  }, []);

  useEffect(() => {
    if (!open) resetSearch();
  }, [open, resetSearch]);

  const getFieldDisplayName = field =>
    labels[field] ||
    field.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-none md:max-w-4xl w-screen md:w-auto h-screen md:h-[90vh] m-0 rounded-none md:rounded-lg p-0 overflow-hidden !translate-x-0 !translate-y-0 md:translate-x-[-50%] md:translate-y-[-50%] top-0 left-0 right-0 bottom-0 md:top-[50%] md:left-[50%] md:right-auto md:bottom-auto"
        showCloseButton={true}
      >
        <DialogHeader className="px-4 pt-4 pb-2 border-b border-gray-200 bg-white flex-shrink-0 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange?.(false)}
            className="absolute left-0 top-4 -ml-2 p-2 hover:bg-gray-100 md:hidden"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Button>
          <div className="flex justify-between items-center flex-wrap gap-y-2 md:pl-0 pl-8">
            <div className="flex items-center gap-3 min-w-0">
              <Download className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <DialogTitle className="text-lg font-semibold truncate pr-8 md:pr-0">
                  Export Publications
                </DialogTitle>
                <DialogDescription className="text-sm truncate">
                  Select fields to include in CSV export
                </DialogDescription>
              </div>
              {isSuperAdmin && (
                <Shield
                  className="h-4 w-4 text-blue-600 ml-2 flex-shrink-0"
                  title="Super Admin Scope"
                />
              )}
            </div>
          </div>
        </DialogHeader>
        {/* Search/Filter */}
        <div className="flex flex-wrap gap-2 items-center px-4 pt-3 pb-2 bg-white z-10 border-b border-gray-200">
          <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search fields..."
              className="pl-9 h-9 pr-8 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-gray-300"
            />
            {(search || showSelectedOnly) && (
              <button
                onClick={resetSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Reset search"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            variant={showSelectedOnly ? "default" : "outline"}
            onClick={() => setShowSelectedOnly(x => !x)}
            className={`h-9 px-3 flex items-center border-gray-300 transition-all ${
              showSelectedOnly ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600" : ""
            }`}
            disabled={selectedFields.length === 0}
            title={
              selectedFields.length === 0
                ? "Select at least one field to use this filter"
                : showSelectedOnly
                ? "Show all fields"
                : "Show only selected fields"
            }
          >
            {showSelectedOnly ? (
              <Eye className="h-4 w-4 mr-2" />
            ) : (
              <EyeOff className="h-4 w-4 mr-2" />
            )}
            <span className="mr-2">{showSelectedOnly ? "Show All" : "Selected Only"}</span>
            {selectedFields.length > 0 && (
              <Badge 
                variant="secondary" 
                className={`ml-1 h-5 px-1.5 text-xs ${
                  showSelectedOnly 
                    ? "bg-blue-500 text-white border-0" 
                    : "bg-gray-100 text-gray-700 border-gray-300"
                }`}
              >
                {selectedFields.length}
              </Badge>
            )}
          </Button>
        </div>
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 items-center px-4 py-2 bg-white z-10 border-b border-gray-200">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={selectAll}
            className="border-gray-300"
            disabled={selectedFields.length === allFields.length}
          >
            Select All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAll}
            className="border-gray-300"
            disabled={selectedFields.length === 0}
          >
            Clear All
          </Button>
          <Separator orientation="vertical" className="h-5 mx-2 hidden sm:block" />
          <Badge variant="secondary" className="h-7 px-3 flex items-center bg-blue-50 text-blue-700 border-blue-200">
            {selectedFields.length} / {allFields.length} selected
          </Badge>
        </div>
        {/* Main Content */}
        <div className="flex-1 min-h-0 overflow-auto bg-gray-50">
          {showSelectedOnly && selectedFields.length > 0 && (
            <div className="px-4 pt-3 pb-2 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Eye className="h-4 w-4" />
                <span className="font-medium">Showing {selectedFields.length} selected field{selectedFields.length !== 1 ? 's' : ''} only</span>
              </div>
            </div>
          )}
          <ScrollArea className="h-full w-full">
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 min-h-[350px]">
              {filteredFields.map(field => {
                const isChecked = !!localExportFields[field];
                const displayName = getFieldDisplayName(field);
                return (
                  <label
                    key={field}
                    className="flex items-start gap-3 p-3 rounded bg-white hover:bg-gray-50 cursor-pointer border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={checked => toggleField(field, checked)}
                      className="h-4 w-4 mt-0.5 flex-shrink-0"
                    />
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-sm break-words whitespace-normal">{displayName}</span>
                    </div>
                  </label>
                );
              })}
              {filteredFields.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center bg-white border border-gray-200 rounded-lg">
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    {showSelectedOnly ? (
                      <EyeOff className="h-8 w-8 text-gray-400" />
                    ) : (
                      <Search className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <h4 className="text-base font-semibold text-gray-800 mb-2">
                    {showSelectedOnly 
                      ? "No selected fields match your search" 
                      : "No matching fields found"}
                  </h4>
                  <p className="text-sm text-gray-500 mb-6 max-w-sm">
                    {showSelectedOnly
                      ? search
                        ? `None of your ${selectedFields.length} selected field${selectedFields.length !== 1 ? 's' : ''} match "${search}". Try a different search term.`
                        : "No fields are currently selected. Select fields to include in your export."
                      : "Try a different search term or clear the filters to see all available fields."}
                  </p>
                  <div className="flex gap-2">
                    {search && (
                      <Button variant="outline" onClick={() => setSearch("")} className="border-gray-300">
                        Clear Search
                      </Button>
                    )}
                    {(showSelectedOnly || search) && (
                      <Button variant="outline" onClick={resetSearch} className="border-gray-300">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset All Filters
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        {/* Footer */}
        <DialogFooter className="p-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row justify-between gap-3">
          <div className="text-sm text-gray-600 flex items-center gap-2">
            {selectedFields.length > 0 ? (
              <>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  {selectedFields.length} selected
                </Badge>
                <span className="text-gray-500">Ready to export</span>
              </>
            ) : (
              <span className="text-gray-500 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Select at least one field to enable export
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange?.(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onExport?.(selectedFields);
                onOpenChange?.(false);
              }}
              disabled={selectedFields.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              Export {selectedFields.length > 0 && `(${selectedFields.length})`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportFieldsDialog;