import { UserCog, UserPlus, Info, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/Toast';
import BulkUploadInstructions from './BulkUpload/BulkUploadInstructions';

export default function UserHeader({
  currentUser = {},
  getAvailableRoles = () => [],
  setOpenDialog,
  setOpenBulkDialog,
  setShowLogDialog,
  collegeOptions = [],
}) {
  const { toast } = useToast();
  const safeUser = currentUser || {};
  const college = safeUser.college || '';
  const role = safeUser.role || '';
  const institute = safeUser.institute || '';
  const department = safeUser.department || '';

  // Helper to determine SRM colleges
  const srmColleges = ['SRMIST RAMAPURAM', 'SRM RAMAPURAM', 'SRMIST TRICHY', 'SRM TRICHY'];
  const isSRMCollege = srmColleges.some(c => c.toLowerCase() === college.toLowerCase());

  // Determine which fields to show based on user role and college
  const shouldShowInstitute = isSRMCollege && (role === 'campus_admin');
  const shouldShowDepartment = role !== 'super_admin' && college && college !== 'N/A';

  // Get instructions for bulk upload based on user role
  const getBulkUploadInstructions = () => {
    const baseColumns = [
      { name: "fullName", required: true, notes: "User's full name (manual entry)" },
      { 
        name: "facultyId", 
        required: true,
        notes: "Required for all roles (manual entry)"
      },
      { name: "email", required: true, notes: "Must match college domain (manual entry)" },
      { name: "password", required: false, notes: "Auto-generated and emailed to users (not in Excel)" }
    ];

    const baseNotes = [
      "First row must contain column headers",
      "Column names are case-sensitive", 
      "Passwords will be auto-generated and emailed to users",
      "College, Institute, and Department fields have dropdown validation to prevent errors",
      "No sample data provided - start entering from row 2"
    ];

    if (role === 'super_admin') {
      return {
        title: "Super Admin Bulk Upload",
        description: "Upload users for any college with any role",
        campusAdminColumns: [
          ...baseColumns,
          { name: "college", required: true, notes: "Select from dropdown list" },
          { name: "institute", required: true, notes: "Select from dropdown list" }
        ],
        facultyColumns: [
          ...baseColumns,
          { name: "college", required: true, notes: "Select from dropdown list" },
          { name: "institute", required: true, notes: "Select from dropdown list" },
          { name: "department", required: true, notes: "Select from dropdown list" }
        ],
        notes: [
          ...baseNotes,
          "Campus Admin Template: college and institute are required",
          "Faculty Template: college, institute, and department are all required",
          "All dropdowns are pre-populated with valid values"
        ]
      };
    }

    if (role === 'campus_admin') {
      return {
        title: `Campus Admin Bulk Upload - ${college}`,
        description: `Upload users for ${college}`,
        columns: [
          ...baseColumns,
          { name: "department", required: true, notes: "Select from dropdown list" }
        ],
        notes: [
          ...baseNotes,
          `College will be set to ${college}`,
          `Institute will be set to ${institute}`,
          "Department dropdown contains valid options for your college"
        ]
      };
    }

    return {
      title: `Faculty Bulk Upload - ${college}`,
      description: `Upload faculty users for ${college}`,
      columns: [
        ...baseColumns,
        { name: "department", required: true, notes: "Select from dropdown list" }
      ],
      notes: [
        ...baseNotes,
        `College will be set to ${college}`,
        `Institute will be set to ${institute}`,
        "All users will be created as faculty"
      ]
    };
  };

  const instructions = getBulkUploadInstructions();

  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <UserCog className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-gray-600">
            {role.replace('_', ' ')}
          </Badge>
          {college && college !== 'N/A' && (
            <Badge variant="outline" className="text-gray-600">
              {college}
            </Badge>
          )}
          {shouldShowInstitute && institute && institute !== 'N/A' && (
            <Badge variant="outline" className="text-gray-600">
              {institute}
            </Badge>
          )}
          {shouldShowDepartment && department && department !== 'N/A' && (
            <Badge variant="outline" className="text-gray-600">
              {department}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {getAvailableRoles().length > 0 && (
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setOpenDialog(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add User 
          </Button>
        )}

        {(role === 'super_admin' || role === 'campus_admin') && (
          <>
            <Button
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={() => setOpenBulkDialog(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
            <BulkUploadInstructions
              currentUser={currentUser}
              instructions={instructions}
              trigger={
                <Button 
                  variant="outline" 
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Info className="mr-2 h-4 w-4" />
                  Instructions
                </Button>
              }
            />
          </>
        )}

        {role === 'super_admin' && (
          <Button
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
            onClick={() => setShowLogDialog(true)}
          >
            <FileText className="mr-2 h-4 w-4" />
            Logs
          </Button>
        )}
      </div>
    </div>
  );
}