import { useState } from "react";
import { FileText, Users, BookOpen, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UploadResearchPage from "./UploadResearchPage";
import UploadConferencePage from "./UploadConferencePage";
import UploadBookChapterPage from "./UploadBookChapterPage";

const PUBLICATION_TYPES = [
  {
    value: "research",
    label: "Research Paper",
    description: "Upload journal research publications",
    icon: FileText,
    color: "blue",
  },
  {
    value: "conference",
    label: "Conference Paper",
    description: "Upload conference proceedings",
    icon: Users,
    color: "purple",
  },
  {
    value: "book-chapter",
    label: "Book Chapter",
    description: "Upload book chapter publications",
    icon: BookOpen,
    color: "green",
  },
];

export default function UploadSelector() {
  const [selectedType, setSelectedType] = useState<string>("research");

  const selectedOption = PUBLICATION_TYPES.find((opt) => opt.value === selectedType);
  const SelectedIcon = selectedOption?.icon || FileText;

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
        };
      case "purple":
        return {
          bg: "bg-purple-50",
          border: "border-purple-200",
          text: "text-purple-700",
          iconBg: "bg-purple-100",
          iconColor: "text-purple-600",
        };
      case "green":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          text: "text-green-700",
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
        };
      default:
        return {
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-700",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
        };
    }
  };

  const colors = selectedOption ? getColorClasses(selectedOption.color) : getColorClasses("blue");

  const renderForm = () => {
    switch (selectedType) {
      case "research":
        return <UploadResearchPage embedded={true} />;
      case "conference":
        return <UploadConferencePage embedded={true} />;
      case "book-chapter":
        return <UploadBookChapterPage embedded={true} />;
      default:
        return <UploadResearchPage embedded={true} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Premium Header Section */}
        <div className="mb-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Upload Publication
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Submit your research publications to the system
                </p>
              </div>
            </div>
          </div>

          {/* Premium Publication Type Selector */}
          <Card className="border border-gray-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Publication Type
                  </label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white hover:border-gray-400 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-md ${colors.iconBg}`}>
                          <SelectedIcon className={`h-5 w-5 ${colors.iconColor}`} />
                        </div>
                        <SelectValue placeholder="Select publication type" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {PUBLICATION_TYPES.map((type) => {
                        const Icon = type.icon;
                        const typeColors = getColorClasses(type.color);
                        return (
                          <SelectItem
                            key={type.value}
                            value={type.value}
                            className="py-3 cursor-pointer hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-md ${typeColors.iconBg}`}>
                                <Icon className={`h-4 w-4 ${typeColors.iconColor}`} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{type.label}</span>
                                <span className="text-xs text-gray-500">{type.description}</span>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {selectedOption && (
                  <div
                    className={`px-5 py-4 rounded-lg border ${colors.bg} ${colors.border} flex items-center gap-4 min-w-[280px]`}
                  >
                    <div className={`p-2.5 rounded-lg ${colors.iconBg} flex-shrink-0`}>
                      <SelectedIcon className={`h-6 w-6 ${colors.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {selectedOption.label}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                        {selectedOption.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Content with smooth transition */}
        <div className="transition-all duration-300 ease-in-out">
          {renderForm()}
        </div>
      </div>
    </div>
  );
}
