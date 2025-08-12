import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Filter,
  Settings,
  FileSpreadsheet,
  X,
  Square,
  Trash2,
  Download,
} from "lucide-react";

export default function PublicationsFilterCard({
  // options
  filterOptions,

  // values
  searchTerm,
  selectedYear,
  selectedQRating,
  selectedPublicationType,
  selectedSubjectArea,

  // value handlers
  onSearchTermChange,
  onYearChange,
  onQRatingChange,
  onPublicationTypeChange,
  onSubjectAreaChange,

  // actions
  hasActiveFilters,
  onClearFilters,
  selectedCount = 0,
  onClearSelection,
  onBulkDelete,

  // export
  exportDialogOpen,
  onExportDialogOpenChange,
  exportFields,
  onExportFieldsChange,
  onExport,
}) {
  return (
    <Card className="mb-6 border border-blue-100 shadow-md bg-white">
      <CardHeader className="bg-blue-50 border-b border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Filter className="h-5 w-5 text-blue-600" />
              Filters & Actions
            </CardTitle>
            <CardDescription className="text-gray-600">
              Filter and manage your publications
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            {hasActiveFilters && (
              <Button
                onClick={onClearFilters}
                variant="outline"
                size="sm"
                className="border-blue-200 hover:bg-blue-50"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}

            {selectedCount > 0 && (
              <>
                <Button
                  onClick={onClearSelection}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Clear Selection
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected ({selectedCount})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-gray-900">
                        Delete Selected Publications
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-600">
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onBulkDelete} className="bg-red-600 hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            <Dialog open={exportDialogOpen} onOpenChange={onExportDialogOpenChange}>
              <Button
                onClick={() => onExportDialogOpenChange(true)}
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Custom Export
              </Button>

              <DialogContent className="max-w-2xl bg-white">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-gray-900">
                    <Settings className="h-5 w-5 text-blue-600" />
                    Customize Export Fields
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Select the fields to include in your CSV.
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-96">
                  <div className="space-y-4 p-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-3">Essential</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {["title", "authors", "journal", "publisher", "year", "qRating"].map((field) => (
                          <div key={field} className="flex items-center space-x-2">
                            <Checkbox
                              id={field}
                              checked={exportFields[field]}
                              onCheckedChange={(v) => onExportFieldsChange((prev) => ({ ...prev, [field]: !!v }))}
                              className="border-blue-300"
                            />
                            <label htmlFor={field} className="text-sm font-medium capitalize text-gray-700">
                              {field.replace(/([A-Z])/g, " $1")}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-blue-100" />

                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-3">Additional</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.keys(exportFields)
                          .filter((f) => !["title", "authors", "journal", "publisher", "year", "qRating"].includes(f))
                          .map((field) => (
                            <div key={field} className="flex items-center space-x-2">
                              <Checkbox
                                id={field}
                                checked={exportFields[field]}
                                onCheckedChange={(v) => onExportFieldsChange((prev) => ({ ...prev, [field]: !!v }))}
                                className="border-blue-300"
                              />
                              <label htmlFor={field} className="text-sm font-medium capitalize text-gray-700">
                                {field.replace(/([A-Z])/g, " $1")}
                              </label>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                <DialogFooter className="bg-gray-50 border-t border-blue-100">
                  <Button variant="outline" onClick={() => onExportDialogOpenChange(false)} className="border-gray-300">
                    Cancel
                  </Button>
                  <Button onClick={onExport} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search title, journal, or authors…"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Year */}
          <Select value={selectedYear} onValueChange={onYearChange}>
            <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="bg-white border-blue-200">
              <SelectItem value="all">All Years</SelectItem>
              {filterOptions.years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Q Rating */}
          <Select value={selectedQRating} onValueChange={onQRatingChange}>
            <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white">
              <SelectValue placeholder="Q Rating" />
            </SelectTrigger>
            <SelectContent className="bg-white border-blue-200">
              <SelectItem value="all">All Q Ratings</SelectItem>
              {filterOptions.qRatings.map((q) => (
                <SelectItem key={q} value={q}>
                  {q}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Publication Type */}
          <Select value={selectedPublicationType} onValueChange={onPublicationTypeChange}>
            <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-white border-blue-200">
              <SelectItem value="all">All Types</SelectItem>
              {filterOptions.publicationTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Subject Area */}
          <Select value={selectedSubjectArea} onValueChange={onSubjectAreaChange}>
            <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white">
              <SelectValue placeholder="Subject Area" />
            </SelectTrigger>
            <SelectContent className="bg-white border-blue-200">
              <SelectItem value="all">All Subjects</SelectItem>
              {filterOptions.subjectAreas.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active filters */}
        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-blue-700 flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Active:
              </span>
              {searchTerm && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                  Search: {searchTerm}
                </Badge>
              )}
              {selectedYear !== "all" && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                  Year: {selectedYear}
                </Badge>
              )}
              {selectedQRating !== "all" && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                  Q: {selectedQRating}
                </Badge>
              )}
              {selectedPublicationType !== "all" && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                  Type: {selectedPublicationType}
                </Badge>
              )}
              {selectedSubjectArea !== "all" && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                  Subject: {selectedSubjectArea}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}