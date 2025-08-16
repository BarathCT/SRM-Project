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
  Shield
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
  const fallbackAvailableFields = useMemo(() => {
    if (Array.isArray(availableFields) && availableFields.length > 0) {
      return availableFields;
    }
    return Object.keys(fallbackFields);
  }, [availableFields, fallbackFields]);

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
    let fields = showSelectedOnly ? selectedFields : allFields;
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
      <DialogContent className="w-full max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2 border-b bg-white flex-shrink-0">
          <div className="flex justify-between items-center flex-wrap gap-y-2">
            <div className="flex items-center gap-3 min-w-0">
              <Download className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <DialogTitle className="text-lg font-semibold truncate">
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
        <div className="flex flex-wrap gap-2 items-center px-4 pt-3 pb-2 bg-white z-10 border-b">
          <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search fields..."
              className="pl-9 h-9 pr-8"
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
            className="h-9 px-3 flex items-center"
          >
            {showSelectedOnly ? (
              <Eye className="h-4 w-4 mr-2" />
            ) : (
              <EyeOff className="h-4 w-4 mr-2" />
            )}
            Selected Only
          </Button>
        </div>
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 items-center px-4 py-2 bg-white z-10 border-b">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            Clear All
          </Button>
          <Separator orientation="vertical" className="h-5 mx-2 hidden sm:block" />
          <Badge variant="secondary" className="h-7 px-2 flex items-center">
            Selected: {selectedFields.length}/{allFields.length}
          </Badge>
        </div>
        {/* Main Content */}
        <div className="flex-1 min-h-0 overflow-auto bg-gray-50">
          <ScrollArea className="h-full w-full">
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 min-h-[350px]">
              {filteredFields.map(field => {
                const isChecked = !!localExportFields[field];
                const displayName = getFieldDisplayName(field);
                return (
                  <label
                    key={field}
                    className="flex items-start gap-3 p-3 rounded bg-white hover:bg-gray-50 cursor-pointer border shadow-sm transition-colors"
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
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-white border rounded-lg">
                  <Search className="h-8 w-8 text-gray-300 mb-4" />
                  <h4 className="font-medium text-gray-700">No matching fields found</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    {showSelectedOnly
                      ? "No fields are currently selected"
                      : "Try a different search term"}
                  </p>
                  <Button variant="outline" onClick={resetSearch}>
                    Reset Filters
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        {/* Footer */}
        <DialogFooter className="p-4 border-t bg-white flex flex-col sm:flex-row justify-between gap-3">
          <div className="text-sm text-gray-500 flex items-center">
            {selectedFields.length > 0 ? (
              <span>Ready to export {selectedFields.length} fields</span>
            ) : (
              <span>Select at least one field to enable export</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onExport?.(selectedFields);
                onOpenChange?.(false);
              }}
              disabled={selectedFields.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export ({selectedFields.length})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportFieldsDialog;