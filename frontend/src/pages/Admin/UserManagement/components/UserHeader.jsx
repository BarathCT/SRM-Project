import { UserCog, UserPlus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function UserHeader({
  currentUser = {},
  getAvailableRoles = () => [],
  setOpenDialog,
  setOpenBulkDialog,
}) {
  const safeUser = currentUser || {};
  const college = safeUser.college || '';
  const role = safeUser.role || '';
  const category = safeUser.category || '';

  // Helper to determine if the user is from SRM college
  const srmColleges = ['SRMIST RAMAPURAM', 'SRM RAMAPURAM', 'RAMAPURAM', 'SRMIST TRICHY', 'SRM TRICHY', 'TRICHY'];
  const isSRMCollege = srmColleges.some(c => c.toLowerCase() === college.toLowerCase());

  // Helper: show category details only for SRM colleges, only for campus_admin and admin
  const shouldShowCategory = isSRMCollege && (role === 'campus_admin' || role === 'admin');

  // Helper to build instructions per role
  const getBulkUploadInstructions = () => {
    const baseColumns = [
      { name: "name", required: true, notes: "User's full name" },
      { name: "facultyId", required: true, notes: "Unique faculty ID" },
      { name: "email", required: true, notes: "User's email address" },
      { name: "password", required: false, notes: "Will be auto-generated if not provided" }
    ];

    const baseNotes = [
      "Passwords will be auto-generated if not provided"
    ];

    if (role === 'super_admin') {
      return {
        title: "Super Admin Bulk Upload Instructions",
        description: "You can upload users for any college with any role.",
        columns: [
          ...baseColumns,
          { name: "college", required: true, notes: "Must match one of the valid colleges" },
          { 
            name: "category", 
            required: true, 
            notes: "Required for SRM colleges (Science and Humanities, Engineering and Technology, Management, Dental); not required for other colleges"
          },
          { name: "role", required: true, notes: "Selected role will be applied to all users" }
        ],
        notes: [
          "For SRM colleges (RAMAPURAM, TRICHY): Must include category in Excel.",
          "For other colleges (EASWARI, TRP): No category needed in Excel.",
          "Selected role before upload will be applied to all users.",
          ...baseNotes
        ]
      };
    }

    // For campus_admin and admin, category auto-set for SRM colleges only
    const notes = [
      `College will be automatically set to ${college}`,
      ...(shouldShowCategory ? [`Category will be automatically set to ${category}`] : []),
      ...(role === 'campus_admin' ? ["Selected role before upload will be applied to all users"] : []),
      ...(role === 'admin' ? ["All users will be created as faculty"] : []),
      ...baseNotes
    ];

    if (role === 'campus_admin') {
      return {
        title: "Campus Admin Bulk Upload Instructions",
        description: `You can upload users for ${college}.`,
        columns: [
          ...baseColumns,
        ],
        notes
      };
    }

    // admin role
    return {
      title: "Admin Bulk Upload Instructions",
      description: `You can upload faculty users for ${college}.`,
      columns: baseColumns,
      notes
    };
  };

  const instructions = getBulkUploadInstructions();

  return (
    <div className="flex justify-between items-start">
      <div>
        <div className="flex items-center space-x-3 mb-1">
          <UserCog className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">User Management</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {role === 'super_admin'
            ? 'Manage all users across all campuses'
            : `Managing users for ${college}`}
        </p>
      </div>
      <div className="flex space-x-2">
        {getAvailableRoles().length > 0 && (
          <Button
            className="bg-blue-500 hover:bg-blue-600"
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
              className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-500"
              onClick={() => setOpenBulkDialog(true)}
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20">
                <path d="M4 4v12h12V4H4zm4 7h4m-2-2v4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 9V7a2 2 0 012-2h2a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Bulk Upload
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50">
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader className="border-b border-gray-200 pb-4">
                  <DialogTitle className="flex items-center gap-2 text-gray-800">
                    <Info className="h-5 w-5 text-blue-500" />
                    {instructions.title}
                    {shouldShowCategory && category && (
                      <span className="text-sm font-normal text-gray-600">
                        ({category})
                      </span>
                    )}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-1">
                  <div className="space-y-6 p-4">
                    {/* Info Box */}
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <Info className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{instructions.description}</p>
                        {role === 'admin' && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-semibold">Note:</span> All users will be created as faculty
                          </p>
                        )}
                        {shouldShowCategory && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-semibold">Category:</span> Will automatically be set to {category}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Excel Requirements Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="font-medium">Excel File Requirements</h3>
                      </div>

                      <div className="rounded-lg border overflow-hidden shadow-sm">
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead className="font-medium text-gray-700">Column</TableHead>
                              <TableHead className="font-medium text-gray-700">Required</TableHead>
                              <TableHead className="font-medium text-gray-700">Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {instructions.columns.map((col) => (
                              <TableRow key={col.name} className="border-t">
                                <TableCell className="font-medium py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm text-gray-800">
                                      {col.name}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-3">
                                  {col.required ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Required
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      Optional
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 py-3">
                                  {col.notes}
                                  {col.name === 'password' && (
                                    <span className="block mt-1 text-xs text-gray-500 italic">
                                      Will be auto-generated if empty
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Important Notes Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="font-medium">Important Notes</h3>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex gap-2">
                          <svg className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-700">
                            <span className="font-semibold">Column names must use camelCase</span> (e.g., <span className="font-mono bg-gray-200 px-1 py-0.5 rounded">facultyId</span> not "faculty id")
                          </span>
                        </div>
                        
                        {instructions.notes.map((note, index) => (
                          <div key={index} className="flex gap-2">
                            <svg className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700">{note}</span>
                          </div>
                        ))}
                        
                        {role === 'super_admin' && (
                          <div className="flex gap-2">
                            <svg className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700">
                              <span className="font-semibold">Role Selection:</span> Selected role will be applied to all users in this upload
                            </span>
                          </div>
                        )}
                        {/* This only shows for SRM college campus_admin or admin */}
                        {shouldShowCategory && (
                          <div className="flex gap-2">
                            <svg className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-700">
                              <span className="font-semibold">Default Values:</span> College = {college}, Category = {category}
                            </span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <svg className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm text-gray-700">
                            Users will receive login credentials via email
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}