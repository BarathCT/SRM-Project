import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
  BookOpen,
  Eye,
  EyeOff,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Edit,
  X,
} from "lucide-react";

export default function PublicationsTable({
  // data
  papers, // array of publications to render (typically filteredPapers)

  // selection
  selectedPapers, // Set of selected ids
  selectAll, // boolean
  onToggleSelectAll, // () => void
  onToggleSelect, // (id: string) => void

  // expand
  expandedIndex, // number | null
  onToggleExpand, // (index: number) => void

  // actions
  onEdit, // (paper) => void
  onDelete, // (id: string) => void
  deletingId, // string | null

  // filters helper (for empty state)
  hasActiveFilters, // boolean
  onClearFilters, // () => void
}) {
  const noResults = papers.length === 0;

  return (
    <Card className="border border-blue-100 shadow-md bg-white">
      <CardHeader className="bg-blue-50 border-b border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Publications
            </CardTitle>
            <CardDescription className="text-gray-600">
              Your publications list
            </CardDescription>
          </div>
          {!noResults && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={onToggleSelectAll}
                  className="border-blue-300"
                />
                <span className="text-sm text-gray-700 font-medium">
                  Select All Visible
                </span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {noResults ? (
          <div className="text-center py-16 bg-white">
            <BookOpen className="h-20 w-20 text-blue-200 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No publications found
            </h3>
            <p className="text-gray-600 mb-4">
              Adjust filters or search query
            </p>
            {hasActiveFilters && (
              <Button
                onClick={onClearFilters}
                variant="outline"
                className="border-blue-200 hover:border-blue-400"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white">
              <thead className="bg-blue-50 border-b border-blue-100">
                <tr>
                  <th className="py-4 px-4 text-left">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={onToggleSelectAll}
                      className="border-blue-300"
                    />
                  </th>
                  <th className="py-4 px-4 text-left font-semibold text-gray-900">
                    Publication Details
                  </th>
                  <th className="py-4 px-4 text-left font-semibold text-gray-900 hidden md:table-cell">
                    Journal
                  </th>
                  <th className="py-4 px-4 text-left font-semibold text-gray-900">
                    Metrics
                  </th>
                  <th className="py-4 px-4 text-left font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {papers.map((paper, index) => (
                  <React.Fragment key={paper._id}>
                    <tr className="hover:bg-blue-50/60 transition-colors">
                      <td className="py-4 px-4">
                        <Checkbox
                          checked={selectedPapers.has(paper._id)}
                          onCheckedChange={() => onToggleSelect(paper._id)}
                          className="border-blue-300"
                        />
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900 leading-tight">
                            {paper.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Authors:</span>{" "}
                            {paper.authors
                              ?.slice(0, 3)
                              .map((a) =>
                                a.isCorresponding ? `${a.name} (C)` : a.name
                              )
                              .join(", ")}
                            {paper.authors?.length > 3 && (
                              <span className="text-blue-700">
                                {" "}
                                +{paper.authors.length - 3} more
                              </span>
                            )}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {paper.publicationType}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {paper.subjectArea}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell align-top">
                        <p className="font-medium text-gray-900">{paper.journal}</p>
                        <p className="text-sm text-gray-600">{paper.publisher}</p>
                        <p className="text-xs text-gray-500 font-mono break-all">
                          {paper.doi}
                        </p>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-2">
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-800 font-medium"
                          >
                            {paper.year}
                          </Badge>
                          <Badge
                            className={`block w-fit text-white font-medium ${
                              paper.qRating === "Q1"
                                ? "bg-blue-700"
                                : paper.qRating === "Q2"
                                ? "bg-blue-600"
                                : paper.qRating === "Q3"
                                ? "bg-blue-500"
                                : "bg-gray-600"
                            }`}
                          >
                            {paper.qRating}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => onToggleExpand(index)}
                            variant="outline"
                            size="sm"
                            className="border-blue-200 hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            {expandedIndex === index ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-1" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </>
                            )}
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-200 hover:bg-blue-50"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-white border-blue-200"
                            >
                              <DropdownMenuLabel className="text-gray-900">
                                Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-blue-100" />
                              <button
                                onClick={() => onEdit(paper)}
                                className="w-full text-left px-2 py-1.5 text-sm text-blue-700 hover:bg-blue-50 rounded flex items-center"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Publication
                              </button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button className="w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded flex items-center">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-gray-900">
                                      Delete Publication
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-600">
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-gray-300">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => onDelete(paper._id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {deletingId === paper._id ? (
                                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                      ) : null}
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>

                    {expandedIndex === index && (
                      <tr>
                        <td colSpan={5} className="bg-blue-50 p-6 border-l-4 border-blue-500">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="border border-blue-100 shadow-sm bg-white">
                              <CardHeader className="pb-3 bg-blue-50 border-b border-blue-100">
                                <CardTitle className="text-lg text-gray-900">
                                  Publication Details
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2 pt-4 text-sm text-gray-700">
                                <p>
                                  <span className="font-semibold">DOI:</span> {paper.doi}
                                </p>
                                <p>
                                  <span className="font-semibold">Volume:</span> {paper.volume}
                                  <span className="font-semibold ml-2">Issue:</span> {paper.issue}
                                </p>
                                <p>
                                  <span className="font-semibold">Pages:</span> {paper.pageNo}
                                </p>
                                <p>
                                  <span className="font-semibold">Publication ID:</span> {paper.publicationId}
                                </p>
                                <p>
                                  <span className="font-semibold">Issue Type:</span> {paper.typeOfIssue}
                                </p>
                              </CardContent>
                            </Card>

                            <Card className="border border-blue-100 shadow-sm bg-white">
                              <CardHeader className="pb-3 bg-blue-50 border-b border-blue-100">
                                <CardTitle className="text-lg text-gray-900">
                                  Author Information
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2 pt-4 text-sm text-gray-700">
                                <p>
                                  <span className="font-semibold">Claimed By:</span> {paper.claimedBy}
                                </p>
                                <p>
                                  <span className="font-semibold">Author No:</span> {paper.authorNo}
                                </p>
                                <p>
                                  <span className="font-semibold">Student Scholar:</span> {paper.isStudentScholar}
                                </p>
                                {paper.studentScholars?.length > 0 && (
                                  <p>
                                    <span className="font-semibold">Scholar Names:</span>{" "}
                                    {(paper.studentScholars || [])
                                      .map((s) => (typeof s === "string" ? s : s.name))
                                      .join(", ")}
                                  </p>
                                )}
                              </CardContent>
                            </Card>

                            <Card className="border border-blue-100 shadow-sm bg-white">
                              <CardHeader className="pb-3 bg-blue-50 border-b border-blue-100">
                                <CardTitle className="text-lg text-gray-900">
                                  Subject Classification
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3 pt-4">
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  {paper.subjectArea}
                                </Badge>
                                <div className="flex flex-wrap gap-1">
                                  {paper.subjectCategories?.map((c, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                    >
                                      {c}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}