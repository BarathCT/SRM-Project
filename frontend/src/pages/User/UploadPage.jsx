import { useEffect, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
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

// Subject areas and categories data
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
  authors: z.array(z.object({
    name: z.string().min(1, "Author name is required."),
    isCorresponding: z.boolean().default(false),
  })).min(1, "At least one author is required.").max(15, "You can add up to 15 authors only."),
  title: z.string().min(1, "Title is required."),
  journalName: z.string().min(1, "Journal name is required."),
  publisherName: z.string().min(1, "Publisher name is required."),
  volume: z.string().optional(),
  issue: z.string().optional(),
  pageNo: z.string().optional(),
  doi: z.string().min(1, "A valid DOI is required."),
  publication: z.enum(["scopus", "sci", "webOfScience", ""], { required_error: "Publication type is required." }).or(z.string()).optional(),
  facultyId: z.string().min(1, "Faculty ID is required."),
  publicationId: z.string().min(1, "Publication ID is required."),
  year: z.string().min(4, "Year must be 4 digits.").max(4, "Year must be 4 digits."),
  claimedBy: z.string().min(1, "This field is required."),
  authorNo: z.string().min(1, "This field is required."),
  isStudentScholar: z.enum(["yes", "no"], { required_error: "Student scholar selection is required." }),
  studentScholars: z.array(z.object({
    name: z.string().min(1, "Student author name is required."),
    id: z.string().min(1, "Student ID is required."),
  })).optional(),
  qRating: z.string().min(1, "Q rating is required."),
  issueType: z.string().min(1, "Type of issue is required."),
  subjectAreas: z.array(z.object({
    area: z.string().min(1, "Subject area is required."),
    categories: z.array(z.string()).min(1, "At least one subject category is required."),
  })).min(1, "At least one subject area is required."),
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

export default function UploadPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isCheckingDoi, setIsCheckingDoi] = useState(false);
  // doiStatus: isDuplicate | validOnCrossref | message
  const [doiStatus, setDoiStatus] = useState({ isDuplicate: null, validOnCrossref: false, message: "" });
  // userAuthorIds will hold the author's saved identifiers from settings (scopus, sci, webOfScience)
  const [userAuthorIds, setUserAuthorIds] = useState({ scopus: "", sci: "", webOfScience: "" });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      authors: [{ name: "", isCorresponding: false }],
      title: "",
      journalName: "",
      publisherName: "",
      volume: "",
      issue: "",
      pageNo: "",
      doi: "",
      facultyId: "",
      publicationId: "",
      year: "",
      qRating: "",
      issueType: "",
      studentScholars: [],
      publication: undefined,
      claimedBy: "",
      authorNo: "",
      isStudentScholar: "no",
      subjectAreas: [{ area: "", categories: [] }]
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
    if (!payload || !payload.facultyId) {
      localStorage.removeItem('token');
      navigate('/login');
      return;
    }
    setIsAuthenticated(true);
    form.setValue('facultyId', payload.facultyId, { shouldValidate: true });

    // Fetch user's author IDs from /api/settings to populate publication dropdown
    (async () => {
      try {
        const res = await fetch('/api/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return; // ignore silently, user may not have author IDs
        const json = await res.json();
        const apiData = json.data || json;
        const authorId = apiData?.authorId || {};
        setUserAuthorIds({
          scopus: authorId.scopus || "",
          sci: authorId.sci || "",
          webOfScience: authorId.webOfScience || ""
        });
      } catch (e) {
        // ignore - not critical
        console.warn("Failed to fetch user author IDs", e);
      }
    })();
  }, [form, navigate]);

  const publicationType = form.watch("publication");
  const publicationLabel = useMemo(
    () => (publicationType ? { scopus: "Scopus ID", sci: "SCI ID", webOfScience: "Web of Science ID" }[publicationType] : "Publication ID"),
    [publicationType]
  );

  // When publication type changes, populate publicationId from user's author ids
  useEffect(() => {
    if (publicationType && userAuthorIds[publicationType]) {
      form.setValue('publicationId', userAuthorIds[publicationType], { shouldValidate: true });
    } else {
      form.setValue('publicationId', "", { shouldValidate: true });
    }
  }, [publicationType, userAuthorIds, form]);

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "authors" });
  const { fields: subjectFields, append: appendSubject, remove: removeSubject } = useFieldArray({ control: form.control, name: "subjectAreas" });
  const { fields: studentFields, append: appendStudent, remove: removeStudent } = useFieldArray({ control: form.control, name: "studentScholars" });

  const watchAuthors = form.watch("authors");
  const watchIsStudentScholar = form.watch("isStudentScholar");
  const watchSubjectAreas = form.watch("subjectAreas");
  const correspondingAuthor = watchAuthors?.find(a => a.isCorresponding);

  useEffect(() => {
    const sub = form.watch((values, { name }) => {
      if (name === "claimedBy") {
        if (values.claimedBy && watchAuthors?.length > 0) {
          const foundIndex = watchAuthors.findIndex(a => a.name === values.claimedBy);
          if (foundIndex !== -1) {
            form.setValue("authorNo", (foundIndex + 1).toString(), { shouldValidate: true });
          }
        }
      }
    });
    return () => sub.unsubscribe();
  }, [form, watchAuthors]);

  const debouncedDoiCheck = useCallback(
    debounce(async (doiRaw) => {
      const doi = doiRaw?.trim?.();
      if (!doi) {
        setDoiStatus({ isDuplicate: null, validOnCrossref: false, message: "" });
        return;
      }
      setIsCheckingDoi(true);
      try {
        const token = localStorage.getItem('token');

        // Step 1: Check duplicate in DB
        let dataDb = null;
        try {
          const resDb = await fetch(`http://localhost:5000/api/papers/doi/${encodeURIComponent(doi)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resDb.ok) {
            dataDb = await resDb.json();
          } else {
            // if server returned non-ok, ignore duplicate check but continue to Crossref
            dataDb = { exists: false };
          }
        } catch {
          dataDb = { exists: false };
        }

        if (dataDb && dataDb.exists) {
          setDoiStatus({
            isDuplicate: true,
            validOnCrossref: false,
            message: "Duplicate DOI found."
          });
          setIsCheckingDoi(false);
          return;
        }

        // Step 2: Crossref lookup (normalize DOI lower-case)
        // Crossref expects the DOI escaped; using encodeURIComponent and lowercase
        const normalizedDoi = doi.toLowerCase();
        const resCrossref = await fetch(`https://api.crossref.org/works/${encodeURIComponent(normalizedDoi)}`);
        if (resCrossref.ok) {
          setDoiStatus({
            isDuplicate: false,
            validOnCrossref: true,
            message: ""
          });
        } else {
          setDoiStatus({
            isDuplicate: false,
            validOnCrossref: false,
            message: "You have entered an invalid DOI."
          });
        }
      } catch (err) {
        setDoiStatus({
          isDuplicate: null,
          validOnCrossref: false,
          message: "Error checking DOI."
        });
      } finally {
        setIsCheckingDoi(false);
      }
    }, 350),
    []
  );

  async function onSubmit(values) {
    if (doiStatus.isDuplicate) {
      toast.error("This DOI is already registered.");
      return;
    }
    if (!doiStatus.validOnCrossref) {
      toast.error("Please enter a valid DOI before submitting.");
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    const payload = {
      ...values,
      year: values.year?.toString?.() ?? values.year,
      authorNo: values.authorNo?.toString?.() ?? values.authorNo,
      subjectArea: values.subjectAreas[0]?.area || "",
      subjectCategories: values.subjectAreas[0]?.categories || []
    };

    setIsPending(true);
    try {
      const data = await toast.promise(
        (async () => {
          const res = await fetch('http://localhost:5000/api/papers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

          console.log("Upload paper response status:", res.status);

          let resJson = null;
          try {
            resJson = await res.json();
            console.log("Upload paper response json:", resJson);
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
          loading: 'Saving paper...',
          success: 'Paper uploaded successfully.',
          error: (err) => err.message || 'Submission failed',
        }
      );

      // success -> show SweetAlert and reset after user clicks OK
      await Swal.fire({
        icon: 'success',
        title: 'Successfully Submitted!',
        text: 'Your paper has been uploaded.',
        confirmButtonColor: '#2563eb',
      });

      form.reset({
        authors: [{ name: "", isCorresponding: false }],
        title: "",
        journalName: "",
        publisherName: "",
        volume: "",
        issue: "",
        pageNo: "",
        doi: "",
        facultyId: form.getValues('facultyId'),
        publicationId: "",
        year: "",
        qRating: "",
        issueType: "",
        studentScholars: [],
        publication: undefined,
        claimedBy: "",
        authorNo: "",
        isStudentScholar: "no",
        subjectAreas: [{ area: "", categories: [] }]
      });
      setDoiStatus({ isDuplicate: null, validOnCrossref: false, message: "" });

    } catch (err) {
      console.error("Submission error:", err);
      // toast.promise already shows the error; nothing else needed
    } finally {
      setIsPending(false);
    }
  }

  if (!isAuthenticated) return null;

  // build publication options from userAuthorIds: only include non-empty ones
  const publicationOptions = [
    { key: "scopus", label: "Scopus" },
    { key: "sci", label: "SCI" },
    { key: "webOfScience", label: "Web of Science" }
  ].filter(opt => !!userAuthorIds[opt.key]);

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
                Submit a New Paper
              </h1>
              <p className="text-black/70">Fill in the details of the research publication.</p>
            </div>
          </div>

          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-black">Publication Details</CardTitle>
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
                  <FormField
                    control={form.control}
                    name="facultyId"
                    render={({ field }) => (
                      <input type="hidden" {...field} readOnly />
                    )}
                  />

                  {/* Authors section - unchanged */}
                  <div className="space-y-4">
                    <SectionHeader
                      step={1}
                      icon={Users}
                      title="Authors"
                      subtitle="Add authors and mark the corresponding author"
                    />
                    {fields.map((field, index) => (
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
                        <FormField
                          control={form.control}
                          name={`authors.${index}.isCorresponding`}
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormControl>
                                <Checkbox
                                  checked={!!field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="!mt-0 text-sm text-black flex items-center gap-1">
                                <Users className="h-4 w-4 text-blue-700" />
                                Corresponding (C)
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => remove(index)}
                            className="border-blue-600 text-blue-700 hover:bg-blue-50"
                            aria-label="Remove author"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {fields.length < 15 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-blue-600 text-blue-700 hover:bg-blue-50"
                        onClick={() => append({ name: "", isCorresponding: false })}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Author
                      </Button>
                    )}
                  </div>

                  {/* Publication info */}
                  <div className="space-y-4">
                    <SectionHeader
                      step={2}
                      icon={FileText}
                      title="Publication Information"
                      subtitle="Basic details about the publication"
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
                        name="journalName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-700" />
                              Journal Name
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Proceedings of Science" {...field} />
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="publisherName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black flex items-center gap-2">
                              <Building className="h-4 w-4 text-blue-700" />
                              Publisher Name
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Name of the publisher" {...field} />
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="volume"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Volume</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 123" {...field} />
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="issue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Issue</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 4" {...field} />
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pageNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Page No.</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 10-15" {...field} />
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
                            <FormControl>
                              <Input placeholder="e.g., 2025" {...field} type="number" />
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      {/* DOI field (same logic) */}
                      <FormField
                        control={form.control}
                        name="doi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black flex items-center gap-2">
                              <Hash className="h-4 w-4 text-blue-700" />
                              DOI
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="e.g., 10.1000/xyz123"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    debouncedDoiCheck(e.target.value);
                                  }}
                                />
                                {isCheckingDoi && (
                                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-700" />
                                )}
                                {doiStatus.validOnCrossref && !doiStatus.isDuplicate && (
                                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                                )}
                              </div>
                            </FormControl>

                            {/* Show error message if invalid */}
                            {doiStatus.message && !doiStatus.validOnCrossref && !isCheckingDoi && (
                              <div className="flex items-center text-sm mt-2 text-red-800 bg-red-100 border border-red-200 rounded p-2">
                                <AlertTriangle className="h-4 w-4 mr-2 text-red-700" />
                                {doiStatus.message}
                              </div>
                            )}

                            {/* Show Ensure DOI button only if valid */}
                            {doiStatus.validOnCrossref && !doiStatus.isDuplicate && (
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

                      {/* Publication dropdown - only show types the user has in their settings */}
                      <FormField
  control={form.control}
  name="publication"
  render={({ field }) => (
    <FormItem>
      <div className="flex items-center gap-2">
        <FormLabel className="text-black">Publication</FormLabel>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-500 hover:text-gray-700 cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs text-sm">
              This is your added Author ID.  
              If you want to use another ID, please add it in the Settings page.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <FormControl>
        <Select
          onValueChange={(value) => {
            field.onChange(value);
            if (value && userAuthorIds[value]) {
              form.setValue("publicationId", userAuthorIds[value], { shouldValidate: true });
            } else {
              form.setValue("publicationId", "", { shouldValidate: true });
            }
          }}
          value={field.value ?? ""}
          disabled={publicationOptions.length === 0}
        >
          <FormControl>
            <SelectTrigger className="text-black">
              <SelectValue
                placeholder={
                  publicationOptions.length
                    ? "Select publication identifier"
                    : "No identifiers available in profile"
                }
              />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {publicationOptions.map((opt) => (
              <SelectItem key={opt.key} value={opt.key}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormControl>
      <FormMessage className="text-blue-700" />
    </FormItem>
  )}
/>

                      {/* PublicationId field - readOnly, populated from userAuthorIds */}
                      <FormField
                        control={form.control}
                        name="publicationId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">{publicationLabel}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Select publication type to auto-fill" readOnly className="bg-blue-50" />
                            </FormControl>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      {/* ClaimedBy select */}
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
                                {watchAuthors?.map((author, index) => (
                                  author.name && <SelectItem key={index} value={author.name}>{author.name}</SelectItem>
                                ))}
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
                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                              <FormControl>
                                <SelectTrigger className="text-black">
                                  <SelectValue placeholder="Select author number" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {watchAuthors?.map((author, index) => (
                                  author.name && <SelectItem key={index} value={(index + 1).toString()}>{index + 1}</SelectItem>
                                ))}
                                {correspondingAuthor && correspondingAuthor.name && (
                                  <SelectItem value="C">C (Corresponding)</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* ... rest of the form unchanged (subject areas, students, qRating, issueType, alert, submit) ... */}

                  <div className="space-y-4">
                    <SectionHeader
                      step={3}
                      icon={FileText}
                      title="Subject Areas & Categories"
                      subtitle="Choose the relevant subject areas and categories"
                    />
                    {subjectFields.map((field, index) => (
                      <div key={field.id} className="flex flex-col md:flex-row items-stretch md:items-center gap-4 p-3 border border-blue-200 rounded-md bg-white">
                        <span className="text-sm font-medium text-blue-700">{index + 1}.</span>
                        <FormField
                          control={form.control}
                          name={`subjectAreas.${index}.area`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-black">Subject Area</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  form.setValue(`subjectAreas.${index}.categories`, []);
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
                          name={`subjectAreas.${index}.categories`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-black">Subject Categories</FormLabel>
                              <FormControl>
                                <SubjectCategoriesSelect
                                  value={field.value}
                                  onChange={field.onChange}
                                  subjectArea={watchSubjectAreas?.[index]?.area}
                                  error={form.formState.errors.subjectAreas?.[index]?.categories}
                                />
                              </FormControl>
                              <FormMessage className="text-blue-700" />
                            </FormItem>
                          )}
                        />
                        {subjectFields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeSubject(index)}
                            className="border-blue-600 text-blue-700 hover:bg-blue-50"
                            aria-label="Remove subject area"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-blue-600 text-blue-700 hover:bg-blue-50"
                      onClick={() => appendSubject({ area: "", categories: [] })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subject Area
                    </Button>
                  </div>

                  {/* Student scholars and other fields (unchanged) */}
                  <div className="space-y-4">
                    <SectionHeader
                      step={4}
                      icon={Users}
                      title="Student Scholars & Classification"
                      subtitle="Indicate student involvement and classification info"
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

                      <FormField
                        control={form.control}
                        name="qRating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Q Rating</FormLabel>
                            <Select onValueChange={(v) => field.onChange(v)} value={field.value ?? ""}>
                              <FormControl>
                                <SelectTrigger className="text-black">
                                  <SelectValue placeholder="Select Q rating" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Q1">Q1</SelectItem>
                                <SelectItem value="Q2">Q2</SelectItem>
                                <SelectItem value="Q3">Q3</SelectItem>
                                <SelectItem value="Q4">Q4</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="issueType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black">Type of Issue</FormLabel>
                            <Select onValueChange={(v) => field.onChange(v)} value={field.value ?? ""}>
                              <FormControl>
                                <SelectTrigger className="text-black">
                                  <SelectValue placeholder="Type of Issue" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Regular Issue">Regular Issue</SelectItem>
                                <SelectItem value="Special Issue">Special Issue</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-blue-700" />
                          </FormItem>
                        )}
                      />
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
                      disabled={isPending || doiStatus.isDuplicate || !doiStatus.validOnCrossref}
                      className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white"
                    >
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Paper
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.reset()}
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
}
