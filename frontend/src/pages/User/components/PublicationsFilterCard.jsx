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
  Shield,
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

  // role flags
  showCampusFilters = false,
  isSuperAdmin = false,
  userRole = "user", // "user", "campus_admin", "super_admin"
}) {
  // Define field groups based on role
  const getFieldGroups = () => {
    const baseEssentialFields = ["title", "authors", "journal", "publisher", "year", "qRating"];
    const baseAdditionalFields = Object.keys(exportFields || {}).filter(
      (f) => !baseEssentialFields.includes(f)
    );

    if (isSuperAdmin || userRole === "super_admin") {
      return {
        essential: [...baseEssentialFields, "claimedBy", "department", "campus"],
        administrative: ["publicationId", "authorNo", "isStudentScholar", "studentScholars", "typeOfIssue"],
        technical: ["doi", "pageNo", "publicationType", "subjectArea", "subjectCategories"],
        metadata: baseAdditionalFields.filter(f => 
          !["publicationId", "authorNo", "isStudentScholar", "studentScholars", "typeOfIssue", 
            "doi", "pageNo", "publicationType", "subjectArea", "subjectCategories",
            "claimedBy", "department", "campus"].includes(f)
        )
      };
    } else if (showCampusFilters || userRole === "campus_admin") {
      return {
        essential: [...baseEssentialFields, "claimedBy", "department"],
        additional: baseAdditionalFields.filter(f => !["claimedBy", "department"].includes(f))
      };
    } else {
      return {
        essential: baseEssentialFields,
        additional: baseAdditionalFields
      };
    }
  };

  const fieldGroups = getFieldGroups();

  const getFieldLabel = (field) => {
    const labels = {
      'qRating': 'Q Rating',
      'doi': 'DOI',
      'publicationType': 'Publication Type',
      'subjectArea': 'Subject Area',
      'subjectCategories': 'Subject Categories',
      'claimedBy': 'Claimed By',
      'authorNo': 'Author Number',
      'isStudentScholar': 'Student Scholar',
      'studentScholars': 'Scholar Names',
      'typeOfIssue': 'Type of Issue',
      'publicationId': 'Publication ID',
      'pageNo': 'Page Numbers',
      'department': 'Department',
      'campus': 'Campus',
    };
    
    return labels[field] || field.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
  };

  const renderFieldGroup = (fields, groupTitle, icon = null) => {
    if (!fields || fields.length === 0) return null;

    return (
      <div>
        <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
          {icon && icon}
          {groupTitle}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {fields.map((field) => (
            <div key={field} className="flex items-center space-x-2">
              <Checkbox
                id={field}
                checked={exportFields?.[field] || false}
                onCheckedChange={(v) => onExportFieldsChange((prev) => ({ ...prev, [field]: !!v }))}
                className="border-blue-300"
              />
              <label htmlFor={field} className="text-sm font-medium text-gray-700">
                {getFieldLabel(field)}
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getRoleDescription = () => {
    if (isSuperAdmin || userRole === "super_admin") {
      return "Filter and manage all system publications with administrative controls";
    } else if (showCampusFilters || userRole === "campus_admin") {
      return "Filter and manage institute publications";
    } else {
      return "Filter and manage your publications";
    }
  };

  const getSearchPlaceholder = () => {
    if (isSuperAdmin || userRole === "super_admin") {
      return "Search across all campuses, departments, faculty, and publications...";
    } else if (showCampusFilters || userRole === "campus_admin") {
      return "Search title, journal, authors, or faculty...";
    } else {
      return "Search title, journal, or authors…";
    }
  };

  return (
    <Card className="mb-6 border border-blue-100 shadow-md bg-white">
      <CardHeader className="bg-blue-50 border-b border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Filter className="h-5 w-5 text-blue-600" />
              Filters & Actions
              {(isSuperAdmin || userRole === "super_admin") && (
                <Shield className="h-4 w-4 text-amber-600" title="Super Admin" />
              )}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {getRoleDescription()}
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
                {(isSuperAdmin || userRole === "super_admin") ? "Advanced Export" : "Custom Export"}
              </Button>

              <DialogContent className="max-w-3xl bg-white">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-gray-900">
                    <Settings className="h-5 w-5 text-blue-600" />
                    {(isSuperAdmin || userRole === "super_admin") ? "Advanced Export Configuration" : "Customize Export Fields"}
                    {(isSuperAdmin || userRole === "super_admin") && (
                      <Shield className="h-4 w-4 text-amber-600" />
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Select the fields to include in your CSV export.
                    {(isSuperAdmin || userRole === "super_admin") && " As super admin, you have access to all system fields."}
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-96">
                  <div className="space-y-4 p-4">
                    {/* Essential Fields */}
                    {renderFieldGroup(fieldGroups.essential, "Essential Fields")}

                    <Separator className="bg-blue-100" />

                    {/* Role-specific field groups */}
                    {(isSuperAdmin || userRole === "super_admin") ? (
                      <>
                        {renderFieldGroup(
                          fieldGroups.administrative, 
                          "Administrative Fields", 
                          <Shield className="h-4 w-4 text-amber-600" />
                        )}
                        
                        <Separator className="bg-blue-100" />
                        
                        {renderFieldGroup(
                          fieldGroups.technical, 
                          "Technical Fields", 
                          <Settings className="h-4 w-4 text-blue-600" />
                        )}
                        
                        {fieldGroups.metadata && fieldGroups.metadata.length > 0 && (
                          <>
                            <Separator className="bg-blue-100" />
                            {renderFieldGroup(fieldGroups.metadata, "Metadata Fields")}
                          </>
                        )}
                      </>
                    ) : (
                      renderFieldGroup(fieldGroups.additional, "Additional Fields")
                    )}
                  </div>
                </ScrollArea>

                <DialogFooter className="bg-gray-50 border-t border-blue-100">
                  <Button variant="outline" onClick={() => onExportDialogOpenChange(false)} className="border-gray-300">
                    Cancel
                  </Button>
                  <Button 
                    onClick={onExport} 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!exportFields || Object.values(exportFields).every(v => !v)}
                  >
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
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${showCampusFilters || isSuperAdmin ? 'lg:grid-cols-8' : 'lg:grid-cols-6'}`}>
          {/* Search */}
          <div className={(showCampusFilters || isSuperAdmin) ? "lg:col-span-2" : "lg:col-span-2"}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={getSearchPlaceholder()}
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

          {/* Campus Admin & Super Admin Specific Filters */}
          {(showCampusFilters || isSuperAdmin || userRole === "campus_admin" || userRole === "super_admin") && (
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
              {(showCampusFilters || isSuperAdmin) && selectedAuthor !== "all" && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                  <Users className="h-3 w-3 mr-1" />
                  Author: {selectedAuthor}
                </Badge>
              )}
              {(showCampusFilters || isSuperAdmin) && selectedDepartment !== "all" && (
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