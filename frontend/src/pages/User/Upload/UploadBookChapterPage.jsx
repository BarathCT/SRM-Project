import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";

export default function UploadBookChapterPage() {
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue
  } = useForm({
    defaultValues: {
      authors: [{ name: "" }],
      editors: [""],
      studentScholars: [],
      isStudentScholar: "no",
      subjectCategories: []
    }
  });

  const { fields: authors, append: addAuthor } = useFieldArray({
    control,
    name: "authors"
  });

  const { fields: editors, append: addEditor } = useFieldArray({
    control,
    name: "editors"
  });

  const { fields: scholars, append: addScholar } = useFieldArray({
    control,
    name: "studentScholars"
  });

  const isStudentScholar = watch("isStudentScholar");

  async function onSubmit(data) {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/book-chapters", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...data,
        year: Number(data.year)
      })
    });

    const json = await res.json();
    if (!res.ok) {
      alert(json.error);
      return;
    }

    alert("Book chapter uploaded successfully");
    navigate(-1);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">
        Upload Book Chapter
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

        {/* BASIC */}
        <section className="space-y-4">
          <input {...register("chapterTitle", { required: true })}
            placeholder="Chapter Title"
            className="w-full border rounded px-3 py-2" />

          <input {...register("bookTitle", { required: true })}
            placeholder="Book Title"
            className="w-full border rounded px-3 py-2" />
        </section>

        {/* AUTHORS */}
        <section className="space-y-3">
          <h2 className="font-medium">Authors</h2>
          {authors.map((_, i) => (
            <input key={i}
              {...register(`authors.${i}.name`, { required: true })}
              placeholder={`Author ${i + 1}`}
              className="w-full border rounded px-3 py-2" />
          ))}
          <button type="button" onClick={() => addAuthor({ name: "" })}
            className="text-blue-600 text-sm">+ Add Author</button>
        </section>

        {/* EDITORS */}
        <section className="space-y-3">
          <h2 className="font-medium">Editors</h2>
          {editors.map((_, i) => (
            <input key={i}
              {...register(`editors.${i}`, { required: true })}
              placeholder={`Editor ${i + 1}`}
              className="w-full border rounded px-3 py-2" />
          ))}
          <button type="button" onClick={() => addEditor("")}
            className="text-blue-600 text-sm">+ Add Editor</button>
        </section>

        {/* META */}
        <section className="grid md:grid-cols-3 gap-4">
          <input type="number" {...register("year", { required: true })}
            placeholder="Year"
            className="border rounded px-3 py-2" />

          <input {...register("chapterNumber")}
            placeholder="Chapter Number (optional)"
            className="border rounded px-3 py-2" />

          <input {...register("pageRange", { required: true })}
            placeholder="Page Range (e.g. 12–25)"
            className="border rounded px-3 py-2" />
        </section>

        {/* PUBLISHING */}
        <section className="grid md:grid-cols-2 gap-4">
          <input {...register("publisher", { required: true })}
            placeholder="Publisher"
            className="border rounded px-3 py-2" />

          <input {...register("isbn", { required: true })}
            placeholder="ISBN"
            className="border rounded px-3 py-2" />

          <input {...register("doi")}
            placeholder="DOI (optional)"
            className="border rounded px-3 py-2" />

          <input {...register("bookSeries")}
            placeholder="Book Series (optional)"
            className="border rounded px-3 py-2" />
        </section>

        {/* AUTHOR META */}
        <section className="grid md:grid-cols-2 gap-4">
          <input {...register("authorNo", { required: true })}
            placeholder="Author No (1 / 2 / C)"
            className="border rounded px-3 py-2" />

          <input {...register("claimedBy", { required: true })}
            placeholder="Claimed By"
            className="border rounded px-3 py-2" />
        </section>

        {/* STUDENT SCHOLAR */}
        <section className="space-y-3">
          <select {...register("isStudentScholar")}
            className="border rounded px-3 py-2">
            <option value="no">No Student Scholar</option>
            <option value="yes">Student Scholar</option>
          </select>

          {isStudentScholar === "yes" && (
            <>
              {scholars.map((_, i) => (
                <input key={i}
                  {...register(`studentScholars.${i}.name`, { required: true })}
                  placeholder={`Student ${i + 1}`}
                  className="border rounded px-3 py-2" />
              ))}
              <button type="button" onClick={() => addScholar({ name: "", id: "" })}
                className="text-blue-600 text-sm">+ Add Student</button>
            </>
          )}
        </section>

        {/* SUBJECT */}
        <section className="space-y-3">
          <input {...register("subjectArea", { required: true })}
            placeholder="Subject Area"
            className="border rounded px-3 py-2" />

          <input
            placeholder="Subject Categories (comma separated)"
            className="border rounded px-3 py-2"
            onChange={(e) =>
              setValue("subjectCategories",
                e.target.value.split(",").map(v => v.trim()))
            }
          />
        </section>

        {/* SUBMIT */}
        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate(-1)}
            className="border px-4 py-2 rounded">Cancel</button>
          <button type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded">
            Submit Book Chapter
          </button>
        </div>
      </form>
    </div>
  );
}
