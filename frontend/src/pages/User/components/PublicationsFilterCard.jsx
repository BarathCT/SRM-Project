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
  Users,
  Building,
} from "lucide-react";

export default function PublicationsFilterCard({
  // options
  filterOptions,

  // standard values
  searchTerm,
  selectedYear,
  selectedQRating,
  selectedPublicationType,
  selectedSubjectArea,

  // campus admin specific values (optional)
  selectedAuthor,
  selectedDepartment,

  // standard value handlers
  onSearchTermChange,
  onYearChange,
  onQRatingChange,
  onPublicationTypeChange,
  onSubjectAreaChange,

  // campus admin specific handlers (optional)
  onAuthorChange,
  onDepartmentChange,

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

  // campus admin flag
  showCampusFilters = false,
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
              {showCampusFilters ? "Filter and manage institute publications" : "Filter and manage your publications"}
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
                        This action cannot be undone. {selectedCount} publication{selectedCount > 1 ? 's' : ''} will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onBulkDelete} className="bg-red-600 hover:bg-red-700">
                        Delete {selectedCount} Publication{selectedCount > 1 ? 's' : ''}
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
                    Select the fields to include in your CSV export.
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-96">
                  <div className="space-y-4 p-4">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-3">Essential Fields</h4>
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
                              {field === 'qRating' ? 'Q Rating' : field.replace(/([A-Z])/g, " $1")}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-blue-100" />

                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-3">Additional Fields</h4>
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
                                {field === 'doi' ? 'DOI' : 
                                 field === 'publicationType' ? 'Publication Type' :
                                 field === 'subjectArea' ? 'Subject Area' :
                                 field === 'subjectCategories' ? 'Subject Categories' :
                                 field === 'claimedBy' ? 'Claimed By' :
                                 field === 'authorNo' ? 'Author Number' :
                                 field === 'isStudentScholar' ? 'Student Scholar' :
                                 field === 'studentScholars' ? 'Scholar Names' :
                                 field === 'typeOfIssue' ? 'Type of Issue' :
                                 field === 'publicationId' ? 'Publication ID' :
                                 field === 'pageNo' ? 'Page Numbers' :
                                 field.replace(/([A-Z])/g, " $1")}
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
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${showCampusFilters ? 'lg:grid-cols-8' : 'lg:grid-cols-6'}`}>
          {/* Search */}
          <div className={showCampusFilters ? "lg:col-span-2" : "lg:col-span-2"}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={showCampusFilters ? "Search title, journal, authors, or faculty..." : "Search title, journal, or authors…"}
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
              {filterOptions.years?.map((y) => (
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
              {filterOptions.qRatings?.map((q) => (
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
              {filterOptions.publicationTypes?.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
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
              {filterOptions.subjectAreas?.map((a) => (
                <SelectItem key={a} value={a}>
                  {a.length > 30 ? a.substring(0, 30) + '...' : a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Campus Admin Specific Filters */}
          {showCampusFilters && (
            <>
              {/* Author Filter */}
              <Select value={selectedAuthor} onValueChange={onAuthorChange}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white">
                  <SelectValue placeholder="Author" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200">
                  <SelectItem value="all">All Authors</SelectItem>
                  {filterOptions.authors?.map((author) => (
                    <SelectItem key={author} value={author}>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-blue-600" />
                        {author}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Department Filter */}
              <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200">
                  <SelectItem value="all">All Departments</SelectItem>
                  {filterOptions.departments?.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      <div className="flex items-center gap-2">
                        <Building className="h-3 w-3 text-blue-600" />
                        {dept}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-blue-700 flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Active Filters:
              </span>
              {searchTerm && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                  Search: "{searchTerm}"
                </Badge>
              )}
              {selectedYear !== "all" && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                  Year: {selectedYear}
                </Badge>
              )}
              {selectedQRating !== "all" && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                  Q-Rating: {selectedQRating}
                </Badge>
              )}
              {selectedPublicationType !== "all" && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                  Type: {selectedPublicationType}
                </Badge>
              )}
              {selectedSubjectArea !== "all" && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                  Subject: {selectedSubjectArea.length > 20 ? selectedSubjectArea.substring(0, 20) + '...' : selectedSubjectArea}
                </Badge>
              )}
              {showCampusFilters && selectedAuthor !== "all" && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                  <Users className="h-3 w-3 mr-1" />
                  Author: {selectedAuthor}
                </Badge>
              )}
              {showCampusFilters && selectedDepartment !== "all" && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-300">
                  <Building className="h-3 w-3 mr-1" />
                  Dept: {selectedDepartment}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}