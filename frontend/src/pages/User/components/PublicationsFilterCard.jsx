import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Search,
  Filter,
  X,
  Square,
  Trash2,
  Users,
  Building,
  Shield,
  FileSpreadsheet,
  GraduationCap,
  MapPin
} from "lucide-react";

import ExportFieldsDialog from "./ExportFieldsDialog";

/**
 * PublicationsFilterCard
 * Optimized and compact filter component with organizational fields support.
 */
export default function PublicationsFilterCard(props) {
  const {
    // options
    filterOptions,

    // standard values
    searchTerm,
    selectedYear,
    selectedQRating,
    selectedPublicationType,
    selectedSubjectArea,

    // organizational filters
    selectedAuthor,
    selectedDepartment,
    selectedCollege,
    selectedInstitute,
    selectedCampus,

    // standard handlers
    onSearchTermChange,
    onYearChange,
    onQRatingChange,
    onPublicationTypeChange,
    onSubjectAreaChange,

    // organizational handlers
    onAuthorChange,
    onDepartmentChange,
    onCollegeChange,
    onInstituteChange,
    onCampusChange,

    // selection / actions
    hasActiveFilters,
    onClearFilters,
    selectedCount = 0,
    onClearSelection,
    onBulkDelete,

    // export state & handlers
    exportDialogOpen,
    onExportDialogOpenChange,
    exportFields,
    onExportFieldsChange,
    onExport,

    // role flags
    showCampusFilters = false,
    isSuperAdmin = false,
    userRole = "user"
  } = props;

  const isSuper = isSuperAdmin || userRole === "super_admin";
  const showExtended = isSuper || showCampusFilters || userRole === "campus_admin";

  const getRoleDescription = () => {
    if (isSuper) return "Filter and manage all system publications.";
    if (showCampusFilters || userRole === "campus_admin") return "Filter and manage institute publications.";
    return "Filter and manage your publications.";
  };

  const getSearchPlaceholder = () => {
    if (isSuper) return "Search across campuses, departments, faculty, publications…";
    if (showCampusFilters || userRole === "campus_admin") return "Search title, journal, authors, or faculty…";
    return "Search title, journal, or authors…";
  };

  // Count active organizational filters
  const activeOrgFilters = [
    selectedAuthor !== "all",
    selectedDepartment !== "all", 
    selectedCollege !== "all",
    selectedInstitute !== "all",
    selectedCampus !== "all"
  ].filter(Boolean).length;

  return (
    <>
      <Card className="mb-4 border border-blue-100 shadow-sm bg-white">
        <CardHeader className="bg-white-50 border-b border-blue-100 pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
                <Filter className="h-5 w-5 text-blue-600" />
                Filters & Actions
                {isSuper && <Shield className="h-4 w-4 text-amber-600" title="Super Admin" />}
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm">
                {getRoleDescription()}
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              {hasActiveFilters && (
                <Button
                  onClick={onClearFilters}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 hover:bg-blue-50 h-8 px-3 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear Filters
                </Button>
              )}

              {selectedCount > 0 && (
                <>
                  <Button
                    onClick={onClearSelection}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 hover:bg-gray-50 h-8 px-3 text-xs"
                  >
                    <Square className="h-3 w-3 mr-1" />
                    Clear Selection
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 h-8 px-3 text-xs"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete ({selectedCount})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900">
                          Delete Selected Publications
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600">
                          This action cannot be undone. {selectedCount} publication
                          {selectedCount > 1 ? "s" : ""} will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-300">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={onBulkDelete}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete {selectedCount}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

              <Button
                onClick={() => onExportDialogOpenChange(true)}
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-xs"
              >
                <FileSpreadsheet className="h-3 w-3 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 bg-white">
          {/* Basic Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={getSearchPlaceholder()}
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white h-8 text-sm"
                />
              </div>
            </div>

            {/* Year */}
            <Select value={selectedYear} onValueChange={onYearChange}>
              <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white h-8 text-sm">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="bg-white border-blue-200">
                <SelectItem value="all">All Years</SelectItem>
                {filterOptions.years?.map((y) => (
                  <SelectItem key={y} value={String(y)} className="text-sm">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Q Rating */}
            <Select value={selectedQRating} onValueChange={onQRatingChange}>
              <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white h-8 text-sm">
                <SelectValue placeholder="Q Rating" />
              </SelectTrigger>
              <SelectContent className="bg-white border-blue-200">
                <SelectItem value="all">All Q Ratings</SelectItem>
                {filterOptions.qRatings?.map((q) => (
                  <SelectItem key={q} value={q} className="text-sm">
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Publication Type */}
            <Select value={selectedPublicationType} onValueChange={onPublicationTypeChange}>
              <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white h-8 text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-white border-blue-200">
                <SelectItem value="all">All Types</SelectItem>
                {filterOptions.publicationTypes?.map((t) => (
                  <SelectItem key={t} value={t} className="text-sm">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Subject Area */}
            <Select value={selectedSubjectArea} onValueChange={onSubjectAreaChange}>
              <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white h-8 text-sm">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent className="bg-white border-blue-200">
                <SelectItem value="all">All Subjects</SelectItem>
                {filterOptions.subjectAreas?.map((a) => (
                  <SelectItem key={a} value={a} className="text-sm">
                    {a.length > 25 ? a.substring(0, 25) + "..." : a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Extended Organizational Filters */}
          {showExtended && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <Select value={selectedAuthor} onValueChange={onAuthorChange}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white h-8 text-sm">
                  <SelectValue placeholder="Author" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200">
                  <SelectItem value="all">All Authors</SelectItem>
                  {filterOptions.authors?.map((author) => (
                    <SelectItem key={author} value={author} className="text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-blue-600" />
                        {author.length > 20 ? author.substring(0, 20) + "..." : author}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white h-8 text-sm">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200">
                  <SelectItem value="all">All Departments</SelectItem>
                  {filterOptions.departments?.map((dept) => (
                    <SelectItem key={dept} value={dept} className="text-sm">
                      <div className="flex items-center gap-2">
                        <Building className="h-3 w-3 text-blue-600" />
                        {dept.length > 20 ? dept.substring(0, 20) + "..." : dept}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCollege} onValueChange={onCollegeChange}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white h-8 text-sm">
                  <SelectValue placeholder="College" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200">
                  <SelectItem value="all">All Colleges</SelectItem>
                  {filterOptions.colleges?.map((college) => (
                    <SelectItem key={college} value={college} className="text-sm">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-3 w-3 text-green-600" />
                        {college.length > 20 ? college.substring(0, 20) + "..." : college}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedInstitute} onValueChange={onInstituteChange}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white h-8 text-sm">
                  <SelectValue placeholder="Institute" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200">
                  <SelectItem value="all">All Institutes</SelectItem>
                  {filterOptions.institutes?.map((institute) => (
                    <SelectItem key={institute} value={institute} className="text-sm">
                      <div className="flex items-center gap-2">
                        <Building className="h-3 w-3 text-purple-600" />
                        {institute.length > 20 ? institute.substring(0, 20) + "..." : institute}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCampus} onValueChange={onCampusChange}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white h-8 text-sm">
                  <SelectValue placeholder="Campus" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200">
                  <SelectItem value="all">All Campuses</SelectItem>
                  {filterOptions.campuses?.map((campus) => (
                    <SelectItem key={campus} value={campus} className="text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-amber-600" />
                        {campus.length > 20 ? campus.substring(0, 20) + "..." : campus}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-xs font-medium text-blue-700 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Active:
                </span>
                {searchTerm && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs h-5">
                    Search: "{searchTerm.length > 15 ? searchTerm.substring(0, 15) + "..." : searchTerm}"
                  </Badge>
                )}
                {selectedYear !== "all" && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs h-5">
                    Year: {selectedYear}
                  </Badge>
                )}
                {selectedQRating !== "all" && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs h-5">
                    Q: {selectedQRating}
                  </Badge>
                )}
                {selectedPublicationType !== "all" && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs h-5">
                    Type: {selectedPublicationType}
                  </Badge>
                )}
                {selectedSubjectArea !== "all" && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs h-5">
                    Subject: {selectedSubjectArea.length > 15 ? selectedSubjectArea.substring(0, 15) + "..." : selectedSubjectArea}
                  </Badge>
                )}
                {showExtended && activeOrgFilters > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300 text-xs h-5">
                    +{activeOrgFilters} org filter{activeOrgFilters > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unified Export Dialog */}
      <ExportFieldsDialog
        open={exportDialogOpen}
        onOpenChange={onExportDialogOpenChange}
        exportFields={exportFields}
        onExportFieldsChange={onExportFieldsChange}
        onExport={onExport}
        isSuperAdmin={isSuperAdmin}
        userRole={userRole}
      />
    </>
  );
}