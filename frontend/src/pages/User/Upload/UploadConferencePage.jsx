import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";

export default function UploadConferencePage() {
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue
  } = useForm({
    defaultValues: {
      title: "",
      authors: [{ name: "" }],
      year: "",
      conferenceName: "",
      conferenceType: "International",
      conferenceMode: "Offline",
      conferenceLocation: { city: "", country: "" },
      conferenceStartDate: "",
      conferenceEndDate: "",
      organizer: "",
      proceedingsPublisher: "",
      presentationType: "",
      indexedIn: "",
      authorNo: "",
      claimedBy: "",
      isStudentScholar: "no",
      studentScholars: [],
      subjectArea: "",
      subjectCategories: []
    }
  });

  const { fields: authors, append: addAuthor } = useFieldArray({
    control,
    name: "authors"
  });

  const { fields: scholars, append: addScholar } = useFieldArray({
    control,
    name: "studentScholars"
  });

  const isStudentScholar = watch("isStudentScholar");

  async function onSubmit(data) {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/conference-papers", {
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

    alert("Conference paper saved successfully");
    navigate(-1);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">
        Upload Conference Paper
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

        {/* BASIC INFO */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Basic Information</h2>

          <input
            {...register("title", { required: true })}
            placeholder="Paper Title"
            className="w-full border rounded px-3 py-2"
          />

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="number"
              {...register("year", { required: true })}
              placeholder="Year"
              className="border rounded px-3 py-2"
            />

            <input
              {...register("conferenceName", { required: true })}
              placeholder="Conference Name"
              className="border rounded px-3 py-2"
            />
          </div>
        </section>

        {/* AUTHORS */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Authors</h2>

          {authors.map((_, i) => (
            <input
              key={i}
              {...register(`authors.${i}.name`, { required: true })}
              placeholder={`Author ${i + 1}`}
              className="w-full border rounded px-3 py-2"
            />
          ))}

          <button
            type="button"
            onClick={() => addAuthor({ name: "" })}
            className="text-blue-600 text-sm"
          >
            + Add Author
          </button>
        </section>

        {/* AUTHOR META */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Author Details</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              {...register("authorNo", { required: true })}
              placeholder="Author No (e.g. 1 / 2 / C)"
              className="border rounded px-3 py-2"
            />

            <input
              {...register("claimedBy", { required: true })}
              placeholder="Claimed By (Faculty Name)"
              className="border rounded px-3 py-2"
            />
          </div>
        </section>

        {/* CONFERENCE DETAILS */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Conference Details</h2>

          <div className="grid md:grid-cols-3 gap-4">
            <select {...register("conferenceType")} className="border rounded px-3 py-2">
              <option value="International">International</option>
              <option value="National">National</option>
            </select>

            <select {...register("conferenceMode")} className="border rounded px-3 py-2">
              <option value="Offline">Offline</option>
              <option value="Online">Online</option>
              <option value="Hybrid">Hybrid</option>
            </select>

            <select {...register("presentationType")} className="border rounded px-3 py-2">
              <option value="">Presentation Type</option>
              <option value="Oral">Oral</option>
              <option value="Poster">Poster</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              {...register("conferenceLocation.city", { required: true })}
              placeholder="City"
              className="border rounded px-3 py-2"
            />
            <input
              {...register("conferenceLocation.country", { required: true })}
              placeholder="Country"
              className="border rounded px-3 py-2"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="date"
              {...register("conferenceStartDate", { required: true })}
              className="border rounded px-3 py-2"
            />
            <input
              type="date"
              {...register("conferenceEndDate", { required: true })}
              className="border rounded px-3 py-2"
            />
          </div>

          {/* 🔴 REQUIRED FIELDS FIXED HERE */}
          <div className="grid md:grid-cols-2 gap-4">
            <input
              {...register("organizer", { required: true })}
              placeholder="Organizer"
              className="border rounded px-3 py-2"
            />

            <input
              {...register("proceedingsPublisher", { required: true })}
              placeholder="Proceedings Publisher"
              className="border rounded px-3 py-2"
            />
          </div>
        </section>

        {/* STUDENT SCHOLAR */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Student Scholar</h2>

          <select {...register("isStudentScholar")} className="border rounded px-3 py-2">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>

          {isStudentScholar === "yes" && (
            <>
              {scholars.map((_, i) => (
                <input
                  key={i}
                  {...register(`studentScholars.${i}.name`, { required: true })}
                  placeholder={`Student ${i + 1}`}
                  className="border rounded px-3 py-2"
                />
              ))}
              <button
                type="button"
                onClick={() => addScholar({ name: "" })}
                className="text-blue-600 text-sm"
              >
                + Add Student
              </button>
            </>
          )}
        </section>

        {/* SUBJECT */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Subject</h2>

          <input
            {...register("subjectArea", { required: true })}
            placeholder="Subject Area"
            className="border rounded px-3 py-2"
          />

          <input
            placeholder="Subject Categories (comma separated)"
            className="border rounded px-3 py-2"
            onChange={(e) =>
              setValue(
                "subjectCategories",
                e.target.value.split(",").map(v => v.trim())
              )
            }
          />
        </section>

        {/* SUBMIT */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="border px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            Submit Conference Paper
          </button>
        </div>
      </form>
    </div>
  );
}
