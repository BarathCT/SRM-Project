import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Users, BookOpen, ArrowLeft, MoreVertical, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
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
  const [selectedType, setSelectedType] = useState("research");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const selectedOption = PUBLICATION_TYPES.find((opt) => opt.value === selectedType);
  const SelectedIcon = selectedOption?.icon || FileText;

  const getColorClasses = (color) => {
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

  const handleSelectType = (value) => {
    setSelectedType(value);
    setDrawerOpen(false);
  };

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
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="h-9 w-9 hover:bg-gray-100 text-gray-700 flex-shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Upload {selectedOption?.label || "Publication"}
                  </h1>
                  <p className="text-gray-600 text-sm mt-1">
                    Submit your research publications to the system
                  </p>
                </div>
              </div>

              {/* Desktop: Dropdown (hidden on mobile/tablet) */}
              <div className="hidden md:block flex-shrink-0">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="h-12 text-base border-gray-300 focus:border-gray-400 focus:ring-0 focus:ring-offset-0 bg-white hover:border-gray-400 transition-colors min-w-[200px]">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-1.5 rounded-md ${colors.iconBg}`}>
                        <SelectedIcon className={`h-5 w-5 ${colors.iconColor}`} />
                      </div>
                      <span className="text-gray-900 font-medium">
                        {selectedOption?.label || 'Select publication type'}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {PUBLICATION_TYPES.map((type) => {
                      const Icon = type.icon;
                      const typeColors = getColorClasses(type.color);
                      return (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="py-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:ring-0"
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

              {/* Mobile/Tablet: Three-dot menu (visible on mobile/tablet only) */}
              <div className="md:hidden flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setDrawerOpen(true)}
                  className="h-10 w-10 hover:bg-gray-100 text-gray-700"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Drawer for Publication Type Selection */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="bg-white">
            <DrawerHeader className="border-b border-gray-100">
              <DrawerTitle className="text-lg font-semibold text-gray-900">
                Select Publication Type
              </DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-2">
              {PUBLICATION_TYPES.map((type) => {
                const Icon = type.icon;
                const typeColors = getColorClasses(type.color);
                const isSelected = selectedType === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => handleSelectType(type.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
                        ? `${typeColors.bg} ${typeColors.border}`
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    <div className={`p-2.5 rounded-lg ${typeColors.iconBg}`}>
                      <Icon className={`h-5 w-5 ${typeColors.iconColor}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-sm text-gray-500">{type.description}</div>
                    </div>
                    {isSelected && (
                      <div className={`p-1 rounded-full ${typeColors.iconBg}`}>
                        <Check className={`h-4 w-4 ${typeColors.iconColor}`} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t border-gray-100">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </DrawerClose>
            </div>
          </DrawerContent>
        </Drawer>

        {/* Form Content with smooth transition */}
        <div className="transition-all duration-300 ease-in-out">
          {renderForm()}
        </div>
      </div>
    </div>
  );
}

