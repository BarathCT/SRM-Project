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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save, Loader2 } from "lucide-react";
import { SUBJECT_AREAS } from "@/utils/subjectAreas";

const INDEXING_OPTIONS = ["", "Scopus", "Web of Science"];

export default function EditBookChapterDialog({
    open,
    onOpenChange,
    chapter,
    onSave,
    isSubmitting = false,
}) {
    const [formData, setFormData] = useState({
        chapterTitle: "",
        bookTitle: "",
        authors: [{ name: "" }],
        editors: [""],
        chapterNumber: "",
        year: new Date().getFullYear(),
        publisher: "",
        edition: "",
        volume: "",
        isbn: "",
        doi: "",
        pageRange: "",
        bookSeries: "",
        indexedIn: "",
        claimedBy: "",
        authorNo: "1",
        isStudentScholar: "no",
        studentScholars: [],
        subjectArea: "Computer Science",
        subjectCategories: [],
    });

    useEffect(() => {
        if (chapter) {
            setFormData({
                chapterTitle: chapter.chapterTitle || "",
                bookTitle: chapter.bookTitle || "",
                authors: chapter.authors?.length ? chapter.authors : [{ name: "" }],
                editors: chapter.editors?.length ? chapter.editors : [""],
                chapterNumber: chapter.chapterNumber || "",
                year: chapter.year || new Date().getFullYear(),
                publisher: chapter.publisher || "",
                edition: chapter.edition || "",
                volume: chapter.volume || "",
                isbn: chapter.isbn || "",
                doi: chapter.doi || "",
                pageRange: chapter.pageRange || "",
                bookSeries: chapter.bookSeries || "",
                indexedIn: chapter.indexedIn || "",
                claimedBy: chapter.claimedBy || "",
                authorNo: chapter.authorNo || "1",
                isStudentScholar: chapter.isStudentScholar || "no",
                studentScholars: chapter.studentScholars || [],
                subjectArea: chapter.subjectArea || "Computer Science",
                subjectCategories: chapter.subjectCategories || [],
            });
        }
    }, [chapter]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAuthorChange = (index, value) => {
        const newAuthors = [...formData.authors];
        newAuthors[index] = { name: value };
        handleChange("authors", newAuthors);
    };

    const addAuthor = () => {
        handleChange("authors", [...formData.authors, { name: "" }]);
    };

    const removeAuthor = (index) => {
        if (formData.authors.length > 1) {
            handleChange(
                "authors",
                formData.authors.filter((_, i) => i !== index)
            );
        }
    };

    const handleEditorChange = (index, value) => {
        const newEditors = [...formData.editors];
        newEditors[index] = value;
        handleChange("editors", newEditors);
    };

    const addEditor = () => {
        handleChange("editors", [...formData.editors, ""]);
    };

    const removeEditor = (index) => {
        if (formData.editors.length > 1) {
            handleChange(
                "editors",
                formData.editors.filter((_, i) => i !== index)
            );
        }
    };

    const handleSubjectAreaChange = (area) => {
        handleChange("subjectArea", area);
        handleChange("subjectCategories", []);
    };

    const toggleCategory = (category) => {
        const current = formData.subjectCategories || [];
        if (current.includes(category)) {
            handleChange(
                "subjectCategories",
                current.filter((c) => c !== category)
            );
        } else {
            handleChange("subjectCategories", [...current, category]);
        }
    };

    const handleSubmit = () => {
        onSave({ ...formData, _id: chapter?._id });
    };

    const availableCategories = SUBJECT_AREAS[formData.subjectArea] || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader>
                    <DialogTitle className="text-gray-900">Edit Book Chapter</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Chapter & Book Title */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-700">Chapter Title *</Label>
                            <Input
                                value={formData.chapterTitle}
                                onChange={(e) => handleChange("chapterTitle", e.target.value)}
                                className="border-blue-200"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-700">Book Title *</Label>
                            <Input
                                value={formData.bookTitle}
                                onChange={(e) => handleChange("bookTitle", e.target.value)}
                                className="border-blue-200"
                            />
                        </div>
                    </div>

                    {/* Authors */}
                    <div>
                        <Label className="text-gray-700">Authors *</Label>
                        {formData.authors.map((author, idx) => (
                            <div key={idx} className="flex gap-2 mt-2">
                                <Input
                                    value={author.name}
                                    onChange={(e) => handleAuthorChange(idx, e.target.value)}
                                    placeholder={`Author ${idx + 1}`}
                                    className="border-blue-200"
                                />
                                {formData.authors.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => removeAuthor(idx)}
                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addAuthor}
                            className="mt-2 border-blue-200"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add Author
                        </Button>
                    </div>

                    {/* Editors */}
                    <div>
                        <Label className="text-gray-700">Editors *</Label>
                        {formData.editors.map((editor, idx) => (
                            <div key={idx} className="flex gap-2 mt-2">
                                <Input
                                    value={editor}
                                    onChange={(e) => handleEditorChange(idx, e.target.value)}
                                    placeholder={`Editor ${idx + 1}`}
                                    className="border-blue-200"
                                />
                                {formData.editors.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => removeEditor(idx)}
                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addEditor}
                            className="mt-2 border-blue-200"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add Editor
                        </Button>
                    </div>

                    {/* Publication Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <Label className="text-gray-700">Year *</Label>
                            <Input
                                type="number"
                                value={formData.year}
                                onChange={(e) => handleChange("year", e.target.value)}
                                className="border-blue-200"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-700">Chapter No.</Label>
                            <Input
                                value={formData.chapterNumber}
                                onChange={(e) => handleChange("chapterNumber", e.target.value)}
                                className="border-blue-200"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-700">Page Range *</Label>
                            <Input
                                value={formData.pageRange}
                                onChange={(e) => handleChange("pageRange", e.target.value)}
                                placeholder="e.g., 1-25"
                                className="border-blue-200"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-700">Author No. *</Label>
                            <Input
                                value={formData.authorNo}
                                onChange={(e) => handleChange("authorNo", e.target.value)}
                                className="border-blue-200"
                            />
                        </div>
                    </div>

                    {/* Publisher & ISBN */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-700">Publisher *</Label>
                            <Input
                                value={formData.publisher}
                                onChange={(e) => handleChange("publisher", e.target.value)}
                                className="border-blue-200"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-700">ISBN *</Label>
                            <Input
                                value={formData.isbn}
                                onChange={(e) => handleChange("isbn", e.target.value)}
                                className="border-blue-200"
                            />
                        </div>
                    </div>

                    {/* Optional Fields */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <Label className="text-gray-700">Edition</Label>
                            <Input
                                value={formData.edition}
                                onChange={(e) => handleChange("edition", e.target.value)}
                                className="border-blue-200"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-700">Volume</Label>
                            <Input
                                value={formData.volume}
                                onChange={(e) => handleChange("volume", e.target.value)}
                                className="border-blue-200"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-700">DOI</Label>
                            <Input
                                value={formData.doi}
                                onChange={(e) => handleChange("doi", e.target.value)}
                                className="border-blue-200"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-700">Indexed In</Label>
                            <Select
                                value={formData.indexedIn}
                                onValueChange={(v) => handleChange("indexedIn", v)}
                            >
                                <SelectTrigger className="border-blue-200">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {INDEXING_OPTIONS.map((opt) => (
                                        <SelectItem key={opt || "none"} value={opt}>
                                            {opt || "Not Indexed"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Book Series */}
                    <div>
                        <Label className="text-gray-700">Book Series</Label>
                        <Input
                            value={formData.bookSeries}
                            onChange={(e) => handleChange("bookSeries", e.target.value)}
                            placeholder="e.g., Lecture Notes in Computer Science"
                            className="border-blue-200"
                        />
                    </div>

                    {/* Subject Area & Categories */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-700">Subject Area *</Label>
                            <Select
                                value={formData.subjectArea}
                                onValueChange={handleSubjectAreaChange}
                            >
                                <SelectTrigger className="border-blue-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white max-h-[300px]">
                                    {Object.keys(SUBJECT_AREAS).map((area) => (
                                        <SelectItem key={area} value={area}>
                                            {area}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-gray-700">Claimed By *</Label>
                            <Input
                                value={formData.claimedBy}
                                onChange={(e) => handleChange("claimedBy", e.target.value)}
                                className="border-blue-200"
                            />
                        </div>
                    </div>

                    {/* Subject Categories */}
                    <div>
                        <Label className="text-gray-700">Subject Categories *</Label>
                        <div className="flex flex-wrap gap-2 mt-2 p-3 border border-blue-200 rounded-md max-h-[150px] overflow-y-auto">
                            {availableCategories.map((cat) => (
                                <Badge
                                    key={cat}
                                    variant={
                                        formData.subjectCategories?.includes(cat)
                                            ? "default"
                                            : "outline"
                                    }
                                    onClick={() => toggleCategory(cat)}
                                    className={`cursor-pointer ${formData.subjectCategories?.includes(cat)
                                            ? "bg-blue-600"
                                            : "border-blue-200 hover:bg-blue-50"
                                        }`}
                                >
                                    {cat}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="border-gray-300"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isSubmitting ? (
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
}
