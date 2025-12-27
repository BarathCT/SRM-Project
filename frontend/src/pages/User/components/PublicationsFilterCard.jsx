import React, { useEffect, useMemo } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Search, Filter, X, Square, Trash2, Building, Shield, FileSpreadsheet
} from "lucide-react";
import ExportFieldsDialog from "./ExportFieldsDialog";
import { SUBJECT_AREAS } from "@/utils/subjectAreas";
import {
  getInstitutesForCollege,
  getDepartments,
  ALL_COLLEGE_NAMES,
  collegesWithoutInstitutes
} from "@/utils/collegeData";

/**
 * PublicationsFilterCard is fully DECOUPLED from the user sidebar filter.
 * It manages and exposes only publication-related filter state.
 * Selecting a college, institute, or department here does NOT affect the user sidebar filter,
 * and vice versa.
 */
export default function PublicationsFilterCard(props) {
  const {
    filterOptions,
    searchTerm,
    selectedYear,
    selectedQRating,
    selectedPublicationType,
    selectedSubjectArea,
    selectedSubjectCategory = "all",
    selectedCollege = "all",
    selectedInstitute = "all",
    selectedDepartment = "all",
    onSearchTermChange,
    onYearChange,
    onQRatingChange,
    onPublicationTypeChange,
    onSubjectAreaChange,
    onSubjectCategoryChange = () => {},
    onCollegeChange = () => {},
    onInstituteChange = () => {},
    onDepartmentChange = () => {},
    hasActiveFilters,
    onClearFilters,
    selectedCount = 0,
    onClearSelection,
    onBulkDelete,
    exportDialogOpen,
    onExportDialogOpenChange,
    exportFields,
    onExportFieldsChange,
    onExport,
    showCampusFilters = false,
    isSuperAdmin = false,
    userRole = "user",
    currentUser = null
  } = props;

  const isSuper = isSuperAdmin || userRole === "super_admin";
  const isCampusAdmin = userRole === "campus_admin";
  const showExtended = isSuper || showCampusFilters || isCampusAdmin;

  // Only publication filter state is used here; sidebar filter is a separate state in parent!
  const colleges = useMemo(() => ['all', ...ALL_COLLEGE_NAMES.filter(c => c !== 'N/A')], []);
  const institutes = useMemo(() => {
    if (isCampusAdmin) {
      if (!currentUser?.college || collegesWithoutInstitutes.includes(currentUser.college)) return [];
      return getInstitutesForCollege(currentUser.college).filter(i => i !== 'N/A');
    }
    if (selectedCollege === 'all') return [];
    const insts = getInstitutesForCollege(selectedCollege).filter(i => i !== 'N/A');
    return insts.length > 0 ? ['all', ...insts] : [];
  }, [isCampusAdmin, currentUser?.college, selectedCollege]);

  // --- UPDATED: Handle campus admin department logic ---
  const departments = useMemo(() => {
    if (isCampusAdmin) {
      if (!currentUser?.college) return [];
      if (collegesWithoutInstitutes.includes(currentUser.college)) {
        return getDepartments(currentUser.college, null).filter(d => d !== 'N/A');
      }
      if (!currentUser.institute || currentUser.institute === "all") return [];
      return getDepartments(currentUser.college, currentUser.institute).filter(d => d !== 'N/A');
    }
    if (selectedCollege === 'all') return [];
    if (collegesWithoutInstitutes.includes(selectedCollege)) {
      return getDepartments(selectedCollege, null).filter(d => d !== 'N/A');
    }
    if (selectedInstitute === 'all') return [];
    return getDepartments(selectedCollege, selectedInstitute).filter(d => d !== 'N/A');
  }, [
    isCampusAdmin,
    currentUser?.college,
    currentUser?.institute,
    selectedCollege,
    selectedInstitute
  ]);

  const showCollegeSelect = isSuper || (!isCampusAdmin && showCampusFilters);
  const showInstituteSelect = (isSuper || (!isCampusAdmin && showCampusFilters)) && institutes.length > 0;
  const showDepartmentSelect = (
    isCampusAdmin ||
    departments.length > 0 ||
    (collegesWithoutInstitutes.includes(selectedCollege) && selectedCollege !== 'all')
  );

  const subjectCategories = useMemo(() => {
    if (!selectedSubjectArea || selectedSubjectArea === "all") return [];
    return SUBJECT_AREAS[selectedSubjectArea] || [];
  }, [selectedSubjectArea]);

  useEffect(() => {
    if (selectedSubjectCategory !== "all" && !subjectCategories.includes(selectedSubjectCategory)) {
      onSubjectCategoryChange("all");
    }
    // eslint-disable-next-line
  }, [selectedSubjectArea]);

  const handleSubjectAreaChange = (value) => {
    onSubjectAreaChange(value);
    onSubjectCategoryChange("all");
  };

  const activeOrgFilters = [
    (!isCampusAdmin && selectedCollege !== "all"),
    (!isCampusAdmin && selectedInstitute !== "all"),
    selectedDepartment !== "all",
    selectedSubjectCategory !== "all"
  ].filter(Boolean).length;

  const getRoleDescription = () => {
    if (isSuper) return "Filter and manage all system publications.";
    if (isCampusAdmin) return `Filter and manage publications for ${currentUser?.institute || currentUser?.college || "your institute"}.`;
    return "Filter and manage your publications.";
  };

  const getSearchPlaceholder = () => {
    if (isSuper) return "Search across campuses, departments, faculty, publications…";
    if (isCampusAdmin) return "Search title, journal, authors, or faculty…";
    return "Search title, journal, or authors…";
  };

  return (
    <>
      <Card className="mb-4 border border-gray-200 bg-white">
        <CardHeader className="bg-white-50 border-b border-blue-100 pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
                <Filter className="h-5 w-5 text-blue-600" />
                Filters & Actions
                {isSuper && <Shield className="h-4 w-4 text-amber-600" title="Super Admin" />}
                {isCampusAdmin && <Building className="h-4 w-4 text-green-600" title="Campus Admin" />}
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
          {/* Search Field */}
          <div className="mb-4 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={getSearchPlaceholder()}
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                className="pl-10 border-blue-200 focus:border-blue-500 focus:ring-blue-500 bg-white h-10 text-sm w-full"
              />
            </div>
          </div>

          {/* Main Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Year Filter */}
            <div>
              <Label htmlFor="year-filter" className="text-xs text-gray-600 mb-1 block">Year</Label>
              <Select value={selectedYear} onValueChange={onYearChange}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white h-10 text-sm w-full">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200">
                  <SelectItem value="all">All Years</SelectItem>
                  {filterOptions.years?.map((y) => (
                    <SelectItem key={`year-${y}`} value={String(y)} className="text-sm">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Q Rating Filter */}
            <div>
              <Label htmlFor="q-rating-filter" className="text-xs text-gray-600 mb-1 block">Q Rating</Label>
              <Select value={selectedQRating} onValueChange={onQRatingChange}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white h-10 text-sm w-full">
                  <SelectValue placeholder="All Q Ratings" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200">
                  <SelectItem value="all">All Q Ratings</SelectItem>
                  {filterOptions.qRatings?.map((q) => (
                    <SelectItem key={`q-${q}`} value={q} className="text-sm">
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Publication Type Filter */}
            <div>
              <Label htmlFor="pub-type-filter" className="text-xs text-gray-600 mb-1 block">Type</Label>
              <Select value={selectedPublicationType} onValueChange={onPublicationTypeChange}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white h-10 text-sm w-full">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200">
                  <SelectItem value="all">All Types</SelectItem>
                  {filterOptions.publicationTypes?.map((t) => (
                    <SelectItem key={`type-${t}`} value={t} className="text-sm">
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Subject Area Filter */}
            <div>
              <Label htmlFor="subject-area" className="text-xs text-gray-600 mb-1 block">Subject Area</Label>
              <Select 
                value={selectedSubjectArea} 
                onValueChange={handleSubjectAreaChange}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white h-10 text-sm w-full">
                  <SelectValue placeholder="All Subject Areas" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200 max-h-[400px] overflow-y-auto">
                  <SelectItem value="all">All Subject Areas</SelectItem>
                  {Object.keys(SUBJECT_AREAS).map(area => (
                    <SelectItem 
                      key={`area-${area}`} 
                      value={area}
                    >
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subject Category Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="subject-category" className="text-xs text-gray-600 mb-1 block">Subject Category</Label>
              <Select
                value={selectedSubjectCategory}
                onValueChange={onSubjectCategoryChange}
                disabled={selectedSubjectArea === "all" || subjectCategories.length === 0}
              >
                <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white h-10 text-sm w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200 max-h-[400px] overflow-y-auto">
                  <SelectItem value="all">All Categories</SelectItem>
                  {subjectCategories.map((category) => (
                    <SelectItem key={`category-${category}`} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Extended Organizational Filters */}
          {showExtended && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {showCollegeSelect && (
                <div>
                  <Label htmlFor="college-filter" className="text-xs text-gray-600 mb-1 block">College</Label>
                  <Select
                    value={isCampusAdmin ? currentUser?.college : selectedCollege}
                    onValueChange={(value) => {
                      onCollegeChange(value);
                      onInstituteChange('all');
                      onDepartmentChange('all');
                    }}
                    disabled={isCampusAdmin}
                  >
                    <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white h-10 text-sm w-full">
                      <SelectValue placeholder="All Colleges" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-blue-200">
                      <SelectItem value="all">All Colleges</SelectItem>
                      {colleges.filter(c => c !== 'all').map(college => (
                        <SelectItem key={`college-${college}`} value={college}>{college}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {showInstituteSelect && (
                <div>
                  <Label htmlFor="institute-filter" className="text-xs text-gray-600 mb-1 block">Institute</Label>
                  <Select
                    value={isCampusAdmin ? currentUser?.institute : selectedInstitute}
                    onValueChange={(value) => {
                      onInstituteChange(value);
                      onDepartmentChange('all');
                    }}
                    disabled={isCampusAdmin || (isCampusAdmin && (!currentUser?.college || collegesWithoutInstitutes.includes(currentUser.college)))}
                  >
                    <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white h-10 text-sm w-full">
                      <SelectValue placeholder="All Institutes" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-blue-200">
                      <SelectItem value="all">All Institutes</SelectItem>
                      {institutes.filter(i => i !== 'all').map(institute => (
                        <SelectItem key={`institute-${institute}`} value={institute}>{institute}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {showDepartmentSelect && (
                <div>
                  <Label htmlFor="department-filter" className="text-xs text-gray-600 mb-1 block">
                    Department
                  </Label>
                  <Select
                    value={selectedDepartment}
                    onValueChange={onDepartmentChange}
                    disabled={
                      isCampusAdmin
                        ? !currentUser?.college ||
                          (!collegesWithoutInstitutes.includes(currentUser.college) && (!currentUser.institute || currentUser.institute === "all"))
                        : (!isCampusAdmin && (selectedCollege === 'all' || (showInstituteSelect && selectedInstitute === 'all')))
                    }
                  >
                    <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white h-10 text-sm w-full">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-blue-200">
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.filter(d => d !== 'all').map(department => (
                        <SelectItem key={`dept-${department}`} value={department}>{department}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Active Filters Badges */}
          {hasActiveFilters && (
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-medium text-blue-700 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Active Filters:
                </span>
                {searchTerm && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs h-6">
                    Search: "{searchTerm.length > 15 ? searchTerm.substring(0, 15) + "..." : searchTerm}"
                  </Badge>
                )}
                {selectedYear !== "all" && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs h-6">
                    Year: {selectedYear}
                  </Badge>
                )}
                {selectedQRating !== "all" && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs h-6">
                    Q: {selectedQRating}
                  </Badge>
                )}
                {selectedPublicationType !== "all" && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs h-6">
                    Type: {selectedPublicationType}
                  </Badge>
                )}
                {selectedSubjectArea !== "all" && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs h-6">
                    Subject: {selectedSubjectArea}
                  </Badge>
                )}
                {selectedSubjectCategory !== "all" && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300 text-xs h-6">
                    Category: {selectedSubjectCategory}
                  </Badge>
                )}
                {showExtended && activeOrgFilters > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300 text-xs h-6">
                    +{activeOrgFilters} org filter{activeOrgFilters > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
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