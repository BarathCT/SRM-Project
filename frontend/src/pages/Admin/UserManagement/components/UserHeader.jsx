import { useState } from 'react';
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
  const [showButtons, setShowButtons] = useState(false);
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
    <div className="mb-6">
      {/* Header with Info Icon */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <UserCog className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        </div>
        
        {/* Info Icon Button - Square */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-600 rounded-md"
          onClick={() => setShowButtons(!showButtons)}
        >
          <Info className="h-5 w-5" />
        </Button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
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

      {/* Action Buttons Row - Shown when info icon is clicked */}
      {showButtons && (
        <div className="flex flex-row gap-2 mb-4">
          {getAvailableRoles().length > 0 && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
              onClick={() => {
                setOpenDialog(true);
                setShowButtons(false);
              }}
            >
              <span className="hidden md:inline">
                <UserPlus className="mr-2 h-4 w-4" />
              </span>
              Add User 
            </Button>
          )}

          {(role === 'super_admin' || role === 'campus_admin') && (
            <>
              <Button
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 flex-1 sm:flex-none"
                onClick={() => {
                  setOpenBulkDialog(true);
                  setShowButtons(false);
                }}
              >
                <span className="hidden md:inline">
                  <FileText className="mr-2 h-4 w-4" />
                </span>
                Bulk Upload
              </Button>
              
              {/* Instructions - accessible via BulkUploadInstructions but not shown as a button */}
              <BulkUploadInstructions
                currentUser={currentUser}
                instructions={instructions}
                trigger={
                  <Button 
                    variant="outline" 
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 hidden"
                    onClick={() => setShowButtons(false)}
                  >
                    Instructions
                  </Button>
                }
              />
            </>
          )}

          {role === 'super_admin' && (
            <Button
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 flex-1 sm:flex-none"
              onClick={() => {
                setShowLogDialog(true);
                setShowButtons(false);
              }}
            >
              <span className="hidden md:inline">
                <FileText className="mr-2 h-4 w-4" />
              </span>
              Logs
            </Button>
          )}
        </div>
      )}
    </div>
  );
}