import { useState } from "react";

const YearPicker = ({ value, onChange, startYear = 2010, endYear = new Date().getFullYear() }) => {
  const [open, setOpen] = useState(false);

  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  return (
    <div className="relative inline-block w-full">
      {/* Input box */}
      <input
        type="text"
        readOnly
        value={value || ""}
        onClick={() => setOpen(!open)}
        placeholder="Select Year"
        className="w-full cursor-pointer rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Popup */}
      {open && (
        <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
          {years.map((year) => (
            <div
              key={year}
              onClick={() => {
                onChange(String(year));
                setOpen(false);
              }}
              className={`cursor-pointer px-4 py-2 hover:bg-blue-100 ${
                year === value ? "bg-blue-500 text-white" : ""
              }`}
            >
              {year}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default YearPicker;
