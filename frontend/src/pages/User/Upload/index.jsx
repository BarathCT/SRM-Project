import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Users, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UploadSelector() {
  const navigate = useNavigate();

  const options = [
    {
      title: "Research Paper",
      description: "Upload journal research publications",
      icon: FileText,
      path: "research"
    },
    {
      title: "Conference Paper",
      description: "Upload conference proceedings",
      icon: Users,
      path: "conference"
    },
    {
      title: "Book Chapter",
      description: "Upload book chapter publications",
      icon: BookOpen,
      path: "book-chapter"
    }
  ];

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full p-6">
        {options.map(({ title, description, icon: Icon, path }) => (
          <Card
            key={title}
            onClick={() => navigate(path)}
            className="cursor-pointer hover:shadow-lg transition border-blue-200"
          >
            <CardHeader className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Icon className="h-6 w-6 text-blue-700" />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
