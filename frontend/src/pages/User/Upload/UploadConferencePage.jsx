import { useEffect, useCallback, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import debounce from "lodash.debounce";
import { toast } from "sonner";
import {
  Check,
  AlertTriangle,
  Loader2,
  X,
  Info,
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Users,
  FileText,
  Building,
  Calendar,
  Hash,
  ArrowLeft,
  MapPin,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

// Subject areas and categories data (same as UploadResearchPage)
const subjectAreasData = {
  "Agricultural and Biological Sciences": [
    "Agronomy and Crop Science",
    "Animal Science and Zoology",
    "Aquatic Science",
    "Ecology, Evolution, Behavior and Systematics",
    "Food Science", 
    "Forestry",
    "Horticulture",
    "Insect Science",
    "Plant Science",
    "Soil Science",
    "Agricultural and Biological Sciences (miscellaneous)"
  ],
  "Arts and Humanities": [
    "Archeology",
    "Arts and Humanities (miscellaneous)",
    "Classics",
    "Conservation",
    "History",
    "History and Philosophy of Science",
    "Language and Linguistics",
    "Literature and Literary Theory",
    "Music",
    "Philosophy",
    "Religious Studies",
    "Visual Arts and Performing Arts"
  ],
  "Biochemistry, Genetics and Molecular Biology": [
    "Aging",
    "Biochemistry",
    "Biochemistry, Genetics and Molecular Biology (miscellaneous)",
    "Biophysics",
    "Biotechnology",
    "Cancer Research",
    "Cell Biology",
    "Clinical Biochemistry",
    "Developmental Biology",
    "Endocrinology",
    "Genetics",
    "Molecular Biology",
    "Molecular Medicine",
    "Structural Biology"
  ],
  "Business, Management and Accounting": [
    "Accounting",
    "Business and International Management",
    "Business, Management and Accounting (miscellaneous)",
    "Industrial and Manufacturing Engineering",
    "Management Information Systems",
    "Management of Technology and Innovation",
    "Marketing",
    "Organizational Behavior and Human Resource Management",
    "Strategy and Management",
    "Tourism, Leisure and Hospitality Management"
  ],
  "Chemical Engineering": [
    "Bioengineering",
    "Catalysis",
    "Chemical Engineering (miscellaneous)",
    "Chemical Health and Safety",
    "Colloid and Surface Chemistry",
    "Filtration and Separation",
    "Fluid Flow and Transfer Processes",
    "Process Chemistry and Technology"
  ],
  "Chemistry": [
    "Analytical Chemistry",
    "Chemistry (miscellaneous)",
    "Electrochemistry",
    "Inorganic Chemistry",
    "Organic Chemistry",
    "Physical and Theoretical Chemistry",
    "Spectroscopy"
  ],
  "Computer Science": [
    "Artificial Intelligence",
    "Computational Theory and Mathematics",
    "Computer Graphics and Computer-Aided Design",
    "Computer Networks and Communications",
    "Computer Science Applications",
    "Computer Science (miscellaneous)",
    "Computer Vision and Pattern Recognition",
    "Hardware and Architecture",
    "Human-Computer Interaction",
    "Information Systems",
    "Signal Processing",
    "Software"
  ],
  "Decision Sciences": [
    "Decision Sciences (miscellaneous)",
    "Information Systems and Management",
    "Management Science and Operations Research"
  ],
  "Earth and Planetary Sciences": [
    "Atmospheric Science",
    "Computers in Earth Sciences",
    "Earth and Planetary Sciences (miscellaneous)",
    "Earth-Surface Processes",
    "Economic Geology",
    "Geochemistry and Petrology",
    "Geology",
    "Geophysics",
    "Geotechnical Engineering and Engineering Geology",
    "Oceanography",
    "Paleontology",
    "Space and Planetary Science",
    "Stratigraphy"
  ],
  "Economics, Econometrics and Finance": [
    "Economics and Econometrics",
    "Economics, Econometrics and Finance (miscellaneous)",
    "Finance"
  ],
  "Energy": [
    "Energy Engineering and Power Technology",
    "Energy (miscellaneous)",
    "Fuel Technology",
    "Nuclear Energy and Engineering",
    "Renewable Energy, Sustainability and the Environment"
  ],
  "Engineering": [
    "Aerospace Engineering",
    "Automotive Engineering",
    "Biomedical Engineering",
    "Civil and Structural Engineering",
    "Control and Systems Engineering",
    "Electrical and Electronic Engineering",
    "Engineering (miscellaneous)",
    "Industrial and Manufacturing Engineering",
    "Mechanical Engineering",
    "Ocean Engineering",
    "Safety, Risk, Reliability and Quality"
  ],
  "Environmental Science": [
    "Ecological Modeling",
    "Ecology",
    "Environmental Chemistry",
    "Environmental Engineering",
    "Environmental Science (miscellaneous)",
    "Global and Planetary Change",
    "Health, Toxicology and Mutagenesis",
    "Management, Monitoring, Policy and Law",
    "Nature and Landscape Conservation",
    "Pollution",
    "Waste Management and Disposal",
    "Water Science and Technology"
  ],
  "Immunology and Microbiology": [
    "Applied Microbiology and Biotechnology",
    "Immunology",
    "Immunology and Microbiology (miscellaneous)",
    "Microbiology",
    "Parasitology",
    "Virology"
  ],
  "Materials Science": [
    "Biomaterials",
    "Ceramics and Composites",
    "Electronic, Optical and Magnetic Materials",
    "Materials Chemistry",
    "Materials Science (miscellaneous)",
    "Metals and Alloys",
    "Polymers and Plastics",
    "Surfaces, Coatings and Films"
  ],
  "Mathematics": [
    "Algebra and Number Theory",
    "Analysis",
    "Applied Mathematics",
    "Computational Mathematics",
    "Control and Optimization",
    "Discrete Mathematics and Combinatorics",
    "Geometry and Topology",
    "Logic",
    "Mathematical Physics",
    "Mathematics (miscellaneous)",
    "Modeling and Simulation",
    "Numerical Analysis",
    "Statistics and Probability",
    "Theoretical Computer Science"
  ],
  "Medicine": [
    "Anesthesiology and Pain Medicine",
    "Biochemistry (medical)",
    "Cardiology and Cardiovascular Medicine",
    "Critical Care and Intensive Care Medicine",
    "Complementary and Alternative Medicine",
    "Dermatology",
    "Drug Discovery",
    "Emergency Medicine",
    "Endocrinology, Diabetes and Metabolism",
    "Epidemiology",
    "Family Practice",
    "Gastroenterology",
    "Geriatrics and Gerontology",
    "Health Informatics",
    "Health Policy",
    "Hematology",
    "Hepatology",
    "Histology and Pathology",
    "Immunology and Allergy",
    "Internal Medicine",
    "Medicine (miscellaneous)",
    "Microbiology (medical)",
    "Nephrology",
    "Neurology (clinical)",
    "Obstetrics and Gynecology",
    "Oncology",
    "Ophthalmology",
    "Orthopedics and Sports Medicine",
    "Otorhinolaryngology",
    "Pathology and Forensic Medicine",
    "Pediatrics, Perinatology and Child Health",
    "Pharmacology (medical)",
    "Physiology (medical)",
    "Psychiatry and Mental Health",
    "Public Health, Environmental and Occupational Health",
    "Pulmonary and Respiratory Medicine",
    "Radiology, Nuclear Medicine and Imaging",
    "Rehabilitation",
    "Reproductive Medicine",
    "Reviews and References (medical)",
    "Rheumatology",
    "Surgery",
    "Transplantation",
    "Urology"
  ],
  "Neuroscience": [
    "Behavioral Neuroscience",
    "Biological Psychiatry",
    "Cellular and Molecular Neuroscience",
    "Cognitive Neuroscience",
    "Developmental Neuroscience",
    "Endocrine and Autonomic Systems",
    "Neurology",
    "Neuroscience (miscellaneous)",
    "Sensory Systems"
  ],
  "Nursing": [
    "Advanced and Specialized Nursing",
    "Assessment and Diagnosis",
    "Care Planning",
    "Community and Home Care",
    "Critical Care Nursing",
    "Emergency Nursing",
    "Fundamentals and Skills",
    "Gerontology",
    "Issues, Ethics and Legal Aspects",
    "Leadership and Management",
    "Maternity and Midwifery",
    "Nurse Assisting",
    "Nursing (miscellaneous)",
    "Nutrition and Dietetics",
    "Oncology (nursing)",
    "Pathophysiology",
    "Pediatric Nursing",
    "Pharmacology (nursing)",
    "Psychiatric Mental Health",
    "Public Health, Environmental and Occupational Health",
    "Research and Theory",
    "Review and Exam Preparation"
  ],
  "Pharmacology, Toxicology and Pharmaceutics": [
    "Drug Discovery",
    "Pharmaceutical Science",
    "Pharmacology",
    "Pharmacology, Toxicology and Pharmaceutics (miscellaneous)",
    "Toxicology"
  ],
  "Physics and Astronomy": [
    "Acoustics and Ultrasonics",
    "Astronomy and Astrophysics",
    "Atomic and Molecular Physics, and Optics",
    "Condensed Matter Physics",
    "Instrumentation",
    "Nuclear and High Energy Physics",
    "Physics and Astronomy (miscellaneous)",
    "Radiation",
    "Statistical and Nonlinear Physics",
    "Surfaces and Interfaces"
  ],
  "Psychology": [
    "Applied Psychology",
    "Clinical Psychology",
    "Developmental and Educational Psychology",
    "Experimental and Cognitive Psychology",
    "Neuropsychology and Physiological Psychology",
    "Psychology (miscellaneous)",
    "Social Psychology"
  ],
  "Social Sciences": [
    "Anthropology",
    "Archeology",
    "Communication",
    "Cultural Studies",
    "Demography",
    "Development",
    "Education",
    "Gender Studies",
    "Geography, Planning and Development",
    "Health (social science)",
    "Human Factors and Ergonomics",
    "Law",
    "Library and Information Sciences",
    "Linguistics and Language",
    "Political Science and International Relations",
    "Public Administration",
    "Safety Research",
    "Social Sciences (miscellaneous)",
    "Social Work",
    "Sociology and Political Science",
    "Transportation",
    "Urban Studies"
  ],
  "Veterinary": [
    "Equine",
    "Food Animals",
    "Small Animals",
    "Veterinary (miscellaneous)"
  ],
  "Dentistry": [
    "Dental Assisting",
    "Dental Hygiene",
    "Dentistry (miscellaneous)",
    "Oral Surgery",
    "Orthodontics",
    "Periodontics"
  ],
  "Health Professions": [
    "Chiropractics",
    "Complementary and Manual Therapy",
    "Emergency Medical Services",
    "Health Information Management",
    "Health Professions (miscellaneous)",
    "Medical Assisting and Transcription",
    "Medical Laboratory Technology",
    "Occupational Therapy",
    "Optometry",
    "Pharmacy",
    "Physical Therapy, Sports Therapy and Rehabilitation",
    "Podiatry",
    "Radiological and Ultrasound Technology",
    "Respiratory Care",
    "Speech and Hearing"
  ],
  "Multidisciplinary": [
    "Multidisciplinary"
  ]
};

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  authors: z.array(z.object({
    name: z.string().min(1, "Author name is required."),
  })).min(1, "At least one author is required.").max(15, "You can add up to 15 authors only."),
  year: z.string().min(4, "Year must be 4 digits.").max(4, "Year must be 4 digits."),
  conferenceName: z.string().min(1, "Conference name is required."),
  conferenceShortName: z.string().optional(),
  conferenceType: z.enum(["International", "National"], { required_error: "Conference type is required." }),
  conferenceMode: z.enum(["Offline", "Online", "Hybrid"], { required_error: "Conference mode is required." }),
  conferenceLocation: z.object({
    city: z.string().min(1, "City is required."),
    country: z.string().min(1, "Country is required.")
  }),
  conferenceStartDate: z.string().min(1, "Start date is required."),
  conferenceEndDate: z.string().min(1, "End date is required."),
  organizer: z.string().min(1, "Organizer is required."),
  proceedingsTitle: z.string().optional(),
  proceedingsPublisher: z.string().optional(),
  isbn: z.string().optional(),
  doi: z.string().optional(),
  pageNo: z.string().optional(),
  acceptanceRate: z.string().optional(),
  presentationType: z.string().optional(),
  indexedIn: z.string().optional(),
  claimedBy: z.string().min(1, "This field is required."),
  authorNo: z.string().min(1, "This field is required."),
  isStudentScholar: z.enum(["yes", "no"], { required_error: "Student scholar selection is required." }),
  studentScholars: z.array(z.object({
    name: z.string().min(1, "Student author name is required."),
    id: z.string().min(1, "Student ID is required."),
  })).optional(),
  subjectArea: z.string().min(1, "Subject area is required."),
  subjectCategories: z.array(z.string()).min(1, "At least one subject category is required.")
}).superRefine((data, ctx) => {
  if (data.isStudentScholar === 'yes') {
    if (!data.studentScholars || data.studentScholars.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one student scholar must be added.",
        path: ['studentScholars']
      });
    }
  }
});

function decodeToken(token) {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function SectionHeader({ step, icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-200">
        <span className="text-sm font-semibold text-blue-800">{step}</span>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-black flex items-center gap-2">
          <Icon className="h-5 w-5 text-blue-700" />
          {title}
        </h3>
        {subtitle && <p className="text-sm text-black/70">{subtitle}</p>}
      </div>
    </div>
  );
}

function SubjectCategoriesSelect({ value, onChange, subjectArea, error }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const availableCategories = subjectArea ? subjectAreasData[subjectArea] || [] : [];
  const filteredCategories = availableCategories.filter(category =>
    category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleCategory = (category) => {
    const currentValue = value || [];
    const updatedValue = currentValue.includes(category)
      ? currentValue.filter(item => item !== category)
      : [...currentValue, category];
    onChange(updatedValue);
  };

  const handleSelectAll = () => onChange(filteredCategories);
  const handleClearAll = () => onChange([]);

  const selectedCount = value?.length || 0;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-full justify-between ${error ? "border-blue-600" : ""}`}
            disabled={!subjectArea}
          >
            <span className="text-black">
              {selectedCount > 0
                ? `${selectedCount} categories selected`
                : subjectArea
                  ? "Select subject categories..."
                  : "Select subject area first"}
            </span>
            {open ? <ChevronUp className="ml-2 h-4 w-4 text-blue-700" /> : <ChevronDown className="ml-2 h-4 w-4 text-blue-700" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 border border-blue-200" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <div className="p-4 space-y-4 bg-white">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-blue-700" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredCategories.length === 0}
                className="flex-1 border-blue-600 text-blue-700 hover:bg-blue-50"
              >
                Select All ({filteredCategories.length})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                disabled={selectedCount === 0}
                className="flex-1 border-blue-600 text-blue-700 hover:bg-blue-50"
              >
                Clear All
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <div key={category} className="flex items-center space-x-2 p-2 rounded hover:bg-blue-50">
                    <Checkbox
                      id={category}
                      checked={value?.includes(category) || false}
                      onCheckedChange={() => handleToggleCategory(category)}
                    />
                    <label
                      htmlFor={category}
                      className="text-sm leading-none cursor-pointer flex-1 text-black"
                    >
                      {category}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-black/70 text-center py-4">
                  {searchTerm ? "No categories found" : "No categories available"}
                </p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {value.map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="text-xs bg-blue-100 text-blue-800 border border-blue-200"
            >
              {category}
              <button
                type="button"
                onClick={() => handleToggleCategory(category)}
                className="ml-1 rounded-full hover:bg-blue-50"
              >
                <X className="h-3 w-3 text-blue-700" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UploadConferencePage({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isCheckingDoi, setIsCheckingDoi] = useState(false);
  const [isCheckingIsbn, setIsCheckingIsbn] = useState(false);
  const [doiStatus, setDoiStatus] = useState({ validOnCrossref: false, message: "" });
  const [isbnStatus, setIsbnStatus] = useState({ validOnOpenLibrary: false, message: "" });
  const currentYear = new Date().getFullYear();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      authors: [{ name: "" }],
      year: "",
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
      acceptanceRate: "",
      presentationType: "",
      indexedIn: "",
      claimedBy: "",
      authorNo: "",
      isStudentScholar: "no",
      studentScholars: [],
      subjectArea: "",
      subjectCategories: []
    },
    mode: "onChange"
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const payload = decodeToken(token);
    if (!payload) {
      localStorage.removeItem('token');
      navigate('/login');
      return;
    }
    setIsAuthenticated(true);
  }, [navigate]);

  const { fields: authorFields, append: appendAuthor, remove: removeAuthor } = useFieldArray({ control: form.control, name: "authors" });
  const { fields: studentFields, append: appendStudent, remove: removeStudent } = useFieldArray({ control: form.control, name: "studentScholars" });

  const watchAuthors = form.watch("authors");
  const watchIsStudentScholar = form.watch("isStudentScholar");
  const watchSubjectArea = form.watch("subjectArea");
  const watchSubjectCategories = form.watch("subjectCategories");

  // Auto-calculate author number when claimedBy changes
  useEffect(() => {
    const sub = form.watch((values, { name }) => {
      if (name === "claimedBy") {
        const claimed = values.claimedBy;
        if (!claimed) {
          form.setValue("authorNo", "", { shouldValidate: true });
          return;
        }

        const foundIndex = watchAuthors?.findIndex(a => a.name === claimed) ?? -1;
        if (foundIndex !== -1) {
          form.setValue("authorNo", (foundIndex + 1).toString(), { shouldValidate: true });
        } else {
          form.setValue("authorNo", "", { shouldValidate: true });
        }
      }
    });
    return () => sub.unsubscribe();
  }, [form, watchAuthors]);

  // DOI validation with Crossref
  const debouncedDoiCheck = useCallback(
    debounce(async (doiRaw) => {
      const doi = doiRaw?.trim?.();
      if (!doi) {
        setDoiStatus({ validOnCrossref: false, message: "" });
        return;
      }
      setIsCheckingDoi(true);
      try {
        // Crossref lookup
        const normalizedDoi = doi.toLowerCase();
        const resCrossref = await fetch(`https://api.crossref.org/works/${encodeURIComponent(normalizedDoi)}`);
        if (resCrossref.ok) {
          setDoiStatus({
            validOnCrossref: true,
            message: ""
          });
        } else {
          setDoiStatus({
            validOnCrossref: false,
            message: "You have entered an invalid DOI."
          });
        }
      } catch (err) {
        setDoiStatus({
          validOnCrossref: false,
          message: "Error checking DOI."
        });
      } finally {
        setIsCheckingDoi(false);
      }
    }, 350),
    []
  );

  // ISBN validation with Open Library API
  const debouncedIsbnCheck = useCallback(
    debounce(async (isbnRaw) => {
      const isbn = isbnRaw?.trim?.();
      if (!isbn) {
        setIsbnStatus({ validOnOpenLibrary: false, message: "" });
        return;
      }
      setIsCheckingIsbn(true);
      try {
        // Open Library API
        const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
        const data = await res.json();
        
        if (data && Object.keys(data).length > 0) {
          setIsbnStatus({
            validOnOpenLibrary: true,
            message: ""
          });
        } else {
          setIsbnStatus({
            validOnOpenLibrary: false,
            message: "ISBN not found in Open Library."
          });
        }
      } catch (err) {
        setIsbnStatus({
          validOnOpenLibrary: false,
          message: "Error checking ISBN."
        });
      } finally {
        setIsCheckingIsbn(false);
      }
    }, 350),
    []
  );

  async function onSubmit(values) {
    // Check DOI if provided
    if (values.doi && !doiStatus.validOnCrossref) {
      toast.error("Please enter a valid DOI or remove it.");
      return;
    }

    // Check ISBN if provided
    if (values.isbn && !isbnStatus.validOnOpenLibrary) {
      toast.error("Please enter a valid ISBN or remove it.");
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    const payload = {
      ...values,
      year: Number(values.year),
      studentScholars: values.isStudentScholar === 'yes' ? values.studentScholars : []
    };

    setIsPending(true);
    try {
      const data = await toast.promise(
        (async () => {
          const res = await fetch(`${API_BASE_URL}/api/conference-papers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

          let resJson = null;
          try {
            resJson = await res.json();
          } catch (e) {
            console.warn("Response has no JSON body");
          }

          if (!res.ok) {
            const message = Array.isArray(resJson?.details)
              ? `${resJson?.error || 'Submission failed'}: ${resJson.details.join(', ')}`
              : resJson?.error || `Submission failed (${res.status})`;
            throw new Error(message);
          }

          return resJson || { success: true };
        })(),
        {
          loading: 'Saving conference paper...',
          success: 'Conference paper uploaded successfully.',
          error: (err) => err.message || 'Submission failed',
        }
      );

      await Swal.fire({
        icon: 'success',
        title: 'Successfully Submitted!',
        text: 'Your conference paper has been uploaded.',
        confirmButtonColor: '#2563eb',
      });

      form.reset({
        title: "",
        authors: [{ name: "" }],
        year: "",
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
        acceptanceRate: "",
        presentationType: "",
        indexedIn: "",
        claimedBy: "",
        authorNo: "",
        isStudentScholar: "no",
        studentScholars: [],
        subjectArea: "",
        subjectCategories: []
      });
      setDoiStatus({ validOnCrossref: false, message: "" });
      setIsbnStatus({ validOnOpenLibrary: false, message: "" });

    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setIsPending(false);
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="border-blue-600 text-blue-700 hover:bg-blue-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-black">
                  Submit a Conference Paper
                </h1>
                <p className="text-black/70">Fill in the details of the conference publication.</p>
              </div>
            </div>
          )}

          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-black">Conference Paper Details</CardTitle>
              <CardDescription className="text-black/70">
                Please provide accurate information for all required fields.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(
                    onSubmit,
                    (errors) => {
                      console.error('Validation errors:', errors);
                      toast.error("Please fix the highlighted fields.");
                    }
                  )}
                  className="space-y-10"
                >
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <SectionHeader
                      step={1}
                      icon={FileText}
                      title="Basic Information"
                      subtitle="Basic details about the conference paper"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-black">Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Paper Title" {...field} />
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-700" />
                              Year
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value ?? ""}
                            >
                              <FormControl>
                                <SelectTrigger className="text-black">
                                  <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: currentYear - 2019 }).map((_, i) => {
                                  const y = 2020 + i;
                                  return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>;
                                })}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="conferenceName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Conference Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Conference Name" {...field} />
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Authors */}
                  <div className="space-y-4">
                    <SectionHeader
                      step={2}
                      icon={Users}
                      title="Authors"
                      subtitle="Add all authors of the paper"
                    />
                    {authorFields.map((field, index) => (
                      <div key={field.id} className="flex flex-col md:flex-row items-stretch md:items-center gap-4 p-3 border border-blue-200 rounded-md bg-white">
                        <span className="text-sm font-medium text-blue-700">{index + 1}.</span>
                        <FormField
                          control={form.control}
                          name={`authors.${index}.name`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-black">Author Name</FormLabel>
                              <FormControl>
                                <Input placeholder={`Author ${index + 1} Name`} {...field} />
                              </FormControl>
                              <FormMessage className="text-blue-700" />
                            </FormItem>
                          )}
                        />
                        {authorFields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeAuthor(index)}
                            className="border-blue-600 text-blue-700 hover:bg-blue-50"
                            aria-label="Remove author"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {authorFields.length < 15 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-blue-600 text-blue-700 hover:bg-blue-50"
                        onClick={() => appendAuthor({ name: "" })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Author
                      </Button>
                    )}
                  </div>

                  {/* Author Claim */}
                  <div className="space-y-4">
                    <SectionHeader
                      step={3}
                      icon={Users}
                      title="Author Claim"
                      subtitle="Select which author is claiming this paper"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="claimedBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Claimed By</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                              <FormControl>
                                <SelectTrigger className="text-black">
                                  <SelectValue placeholder="Select an author" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {watchAuthors?.map((author, index) =>
                                  author.name ? (
                                    <SelectItem key={index} value={author.name}>
                                      {author.name}
                                    </SelectItem>
                                  ) : null
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="authorNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Author No.</FormLabel>
                            <FormControl>
                              <Select value={field.value ?? ""} disabled>
                                <FormControl>
                                  <SelectTrigger className="text-black">
                                    <SelectValue placeholder="Auto-calculated" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {watchAuthors?.map((author, index) =>
                                    author.name ? (
                                      <SelectItem key={index} value={(index + 1).toString()}>
                                        {index + 1}
                                      </SelectItem>
                                    ) : null
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Conference Details */}
                  <div className="space-y-4">
                    <SectionHeader
                      step={4}
                      icon={Building}
                      title="Conference Details"
                      subtitle="Details about the conference and proceedings"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="conferenceType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Conference Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                              <FormControl>
                                <SelectTrigger className="text-black">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="International">International</SelectItem>
                                <SelectItem value="National">National</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="conferenceMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Conference Mode</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                              <FormControl>
                                <SelectTrigger className="text-black">
                                  <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Offline">Offline</SelectItem>
                                <SelectItem value="Online">Online</SelectItem>
                                <SelectItem value="Hybrid">Hybrid</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="conferenceLocation.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">City</FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} />
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="conferenceLocation.country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Country</FormLabel>
                            <FormControl>
                              <Input placeholder="Country" {...field} />
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="conferenceStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="conferenceEndDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="organizer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Organizer</FormLabel>
                            <FormControl>
                              <Input placeholder="Organizer" {...field} />
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="proceedingsPublisher"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Proceedings Publisher</FormLabel>
                            <FormControl>
                              <Input placeholder="Proceedings Publisher" {...field} />
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="proceedingsTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Proceedings Title (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Proceedings Title" {...field} />
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="presentationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Presentation Type (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                              <FormControl>
                                <SelectTrigger className="text-black">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Oral">Oral</SelectItem>
                                <SelectItem value="Poster">Poster</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pageNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Page No (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., 100-110" 
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (/^[0-9]*-?[0-9]*$/.test(value)) {
                                    field.onChange(value);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="acceptanceRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Acceptance Rate (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., 25%" 
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (/^[0-9]*\.?[0-9]*%?$/.test(value)) {
                                    field.onChange(value);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="indexedIn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Indexed In (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                              <FormControl>
                                <SelectTrigger className="text-black">
                                  <SelectValue placeholder="Select indexing" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Scopus">Scopus</SelectItem>
                                <SelectItem value="Web of Science">Web of Science</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      {/* DOI Field */}
                      <FormField
                        control={form.control}
                        name="doi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black flex items-center gap-2">
                              <Hash className="h-4 w-4 text-blue-700" />
                              DOI (Optional)
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="e.g., 10.1000/xyz123"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    if (e.target.value.trim()) {
                                      debouncedDoiCheck(e.target.value);
                                    } else {
                                      setDoiStatus({ validOnCrossref: false, message: "" });
                                    }
                                  }}
                                />
                                {isCheckingDoi && (
                                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-700" />
                                )}
                                {doiStatus.validOnCrossref && !isCheckingDoi && field.value.trim() && (
                                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                                )}
                              </div>
                            </FormControl>

                            {doiStatus.message && !doiStatus.validOnCrossref && !isCheckingDoi && field.value.trim() && (
                              <div className="flex items-center text-sm mt-2 text-red-800 bg-red-100 border border-red-200 rounded p-2">
                                <AlertTriangle className="h-4 w-4 mr-2 text-red-700" />
                                {doiStatus.message}
                              </div>
                            )}

                            {doiStatus.validOnCrossref && !isCheckingDoi && field.value.trim() && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2 border-blue-600 text-blue-700 hover:bg-blue-50"
                                onClick={() => window.open(`https://doi.org/${field.value.trim()}`, "_blank")}
                              >
                                Ensure DOI
                              </Button>
                            )}

                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      {/* ISBN Field */}
                      <FormField
                        control={form.control}
                        name="isbn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">ISBN (Optional)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="e.g., 978-3-16-148410-0"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    if (e.target.value.trim()) {
                                      debouncedIsbnCheck(e.target.value);
                                    } else {
                                      setIsbnStatus({ validOnOpenLibrary: false, message: "" });
                                    }
                                  }}
                                />
                                {isCheckingIsbn && (
                                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-700" />
                                )}
                                {isbnStatus.validOnOpenLibrary && !isCheckingIsbn && field.value.trim() && (
                                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                                )}
                              </div>
                            </FormControl>

                            {isbnStatus.message && !isbnStatus.validOnOpenLibrary && !isCheckingIsbn && field.value.trim() && (
                              <div className="flex items-center text-sm mt-2 text-red-800 bg-red-100 border border-red-200 rounded p-2">
                                <AlertTriangle className="h-4 w-4 mr-2 text-red-700" />
                                {isbnStatus.message}
                              </div>
                            )}

                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Subject Classification */}
                  <div className="space-y-4">
                    <SectionHeader
                      step={5}
                      icon={MapPin}
                      title="Subject Classification"
                      subtitle="Choose the relevant subject area and categories"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="subjectArea"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Subject Area</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue("subjectCategories", []);
                              }}
                              value={field.value ?? ""}
                            >
                              <FormControl>
                                <SelectTrigger className="text-black">
                                  <SelectValue placeholder="Select subject area" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.keys(subjectAreasData).map((area) => (
                                  <SelectItem key={area} value={area}>
                                    {area}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subjectCategories"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Subject Categories</FormLabel>
                            <FormControl>
                              <SubjectCategoriesSelect
                                value={field.value}
                                onChange={field.onChange}
                                subjectArea={watchSubjectArea}
                                error={form.formState.errors.subjectCategories}
                              />
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Student Scholars */}
                  <div className="space-y-4">
                    <SectionHeader
                      step={6}
                      icon={Users}
                      title="Student Scholars"
                      subtitle="Indicate if any authors are student scholars"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="isStudentScholar"
                        render={({ field }) => (
                          <FormItem className="space-y-3 md:col-span-2">
                            <FormLabel className="text-black">Student Scholar?</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex gap-6"
                              >
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <RadioGroupItem value="yes" />
                                  </FormControl>
                                  <FormLabel className="font-normal text-black">Yes</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <RadioGroupItem value="no" />
                                  </FormControl>
                                  <FormLabel className="font-normal text-black">No</FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      {watchIsStudentScholar === "yes" && (
                        <div className="space-y-4 md:col-span-2">
                          <span className="text-black font-medium">Student Scholars</span>
                          {studentFields.map((field, index) => (
                            <div key={field.id} className="flex flex-col md:flex-row items-stretch md:items-start gap-4 p-3 border border-blue-200 rounded-md bg-white">
                              <span className="text-sm font-medium text-blue-700">{index + 1}.</span>
                              <FormField
                                control={form.control}
                                name={`studentScholars.${index}.name`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormLabel className="text-black">Student Author</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                      <FormControl>
                                        <SelectTrigger className="text-black">
                                          <SelectValue placeholder="Select student author" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {watchAuthors?.map((author, authorIndex) => (
                                          author.name && <SelectItem key={authorIndex} value={author.name}>{author.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage className="text-blue-700" />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`studentScholars.${index}.id`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormLabel className="text-black">Student ID</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Student ID" {...field} />
                                    </FormControl>
                                    <FormMessage className="text-blue-700" />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeStudent(index)}
                                className="border-blue-600 text-blue-700 hover:bg-blue-50 self-start"
                                aria-label="Remove student"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-blue-600 text-blue-700 hover:bg-blue-50"
                            onClick={() => appendStudent({ name: "", id: "" })}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Student Scholar
                          </Button>
                          {form.formState.errors.studentScholars?.root && (
                            <p className="text-sm font-medium text-blue-700">
                              {form.formState.errors.studentScholars.root.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <Alert className="border-blue-200 bg-blue-100">
                    <Info className="h-4 w-4 text-blue-700" />
                    <AlertTitle className="text-black">Heads up!</AlertTitle>
                    <AlertDescription className="text-black/80">
                      Please double-check all fields before submission.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      type="submit"
                      disabled={isPending || 
                        (form.watch("doi") && !doiStatus.validOnCrossref) ||
                        (form.watch("isbn") && !isbnStatus.validOnOpenLibrary)
                      }
                      className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white"
                    >
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Conference Paper
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        form.reset();
                        setDoiStatus({ validOnCrossref: false, message: "" });
                        setIsbnStatus({ validOnOpenLibrary: false, message: "" });
                      }}
                      disabled={isPending}
                      className="w-full sm:w-auto border-blue-600 text-blue-700 hover:bg-blue-50"
                    >
                      Reset Form
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  return content;
}