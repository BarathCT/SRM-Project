import { UserCog, UserPlus, Info, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/Toast';
import * as XLSX from 'xlsx';

export default function UserHeader({
  currentUser = {},
  getAvailableRoles = () => [],
  setOpenDialog,
  setOpenBulkDialog,
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
  const shouldShowInstitute = isSRMCollege && (role === 'campus_admin' || role === 'admin');
  const shouldShowDepartment = role !== 'super_admin' && college && college !== 'N/A';

  // Get instructions for bulk upload based on user role
  const getBulkUploadInstructions = () => {
    // Remove password field from all roles
    const baseColumns = [
      { name: "fullName", required: true, notes: "User's full name" },
      { 
        name: "facultyId", 
        required: true, // Always required
        notes: "Required for all roles"
      },
      { name: "email", required: true, notes: "Must match college domain if specified" }
      // password field removed
    ];

    const baseNotes = [
      "First row must contain column headers",
      "Column names are case-sensitive",
      "Passwords will be auto-generated and emailed to users"
    ];

    if (role === 'super_admin') {
      // For super_admin, exclude college, institute, department, and role from template download
      return {
        title: "Super Admin Bulk Upload",
        description: "Upload users for any college with any role",
        columns: [
          ...baseColumns,
        ],
        notes: [
          ...baseNotes,
          "For SRM colleges: Must include valid institute",
          "For other colleges: Institute will be set to 'N/A'",
          "Password column is not needed; it will be auto-generated for all users.",
        ]
      };
    }

    if (role === 'campus_admin') {
      return {
        title: `Campus Admin Bulk Upload - ${college}`,
        description: `Upload users for ${college}`,
        columns: [
          ...baseColumns,
          { name: "role", required: false, notes: "Defaults to selected role" },
          ...(shouldShowInstitute ? [
            { name: "institute", required: false, notes: `Defaults to ${institute}` }
          ] : []),
          { name: "department", required: true, notes: "Must be valid for this college" }
        ],
        notes: [
          ...baseNotes,
          `College will be set to ${college}`,
          ...(shouldShowInstitute ? [`Institute defaults to ${institute}`] : []),
          "Role defaults to selected value",
          "Password column is not needed; it will be auto-generated for all users."
        ]
      };
    }

    // For admin role
    return {
      title: `Admin Bulk Upload - ${college}`,
      description: `Upload faculty for ${college}`,
      columns: [
        ...baseColumns,
        ...(shouldShowInstitute ? [
          { name: "institute", required: false, notes: `Defaults to ${institute}` }
        ] : []),
        { name: "department", required: true, notes: "Must be valid for this college" }
      ],
      notes: [
        ...baseNotes,
        `College will be set to ${college}`,
        ...(shouldShowInstitute ? [`Institute defaults to ${institute}`] : []),
        "All users will be created as faculty",
        "Password column is not needed; it will be auto-generated for all users."
      ]
    };
  };

  const instructions = getBulkUploadInstructions();

  // Helper for example values for each column
  function getExampleValue(col) {
    switch (col.name) {
      case 'fullName':
        return 'Jane Doe';
      case 'facultyId':
        return 'FAC1234';
      case 'email':
        return `user@${(college || "college").toLowerCase().replace(/\s+/g, '')}.edu`;
      case 'role':
        return 'faculty';
      case 'college':
        return college || 'SRM University';
      case 'institute':
        return institute || 'Engineering';
      case 'department':
        return department || 'CSE';
      default:
        return 'example';
    }
  }

  // XLSX Download Template
  const downloadTemplate = () => {
    // For super_admin, only include base columns (no college/institute/department/role)
    let cols = instructions.columns.map(c => c.name);
    const worksheet = XLSX.utils.json_to_sheet([], { header: cols });
    XLSX.utils.sheet_add_aoa(worksheet, [cols], { origin: "A1" });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "user-upload-template.xlsx");
    toast.info('Template download started');
  };

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
          <Badge variant="outline" className="text-gray-600">
            {college || 'All colleges'}
          </Badge>
          {shouldShowInstitute && (
            <Badge variant="outline" className="text-gray-600">
              {institute}
            </Badge>
          )}
          {shouldShowDepartment && (
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

        {(role === 'super_admin' || role === 'campus_admin' || role === 'admin') && (
          <>
            <Button
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={() => setOpenBulkDialog(true)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  onClick={downloadTemplate}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="border-b pb-4">
                  <DialogTitle className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-blue-600" />
                    <div>
                      <p>{instructions.title}</p>
                      <p className="text-sm font-normal text-gray-600 mt-1">
                        {instructions.description}
                      </p>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 px-1">
                  <div className="space-y-6 p-4">
                    {/* Requirements Table */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-800">Excel File Requirements</h3>
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead className="w-[180px]">Column</TableHead>
                              {/* Remove the "Required" column for super_admin */}
                              {role !== 'super_admin' && (
                                <TableHead className="w-[100px]">Required</TableHead>
                              )}
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {instructions.columns.map((col) => (
                              <TableRow key={col.name}>
                                <TableCell className="font-medium">
                                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                    {col.name}
                                  </code>
                                </TableCell>
                                {/* Only show Required badge for non-super_admin */}
                                {role !== 'super_admin' && (
                                  <TableCell>
                                    <Badge 
                                      variant={col.required ? "destructive" : "outline"}
                                      className="px-2 py-0.5 text-xs"
                                    >
                                      {col.required ? "Required" : "Optional"}
                                    </Badge>
                                  </TableCell>
                                )}
                                <TableCell className="text-sm text-gray-600">
                                  {col.notes}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-800">Important Notes</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <ul className="space-y-2 list-disc pl-5 text-sm text-gray-700">
                          {instructions.notes.map((note, i) => (
                            <li key={i}>{note}</li>
                          ))}
                          <li>
                            Email domains must match the college:
                            <div className="flex flex-wrap gap-2 mt-2">
                              {collegeOptions.map(college => (
                                <Badge 
                                  key={college.name} 
                                  variant="outline" 
                                  className="text-xs font-mono"
                                >
                                  @{college.name.toLowerCase().replace(/\s+/g, '')}.edu
                                </Badge>
                              ))}
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Example Section */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-800">Example Data</h3>
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              {instructions.columns.map(col => (
                                <TableHead key={col.name} className="text-xs">
                                  {col.name}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              {instructions.columns.map(col => (
                                <TableCell key={col.name} className="text-xs text-gray-500">
                                  {getExampleValue(col)}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableBody>
                        </Table>
                        <div className="text-xs text-gray-600 italic p-2">
                          Password column not required. Passwords will be auto-generated and sent via email.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 flex justify-end">
                  <Button 
                    variant="outline" 
                    className="mr-2" 
                    onClick={downloadTemplate}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                  <Button 
                    onClick={() => {
                      setOpenBulkDialog(true);
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Start Bulk Upload
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}