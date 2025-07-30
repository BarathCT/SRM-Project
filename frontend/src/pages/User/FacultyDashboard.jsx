import React, { useEffect, useState } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

ChartJS.register(ArcElement, Tooltip, Legend);

const FacultyDashboard = () => {
  const [papers, setPapers] = useState([]);
  const [expanded, setExpanded] = useState(null); // track which paper to show details

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const token = localStorage.getItem("token"); // replace with your auth method
        const response = await axios.get("http://localhost:5000/api/papers/my", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPapers(response.data);
      } catch (error) {
        console.error("Failed to fetch papers", error);
      }
    };

    fetchPapers();
  }, []);

  const paperCount = papers.length;

  const categoryCounts = papers.reduce((acc, paper) => {
    const category = paper.category || "Uncategorized";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const pieData = {
    labels: Object.keys(categoryCounts),
    datasets: [
      {
        data: Object.values(categoryCounts),
        backgroundColor: ["#3B82F6", "#FACC15", "#10B981", "#A78BFA", "#F472B6"],
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    plugins: {
      legend: {
        position: "bottom",
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Welcome, Faculty Member
      </h1>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Personal Publications</p>
            <p className="text-2xl font-bold">{paperCount}</p>
            <p className="text-xs text-gray-400">This is based on your profile</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Publication Categories</CardTitle>
            <CardDescription>Based on submitted papers</CardDescription>
          </CardHeader>
          <CardContent className="h-40">
            <Pie data={pieData} options={pieOptions} />
          </CardContent>
        </Card>
      </div>

      {/* Publications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Publications</CardTitle>
          <CardDescription>Click "More Info" to view full details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 px-4">Authors</th>
                  <th className="py-2 px-4">DTL</th>
                  <th className="py-2 px-4">Journal</th>
                  <th className="py-2 px-4">DOI</th>
                  <th className="py-2 px-4">Q Rating</th>
                  <th className="py-2 px-4">More Info</th>
                </tr>
              </thead>
              <tbody>
                {papers.map((paper, index) => (
                  <React.Fragment key={paper._id}>
                    <tr className="border-b">
                      <td className="py-2 px-4">
                        {paper.authors.map((a) =>
                          a.isCorresponding ? `${a.name} (C)` : a.name
                        ).join(", ")}
                      </td>
                      <td className="py-2 px-4">{paper.publicationId}</td>
                      <td className="py-2 px-4">{paper.journal}</td>
                      <td className="py-2 px-4">{paper.doi}</td>
                      <td className="py-2 px-4">{paper.qRating}</td>
                      <td className="py-2 px-4">
                        <button
                          onClick={() => setExpanded(expanded === index ? null : index)}
                          className="text-blue-600 hover:underline"
                        >
                          {expanded === index ? "Hide" : "More Info"}
                        </button>
                      </td>
                    </tr>
                    {expanded === index && (
                      <tr>
                        <td colSpan={6} className="bg-gray-100 p-4">
                          <div>
                            <p><strong>Title:</strong> {paper.title}</p>
                            <p><strong>Publisher:</strong> {paper.publisher}</p>
                            <p><strong>Year:</strong> {paper.year}</p>
                            <p><strong>Volume/Issue:</strong> {paper.volume}/{paper.issue}</p>
                            <p><strong>Page No:</strong> {paper.pageNo}</p>
                            <p><strong>Publication Type:</strong> {paper.publicationType}</p>
                            <p><strong>Claimed By:</strong> {paper.claimedBy || "Not Claimed"}</p>
                            <p><strong>Student Scholar:</strong> {paper.isStudentScholar}</p>
                            {paper.studentScholars.length > 0 && (
                              <p><strong>Scholars:</strong> {paper.studentScholars.join(", ")}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-gray-500">
        All records shown above are specific to your faculty account.
      </p>
    </div>
  );
};

export default FacultyDashboard;
