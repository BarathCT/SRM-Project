import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Edit,
  Hash,
  BookOpen,
  Users,
  GraduationCap,
  Search,
  Plus,
  Trash2,
  Save,
} from "lucide-react";

export default function EditPublicationDialog({
  open,
  onOpenChange,
  value,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
  subjectAreas = {},
  publicationTypes = ["scopus", "sci", "webOfScience", "pubmed"],
  qRatings = ["Q1", "Q2", "Q3", "Q4"],
}) {
  // Local validation error state
  const [errors, setErrors] = useState({});
  // Filter for subject categories search
  const [categoryQuery, setCategoryQuery] = useState("");

  useEffect(() => {
    // Reset validation when dialog is opened or data changes
    setErrors({});
    setCategoryQuery("");
  }, [open]);

  const currentArea = value?.subjectArea || "";
  const allCategories = subjectAreas[currentArea] || [];
  const filteredCategories = useMemo(() => {
    if (!categoryQuery.trim()) return allCategories;
    const q = categoryQuery.toLowerCase();
    return allCategories.filter((c) => c.toLowerCase().includes(q));
  }, [allCategories, categoryQuery]);

  const updateField = (key, v) => {
    if (!onChange) return;
    onChange((prev) => ({ ...(prev || {}), [key]: v }));
  };

  const updateArrayItem = (key, index, patch) => {
    if (!onChange) return;
    onChange((prev) => {
      const list = Array.isArray(prev?.[key]) ? [...prev[key]] : [];
      list[index] = { ...(list[index] || {}), ...patch };
      return { ...prev, [key]: list };
    });
  };

  const pushArrayItem = (key, item) => {
    if (!onChange) return;
    onChange((prev) => {
      const list = Array.isArray(prev?.[key]) ? prev[key] : [];
      return { ...prev, [key]: [...list, item] };
    });
  };

  const removeArrayItem = (key, index) => {
    if (!onChange) return;
    onChange((prev) => {
      const list = Array.isArray(prev?.[key]) ? [...prev[key]] : [];
      list.splice(index, 1);
      // Ensure at least one corresponding author remains
      if (key === "authors" && list.length > 0 && !list.some((a) => a?.isCorresponding)) {
        list[0] = { ...(list[0] || {}), isCorresponding: true };
      }
      return { ...prev, [key]: list };
    });
  };

  const toggleCategory = (cat) => {
    if (!onChange || !value) return;
    const valid = new Set(subjectAreas[value.subjectArea] || []);
    if (!valid.has(cat)) return;

    const next = new Set(value.subjectCategories || []);
    if (next.has(cat)) {
      if (next.size === 1) return; // keep at least one
      next.delete(cat);
    } else {
      next.add(cat);
    }
    updateField("subjectCategories", Array.from(next));
  };

  const onSubjectAreaChange = (area) => {
    const validCats = subjectAreas[area] || [];
    const existing = new Set(value?.subjectCategories || []);
    const kept = validCats.filter((c) => existing.has(c));
    updateField("subjectArea", area);
    updateField("subjectCategories", kept.length ? kept : validCats.slice(0, 1));
  };

  const validate = () => {
    if (!value) return false;
    const e = {};
    if (!value.title?.trim()) e.title = "Title is required.";
    if (!value.journal?.trim()) e.journal = "Journal is required.";
    if (!value.publisher?.trim()) e.publisher = "Publisher is required.";
    if (!value.year || Number.isNaN(Number(value.year))) e.year = "Valid year is required.";
    if (!publicationTypes.includes(value.publicationType))
      e.publicationType = "Select a valid publication type.";
    if (!qRatings.includes(value.qRating)) e.qRating = "Select a valid Q rating.";
    if (!value.subjectArea || !subjectAreas[value.subjectArea])
      e.subjectArea = "Select a valid subject area.";
    const cats = subjectAreas[value.subjectArea] || [];
    if (!value.subjectCategories?.length || !value.subjectCategories.every((c) => cats.includes(c))) {
      e.subjectCategories = "Choose at least one valid category for the selected area.";
    }
    // Authors
    if (!value.authors?.length || !value.authors.some((a) => a?.name?.trim())) {
      e.authors = "Add at least one author with a name.";
    }
    if (!value.authors?.some((a) => a?.isCorresponding)) {
      e.authors = "Mark one author as corresponding.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (!value) return;
    if (!validate()) return;
    onSubmit?.(value);
  };

  // Guard rendering content if no value yet (dialog mount-safe)
  const hasValue = !!value;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] md:w-[85vw] max-h-[90vh] bg-white p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-blue-100">
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Edit className="h-5 w-5 text-blue-600" />
            Edit Publication (All Fields)
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Update all details of your publication. Professional white/blue UI. Fully responsive.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {hasValue && (
            <ScrollArea className="flex-1 max-h-[70vh]">
              <div className="p-6 space-y-8">
                {/* Basic Information */}
                <section className="space-y-4">
                  <HeaderRow icon={<BookOpen className="h-4 w-4 text-blue-600" />} title="Basic Information" />
                  <div className="grid grid-cols-1 gap-4">
                    <Field label="Title" error={errors.title}>
                      <Textarea
                        autoFocus
                        value={value.title || ""}
                        onChange={(e) => updateField("title", e.target.value)}
                        className="border-blue-200 focus:border-blue-500 bg-white"
                        rows={3}
                        placeholder="Enter publication title"
                      />
                    </Field>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Journal" error={errors.journal}>
                        <Input
                          value={value.journal || ""}
                          onChange={(e) => updateField("journal", e.target.value)}
                          className="border-blue-200 focus:border-blue-500 bg-white"
                          placeholder="Journal name"
                        />
                      </Field>
                      <Field label="Publisher" error={errors.publisher}>
                        <Input
                          value={value.publisher || ""}
                          onChange={(e) => updateField("publisher", e.target.value)}
                          className="border-blue-200 focus:border-blue-500 bg-white"
                          placeholder="Publisher name"
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Field label="DOI">
                        <Input
                          value={value.doi || ""}
                          onChange={(e) => updateField("doi", e.target.value)}
                          className="border-blue-200 focus:border-blue-500 bg-white font-mono"
                          placeholder="10.xxxx/xxxxx"
                        />
                      </Field>
                      <Field label="Publication ID">
                        <Input
                          value={value.publicationId || ""}
                          onChange={(e) => updateField("publicationId", e.target.value)}
                          className="border-blue-200 focus:border-blue-500 bg-white font-mono"
                          placeholder="Scopus/WOS/SCI ID etc."
                        />
                      </Field>
                      <Field label="Issue Type">
                        <Select
                          value={value.typeOfIssue || "Regular Issue"}
                          onValueChange={(v) => updateField("typeOfIssue", v)}
                        >
                          <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white">
                            <SelectValue placeholder="Issue Type" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-blue-200">
                            <SelectItem value="Regular Issue">Regular Issue</SelectItem>
                            <SelectItem value="Special Issue">Special Issue</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                  </div>
                </section>

                <Separator className="bg-blue-100" />

                {/* Publication Details */}
                <section className="space-y-4">
                  <HeaderRow icon={<Hash className="h-4 w-4 text-blue-600" />} title="Publication Details" />
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Field label="Year" error={errors.year}>
                      <Input
                        type="number"
                        value={value.year ?? ""}
                        onChange={(e) => updateField("year", Number(e.target.value))}
                        className="border-blue-200 focus:border-blue-500 bg-white"
                        min={1900}
                        max={2100}
                      />
                    </Field>
                    <Field label="Volume">
                      <Input
                        value={value.volume || ""}
                        onChange={(e) => updateField("volume", e.target.value)}
                        className="border-blue-200 focus:border-blue-500 bg-white"
                        placeholder="Vol"
                      />
                    </Field>
                    <Field label="Issue">
                      <Input
                        value={value.issue || ""}
                        onChange={(e) => updateField("issue", e.target.value)}
                        className="border-blue-200 focus:border-blue-500 bg-white"
                        placeholder="Issue"
                      />
                    </Field>
                    <Field label="Pages">
                      <Input
                        value={value.pageNo || ""}
                        onChange={(e) => updateField("pageNo", e.target.value)}
                        className="border-blue-200 focus:border-blue-500 bg-white"
                        placeholder="1-10"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Q Rating" error={errors.qRating}>
                      <Select
                        value={value.qRating || ""}
                        onValueChange={(v) => updateField("qRating", v)}
                      >
                        <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white">
                          <SelectValue placeholder="Select Q rating" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-blue-200">
                          {qRatings.map((q) => (
                            <SelectItem key={q} value={q}>
                              {q}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label="Publication Type" error={errors.publicationType}>
                      <Select
                        value={value.publicationType || ""}
                        onValueChange={(v) => updateField("publicationType", v)}
                      >
                        <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-blue-200">
                          {publicationTypes.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field label="Subject Area" error={errors.subjectArea}>
                      <Select
                        value={value.subjectArea || ""}
                        onValueChange={onSubjectAreaChange}
                      >
                        <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white">
                          <SelectValue placeholder="Select subject area" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-blue-200">
                          {Object.keys(subjectAreas).map((area) => (
                            <SelectItem key={area} value={area}>
                              {area}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Field label="Subject Categories" error={errors.subjectCategories}>
                    <div className="rounded-md border border-blue-100 bg-blue-50 p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Search className="h-4 w-4 text-gray-400" />
                        <Input
                          value={categoryQuery}
                          onChange={(e) => setCategoryQuery(e.target.value)}
                          placeholder="Search categories..."
                          className="h-8 border-blue-200 focus:border-blue-500 bg-white"
                        />
                      </div>
                      <div className="max-h-40 overflow-auto rounded border border-blue-100 bg-white p-2">
                        <div className="grid grid-cols-1 gap-1">
                          {filteredCategories.map((cat) => {
                            const checked = (value.subjectCategories || []).includes(cat);
                            return (
                              <label
                                key={cat}
                                className="flex items-center gap-2 text-sm text-gray-800 px-2 py-1 rounded hover:bg-blue-50"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => toggleCategory(cat)}
                                  className="border-blue-300"
                                />
                                {cat}
                              </label>
                            );
                          })}
                          {filteredCategories.length === 0 && (
                            <p className="text-xs text-gray-500 px-2 py-1">No categories found.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Field>
                </section>

                <Separator className="bg-blue-100" />

                {/* Author Information */}
                <section className="space-y-4">
                  <HeaderRow icon={<Users className="h-4 w-4 text-blue-600" />} title="Author Information" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="Claimed By">
                      <Input
                        value={value.claimedBy || ""}
                        onChange={(e) => updateField("claimedBy", e.target.value)}
                        className="border-blue-200 focus:border-blue-500 bg-white"
                      />
                    </Field>
                    <Field label="Author No.">
                      <Input
                        value={value.authorNo || ""}
                        onChange={(e) => updateField("authorNo", e.target.value)}
                        className="border-blue-200 focus:border-blue-500 bg-white"
                        placeholder="1, 2, 3 or C"
                      />
                    </Field>
                    <Field label="Student Scholar">
                      <Select
                        value={value.isStudentScholar || "no"}
                        onValueChange={(v) => updateField("isStudentScholar", v)}
                      >
                        <SelectTrigger className="border-blue-200 focus:border-blue-500 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-blue-200">
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  {/* Authors list */}
                  <Field label="Authors" error={errors.authors}>
                    <div className="rounded-md border border-blue-100 bg-blue-50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900">Add, mark corresponding, or remove</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => pushArrayItem("authors", { name: "", isCorresponding: false })}
                          className="border-blue-200 hover:bg-blue-100"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Author
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {value.authors?.map((a, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-white p-2 rounded border border-blue-100"
                          >
                            <div className="md:col-span-7">
                              <Input
                                value={a?.name || ""}
                                onChange={(e) => updateArrayItem("authors", idx, { name: e.target.value })}
                                placeholder="Author name"
                                className="border-blue-200 focus:border-blue-500 bg-white"
                              />
                            </div>
                            <div className="md:col-span-3">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={!!a?.isCorresponding}
                                  onCheckedChange={(checked) => {
                                    // Set this as corresponding, unset others
                                    onChange?.((prev) => {
                                      const list = (prev?.authors || []).map((item, i) => ({
                                        ...(item || {}),
                                        isCorresponding: i === idx ? !!checked : false,
                                      }));
                                      return { ...prev, authors: list };
                                    });
                                  }}
                                  className="border-blue-300"
                                />
                                <span className="text-sm text-gray-700">Corresponding</span>
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => removeArrayItem("authors", idx)}
                                className="border-red-200 text-red-600 hover:bg-red-50 w-full"
                                disabled={(value.authors || []).length === 1}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                        {(!value.authors || value.authors.length === 0) && (
                          <p className="text-xs text-blue-700">No authors added yet.</p>
                        )}
                      </div>
                    </div>
                  </Field>

                  {/* Student Scholars (conditional) */}
                  {value.isStudentScholar === "yes" && (
                    <Field
                      label="Student Scholars"
                      hint="Add scholar name and optional ID."
                    >
                      <div className="rounded-md border border-blue-100 bg-blue-50 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-900">Scholars</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => pushArrayItem("studentScholars", { name: "", id: "" })}
                            className="border-blue-200 hover:bg-blue-100"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Scholar
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {value.studentScholars?.map((s, idx) => (
                            <div
                              key={idx}
                              className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-white p-2 rounded border border-blue-100"
                            >
                              <div className="md:col-span-6">
                                <Input
                                  value={s?.name || ""}
                                  onChange={(e) =>
                                    updateArrayItem("studentScholars", idx, { name: e.target.value })
                                  }
                                  placeholder="Scholar name"
                                  className="border-blue-200 focus:border-blue-500 bg-white"
                                />
                              </div>
                              <div className="md:col-span-4">
                                <Input
                                  value={s?.id || ""}
                                  onChange={(e) =>
                                    updateArrayItem("studentScholars", idx, { id: e.target.value })
                                  }
                                  placeholder="Scholar ID (optional)"
                                  className="border-blue-200 focus:border-blue-500 bg-white"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeArrayItem("studentScholars", idx)}
                                  className="border-red-200 text-red-600 hover:bg-red-50 w-full"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                          {(!value.studentScholars || value.studentScholars.length === 0) && (
                            <p className="text-xs text-blue-700">No scholars added yet.</p>
                          )}
                        </div>
                      </div>
                    </Field>
                  )}
                </section>

                <Separator className="bg-blue-100" />

                {/* Summary glance (read-only chips) */}
                <section className="space-y-2">
                  <HeaderRow icon={<GraduationCap className="h-4 w-4 text-blue-600" />} title="Quick Glance" />
                  <div className="text-sm text-gray-700 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <p>
                      <span className="font-semibold">Year:</span> {value.year || "-"}
                    </p>
                    <p>
                      <span className="font-semibold">Q Rating:</span> {value.qRating || "-"}
                    </p>
                    <p>
                      <span className="font-semibold">Type:</span> {value.publicationType || "-"}
                    </p>
                  </div>
                </section>
              </div>
            </ScrollArea>
          )}

          <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-blue-100">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel || (() => onOpenChange?.(false))}
              className="border-gray-300"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              <Save className={`h-4 w-4 mr-2 ${isSubmitting ? "animate-pulse" : ""}`} />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Small subcomponents for clarity ---------- */

function HeaderRow({ icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center justify-center rounded-md bg-blue-50 p-1.5">
        {icon}
      </span>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    </div>
  );
}

function Field({ label, children, hint, error }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}