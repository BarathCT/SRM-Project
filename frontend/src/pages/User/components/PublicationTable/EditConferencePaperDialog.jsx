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

const CONFERENCE_TYPES = ["International", "National"];
const CONFERENCE_MODES = ["Online", "Offline", "Hybrid"];
const PRESENTATION_TYPES = ["", "Oral", "Poster"];
const INDEXING_OPTIONS = ["", "Scopus", "Web of Science"];

export default function EditConferencePaperDialog({
    open,
    onOpenChange,
    paper,
    onSave,
    isSubmitting = false,
}) {
    const [formData, setFormData] = useState({
        title: "",
        authors: [{ name: "", isCorresponding: false }],
        year: new Date().getFullYear(),
        conferenceName: "",
        conferenceShortName: "",
        conferenceType: "International",
        conferenceMode: "Offline",
        conferenceLocation: { city: "", country: "" },
        conferenceStartDate: "",
        conferenceEndDate: "",
        organizer: "",
        proceedingsTitle: "",
        proceedingsPublisher: "",
        isbn: "",
        doi: "",
        pageNo: "",
        presentationType: "",
        acceptanceRate: "",
        indexedIn: "",
        claimedBy: "",
        authorNo: "1",
        isStudentScholar: "no",
        studentScholars: [],
        subjectArea: "Computer Science",
        subjectCategories: [],
    });

    useEffect(() => {
        if (paper) {
            const formatDate = (d) => {
                if (!d) return "";
                const date = new Date(d);
                return date.toISOString().split("T")[0];
            };

            setFormData({
                title: paper.title || "",
                authors: paper.authors?.length
                    ? paper.authors
                    : [{ name: "", isCorresponding: false }],
                year: paper.year || new Date().getFullYear(),
                conferenceName: paper.conferenceName || "",
                conferenceShortName: paper.conferenceShortName || "",
                conferenceType: paper.conferenceType || "International",
                conferenceMode: paper.conferenceMode || "Offline",
                conferenceLocation: paper.conferenceLocation || { city: "", country: "" },
                conferenceStartDate: formatDate(paper.conferenceStartDate),
                conferenceEndDate: formatDate(paper.conferenceEndDate),
                organizer: paper.organizer || "",
                proceedingsTitle: paper.proceedingsTitle || "",
                proceedingsPublisher: paper.proceedingsPublisher || "",
                isbn: paper.isbn || "",
                doi: paper.doi || "",
                pageNo: paper.pageNo || "",
                presentationType: paper.presentationType || "",
                acceptanceRate: paper.acceptanceRate || "",
                indexedIn: paper.indexedIn || "",
                claimedBy: paper.claimedBy || "",
                authorNo: paper.authorNo || "1",
                isStudentScholar: paper.isStudentScholar || "no",
                studentScholars: paper.studentScholars || [],
                subjectArea: paper.subjectArea || "Computer Science",
                subjectCategories: paper.subjectCategories || [],
            });
        }
    }, [paper]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleLocationChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            conferenceLocation: { ...prev.conferenceLocation, [field]: value },
        }));
    };

    const handleAuthorChange = (index, field, value) => {
        const newAuthors = [...formData.authors];
        newAuthors[index] = { ...newAuthors[index], [field]: value };
        handleChange("authors", newAuthors);
    };

    const addAuthor = () => {
        handleChange("authors", [
            ...formData.authors,
            { name: "", isCorresponding: false },
        ]);
    };

    const removeAuthor = (index) => {
        if (formData.authors.length > 1) {
            handleChange(
                "authors",
                formData.authors.filter((_, i) => i !== index)
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
        onSave({ ...formData, _id: paper?._id });
    };

    const availableCategories = SUBJECT_AREAS[formData.subjectArea] || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader>
                    <DialogTitle className="text-gray-900">
                        Edit Conference Paper
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Title */}
                    <div>
                        <Label className="text-gray-700">Paper Title *</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            className="border-blue-200"
                        />
                    </div>

                    {/* Authors */}
                    <div>
                        <Label className="text-gray-700">Authors *</Label>
                        {formData.authors.map((author, idx) => (
                            <div key={idx} className="flex gap-2 mt-2 items-center">
                                <Input
                                    value={author.name}
                                    onChange={(e) =>
                                        handleAuthorChange(idx, "name", e.target.value)
                                    }
                                    placeholder={`Author ${idx + 1}`}
                                    className="border-blue-200 flex-1"
                                />
                                <label className="flex items-center gap-1 text-sm text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={author.isCorresponding}
                                        onChange={(e) =>
                                            handleAuthorChange(idx, "isCorresponding", e.target.checked)
                                        }
                                    />
                                    Corresponding
                                </label>
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

                    {/* Conference Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-700">Conference Name *</Label>
                            <Input
                                value={formData.conferenceName}
                                onChange={(e) => handleChange("conferenceName", e.target.value)}
                                className="border-blue-200"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-700">Short Name</Label>
                            <Input
                                value={formData.conferenceShortName}
                                onChange={(e) =>
                                    handleChange("conferenceShortName", e.target.value)
                                }
                                placeholder="e.g., ICML"
                                className="border-blue-200"
                            />
                        </div>
                    </div>

                    {/* Conference Type & Mode */}
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
                            <Label className="text-gray-700">Type *</Label>
                            <Select
                                value={formData.conferenceType}
                                onValueChange={(v) => handleChange("conferenceType", v)}
                            >
                                <SelectTrigger className="border-blue-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {CONFERENCE_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {t}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-gray-700">Mode *</Label>
                            <Select
                                value={formData.conferenceMode}
                                onValueChange={(v) => handleChange("conferenceMode", v)}
                            >
                                <SelectTrigger className="border-blue-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {CONFERENCE_MODES.map((m) => (
                                        <SelectItem key={m} value={m}>
                                            {m}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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

                    {/* Location & Dates */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <Label className="text-gray-700">City *</Label>
                            <Input
                                value={formData.conferenceLocation.city}
                                onChange={(e) => handleLocationChange("city", e.target.value)}
                                className="border-blue-200"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-700">Country *</Label>
                            <Input
                                value={formData.conferenceLocation.country}
                                onChange={(e) => handleLocationChange("country", e.target.value)}
                                className="border-blue-200"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-700">Start Date *</Label>
                            <Input
                                type="date"
                                value={formData.conferenceStartDate}
                                onChange={(e) =>
                                    handleChange("conferenceStartDate", e.target.value)
                                }
                                className="border-blue-200"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-700">End Date *</Label>
                            <Input
                                type="date"
                                value={formData.conferenceEndDate}
                                onChange={(e) =>
                                    handleChange("conferenceEndDate", e.target.value)
                                }
                                className="border-blue-200"
                            />
                        </div>
                    </div>

                    {/* Organizer & Publisher */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-gray-700">Organizer *</Label>
                            <Input
                                value={formData.organizer}
                                onChange={(e) => handleChange("organizer", e.target.value)}
                                className="border-blue-200"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-700">Proceedings Publisher *</Label>
                            <Input
                                value={formData.proceedingsPublisher}
                                onChange={(e) =>
                                    handleChange("proceedingsPublisher", e.target.value)
                                }
                                className="border-blue-200"
                            />
                        </div>
                    </div>

                    {/* Optional Fields */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <Label className="text-gray-700">ISBN</Label>
                            <Input
                                value={formData.isbn}
                                onChange={(e) => handleChange("isbn", e.target.value)}
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
                            <Label className="text-gray-700">Page No.</Label>
                            <Input
                                value={formData.pageNo}
                                onChange={(e) => handleChange("pageNo", e.target.value)}
                                className="border-blue-200"
                            />
                        </div>
                        <div>
                            <Label className="text-gray-700">Presentation</Label>
                            <Select
                                value={formData.presentationType}
                                onValueChange={(v) => handleChange("presentationType", v)}
                            >
                                <SelectTrigger className="border-blue-200">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {PRESENTATION_TYPES.map((t) => (
                                        <SelectItem key={t || "none"} value={t}>
                                            {t || "None"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* More Optional */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <Label className="text-gray-700">Acceptance Rate</Label>
                            <Input
                                value={formData.acceptanceRate}
                                onChange={(e) => handleChange("acceptanceRate", e.target.value)}
                                placeholder="e.g., 25%"
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
                        <div>
                            <Label className="text-gray-700">Claimed By *</Label>
                            <Input
                                value={formData.claimedBy}
                                onChange={(e) => handleChange("claimedBy", e.target.value)}
                                className="border-blue-200"
                            />
                        </div>
                    </div>

                    {/* Subject Area */}
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
