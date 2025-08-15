import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  X,
  Save,
  Loader2,
  BookOpen,
  Users,
  Building2,
  Calendar,
  FileText,
} from "lucide-react";

const EditPublicationDialog = ({
  paper,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}) => {
  const [formData, setFormData] = useState({});
  const [authors, setAuthors] = useState([]);
  const [studentScholars, setStudentScholars] = useState([]);
  const [subjectCategories, setSubjectCategories] = useState([]);

  // Initialize form data when paper changes
  useEffect(() => {
    if (paper) {
      setFormData({
        title: paper.title || "",
        doi: paper.doi || "",
        journal: paper.journal || "",
        publisher: paper.publisher || "",
        year: paper.year || new Date().getFullYear(),
        volume: paper.volume || "",
        issue: paper.issue || "",
        pageNo: paper.pageNo || "",
        publicationType: paper.publicationType || "",
        subjectArea: paper.subjectArea || "",
        qRating: paper.qRating || "",
        claimedBy: paper.claimedBy || "",
        authorNo: paper.authorNo || "",
        isStudentScholar: paper.isStudentScholar || "",
        publicationId: paper.publicationId || "",
        typeOfIssue: paper.typeOfIssue || "",
      });

      setAuthors(
        paper.authors?.map((author) => ({
          name: author.name || "",
          isCorresponding: author.isCorresponding || false,
        })) || [{ name: "", isCorresponding: false }]
      );

      setStudentScholars(
        paper.studentScholars?.map((scholar) =>
          typeof scholar === "string" ? scholar : scholar.name || ""
        ) || []
      );

      setSubjectCategories(paper.subjectCategories || []);
    }
  }, [paper]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAuthorChange = (index, field, value) => {
    setAuthors((prev) =>
      prev.map((author, i) =>
        i === index ? { ...author, [field]: value } : author
      )
    );
  };

  const addAuthor = () => {
    setAuthors((prev) => [...prev, { name: "", isCorresponding: false }]);
  };

  const removeAuthor = (index) => {
    setAuthors((prev) => prev.filter((_, i) => i !== index));
  };

  const addStudentScholar = () => {
    setStudentScholars((prev) => [...prev, ""]);
  };

  const updateStudentScholar = (index, value) => {
    setStudentScholars((prev) =>
      prev.map((scholar, i) => (i === index ? value : scholar))
    );
  };

  const removeStudentScholar = (index) => {
    setStudentScholars((prev) => prev.filter((_, i) => i !== index));
  };

  const addSubjectCategory = (category) => {
    if (category && !subjectCategories.includes(category)) {
      setSubjectCategories((prev) => [...prev, category]);
    }
  };

  const removeSubjectCategory = (category) => {
    setSubjectCategories((prev) => prev.filter((cat) => cat !== category));
  };

  const handleSave = () => {
    const updatedPaper = {
      ...paper,
      ...formData,
      authors: authors.filter((author) => author.name.trim() !== ""),
      studentScholars: studentScholars.filter((scholar) => scholar.trim() !== ""),
      subjectCategories,
    };
    onSave(updatedPaper);
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  if (!paper) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Edit Publication
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Textarea
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter publication title"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doi">DOI</Label>
                  <Input
                    id="doi"
                    value={formData.doi}
                    onChange={(e) => handleInputChange("doi", e.target.value)}
                    placeholder="10.1000/example"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publicationId">Publication ID</Label>
                  <Input
                    id="publicationId"
                    value={formData.publicationId}
                    onChange={(e) => handleInputChange("publicationId", e.target.value)}
                    placeholder="Enter publication ID"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Journal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-4 w-4" />
                Journal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="journal">Journal *</Label>
                  <Input
                    id="journal"
                    value={formData.journal}
                    onChange={(e) => handleInputChange("journal", e.target.value)}
                    placeholder="Enter journal name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input
                    id="publisher"
                    value={formData.publisher}
                    onChange={(e) => handleInputChange("publisher", e.target.value)}
                    placeholder="Enter publisher name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleInputChange("year", parseInt(e.target.value) || "")}
                    placeholder="2024"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volume">Volume</Label>
                  <Input
                    id="volume"
                    value={formData.volume}
                    onChange={(e) => handleInputChange("volume", e.target.value)}
                    placeholder="Vol. 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue">Issue</Label>
                  <Input
                    id="issue"
                    value={formData.issue}
                    onChange={(e) => handleInputChange("issue", e.target.value)}
                    placeholder="Issue 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pageNo">Pages</Label>
                  <Input
                    id="pageNo"
                    value={formData.pageNo}
                    onChange={(e) => handleInputChange("pageNo", e.target.value)}
                    placeholder="1-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Classification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-4 w-4" />
                Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="publicationType">Publication Type</Label>
                  <Select
                    value={formData.publicationType}
                    onValueChange={(value) => handleInputChange("publicationType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Journal Article">Journal Article</SelectItem>
                      <SelectItem value="Conference Paper">Conference Paper</SelectItem>
                      <SelectItem value="Book Chapter">Book Chapter</SelectItem>
                      <SelectItem value="Review Article">Review Article</SelectItem>
                      <SelectItem value="Short Communication">Short Communication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qRating">Q Rating</Label>
                  <Select
                    value={formData.qRating}
                    onValueChange={(value) => handleInputChange("qRating", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Q rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1">Q1</SelectItem>
                      <SelectItem value="Q2">Q2</SelectItem>
                      <SelectItem value="Q3">Q3</SelectItem>
                      <SelectItem value="Q4">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typeOfIssue">Issue Type</Label>
                  <Select
                    value={formData.typeOfIssue}
                    onValueChange={(value) => handleInputChange("typeOfIssue", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Regular Issue">Regular Issue</SelectItem>
                      <SelectItem value="Special Issue">Special Issue</SelectItem>
                      <SelectItem value="Supplement">Supplement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectArea">Subject Area</Label>
                <Input
                  id="subjectArea"
                  value={formData.subjectArea}
                  onChange={(e) => handleInputChange("subjectArea", e.target.value)}
                  placeholder="Enter subject area"
                />
              </div>

              {/* Subject Categories */}
              <div className="space-y-2">
                <Label>Subject Categories</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {subjectCategories.map((category, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {category}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-auto p-0 ml-1"
                        onClick={() => removeSubjectCategory(category)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add subject category"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSubjectCategory(e.target.value.trim());
                        e.target.value = "";
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      const input = e.target.previousElementSibling;
                      addSubjectCategory(input.value.trim());
                      input.value = "";
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Authors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-4 w-4" />
                Authors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {authors.map((author, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      value={author.name}
                      onChange={(e) => handleAuthorChange(index, "name", e.target.value)}
                      placeholder="Author name"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={author.isCorresponding}
                      onCheckedChange={(checked) =>
                        handleAuthorChange(index, "isCorresponding", checked)
                      }
                    />
                    <Label className="text-sm">Corresponding</Label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAuthor(index)}
                    disabled={authors.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addAuthor}>
                <Plus className="h-4 w-4 mr-2" />
                Add Author
              </Button>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="claimedBy">Claimed By</Label>
                  <Input
                    id="claimedBy"
                    value={formData.claimedBy}
                    onChange={(e) => handleInputChange("claimedBy", e.target.value)}
                    placeholder="Faculty name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authorNo">Author Number</Label>
                  <Input
                    id="authorNo"
                    value={formData.authorNo}
                    onChange={(e) => handleInputChange("authorNo", e.target.value)}
                    placeholder="Author position"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isStudentScholar">Student Scholar</Label>
                  <Select
                    value={formData.isStudentScholar}
                    onValueChange={(value) => handleInputChange("isStudentScholar", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Student Scholars */}
              <div className="space-y-2">
                <Label>Student Scholars</Label>
                {studentScholars.map((scholar, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={scholar}
                      onChange={(e) => updateStudentScholar(index, e.target.value)}
                      placeholder="Student scholar name"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeStudentScholar(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addStudentScholar}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student Scholar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditPublicationDialog;