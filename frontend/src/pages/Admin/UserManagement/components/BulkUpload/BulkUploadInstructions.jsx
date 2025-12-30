import { Info, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function BulkUploadInstructions({
  currentUser = {},
  instructions = {},
  downloadTemplate,
  trigger
}) {
  const safeUser = currentUser || {};
  const { role } = safeUser;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
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
            {/* Enhanced Template Features */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">📋 Clean Template Features</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Real Dropdown Validation:</strong> Excel dropdown menus for College, Institute, Department</li>
                <li>• <strong>Clean Start:</strong> No sample data - enter your own data from row 2</li>
                <li>• <strong>Error Prevention:</strong> No spelling mistakes or invalid selections</li>
                <li>• <strong>Role-Based Templates:</strong> Different templates for campus admin vs faculty creation</li>
                <li>• <strong>Auto-Generated Passwords:</strong> No password column in Excel</li>
                <li>• <strong>Dynamic Generation:</strong> Templates created on-demand with latest data</li>
              </ul>
            </div>

            {/* Template Structure */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-800">Template Structure & Requirements</h3>
              
              {/* Super Admin Templates */}
              {role === 'super_admin' && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-blue-700 mb-3">Campus Admin Template Structure</h4>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-blue-50">
                          <TableRow>
                            <TableHead className="w-[150px]">Column Name</TableHead>
                            <TableHead className="w-[100px]">Input Type</TableHead>
                            <TableHead className="w-[80px]">Required</TableHead>
                            <TableHead>Description & Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {instructions.campusAdminColumns?.map((col) => (
                            <TemplateColumnRow key={col.name} col={col} />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-green-700 mb-3">Faculty Template Structure</h4>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-green-50">
                          <TableRow>
                            <TableHead className="w-[150px]">Column Name</TableHead>
                            <TableHead className="w-[100px]">Input Type</TableHead>
                            <TableHead className="w-[80px]">Required</TableHead>
                            <TableHead>Description & Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {instructions.facultyColumns?.map((col) => (
                            <TemplateColumnRow key={col.name} col={col} />
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}

              {/* Campus Admin Single Template */}
              {role === 'campus_admin' && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-blue-700 mb-3">Faculty Template Structure</h4>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-blue-50">
                        <TableRow>
                          <TableHead className="w-[150px]">Column Name</TableHead>
                          <TableHead className="w-[100px]">Input Type</TableHead>
                          <TableHead className="w-[80px]">Required</TableHead>
                          <TableHead>Description & Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {instructions.columns?.map((col) => (
                          <TemplateColumnRow key={col.name} col={col} />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            {/* Row-Order Input Type Legend */}
            <RowOrderColumnTypeLegend />

            {/* Usage Instructions */}
            <UsageInstructions role={role} />

            {/* Important Notes */}
            <ImportantNotes instructions={instructions} />

            {/* Email Domain Requirements */}
            <EmailDomainRequirements />

            {/* Template Preview */}
            <TemplatePreview />
          </div>
        </div>

        <div className="border-t pt-4 flex justify-end">
          {role === 'super_admin' ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => downloadTemplate('campus_admin')}
              >
                <Download className="mr-2 h-4 w-4" />
                Campus Admin Template
              </Button>
              <Button 
                onClick={() => downloadTemplate('faculty')}
              >
                <Download className="mr-2 h-4 w-4" />
                Faculty Template
              </Button>
            </div>
          ) : (
            <Button 
              onClick={() => downloadTemplate()}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper component for table rows
function TemplateColumnRow({ col }) {
  const isDropdown = ['college', 'institute', 'department'].includes(col.name);
  const isManual = ['fullName', 'facultyId', 'email'].includes(col.name);
  const isPassword = col.name === 'password';

  return (
    <TableRow className={isPassword ? 'bg-yellow-50' : ''}>
      <TableCell className="font-medium">
        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
          {col.name}
        </code>
      </TableCell>
      <TableCell>
        <Badge 
          variant={
            isPassword ? "outline" :
            isDropdown ? "default" : 
            isManual ? "secondary" : "outline"
          }
          className="px-2 py-0.5 text-xs"
        >
          {isPassword ? "Auto" : isDropdown ? "Dropdown" : isManual ? "Manual" : "Auto"}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge 
          variant={col.required ? "destructive" : "outline"}
          className="px-2 py-0.5 text-xs"
        >
          {col.required ? "Yes" : "No"}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-gray-600">
        {col.notes}
      </TableCell>
    </TableRow>
  );
}

// Row-Order Input Type Legend component
function RowOrderColumnTypeLegend() {
  const inputTypes = [
    {
      type: "Dropdown",
      variant: "default",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      description: "Pre-populated dropdown lists to prevent errors",
      examples: ["College", "Institute", "Department"]
    },
    {
      type: "Manual",
      variant: "secondary", 
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      textColor: "text-gray-700",
      description: "Type your own values directly",
      examples: ["Full Name", "Faculty ID", "Email"]
    },
    {
      type: "Auto",
      variant: "outline",
      bgColor: "bg-green-50",
      borderColor: "border-green-200", 
      textColor: "text-green-700",
      description: "Automatically set based on your permissions",
      examples: ["College (for campus admin)", "Institute (for campus admin)"]
    },
    {
      type: "Password",
      variant: "outline",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-700",
      description: "Auto-generated and emailed to users (not included in Excel)",
      examples: ["Random secure passwords"]
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-800">Input Type Legend</h3>
      
      {/* Row-by-row layout */}
      <div className="space-y-3">
        {inputTypes.map((inputType, index) => (
          <div 
            key={inputType.type}
            className={`${inputType.bgColor} ${inputType.borderColor} border rounded-lg p-4 transition-all duration-200 hover:shadow-md`}
          >
            <div className="flex items-start gap-4">
              {/* Icon and Badge Section */}
              <div className="flex items-center gap-3 min-w-[140px]">
                <Badge 
                  variant={inputType.variant} 
                  className="px-3 py-1 text-sm font-medium"
                >
                  {inputType.type}
                </Badge>
              </div>
              
              {/* Description Section */}
              <div className="flex-1">
                <p className={`text-sm ${inputType.textColor} mb-2 leading-relaxed font-medium`}>
                  {inputType.description}
                </p>
                
                {/* Examples */}
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs font-semibold ${inputType.textColor} uppercase tracking-wide mr-2`}>
                    Examples:
                  </span>
                  {inputType.examples.map((example, idx) => (
                    <span 
                      key={idx}
                      className={`inline-block px-2 py-1 text-xs rounded-md bg-white/70 ${inputType.textColor} border ${inputType.borderColor} font-medium`}
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Additional help section */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mt-4">
        <div className="flex items-start gap-3">
          <div className="text-indigo-500 text-lg" role="img" aria-label="info">💡</div>
          <div>
            <h4 className="font-medium text-indigo-800 mb-2">Quick Usage Tips:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <ul className="text-sm text-indigo-700 space-y-1">
                  <li>• <strong>Dropdown:</strong> Click cell → see arrow → select from list</li>
                  <li>• <strong>Manual:</strong> Type directly, ensure correct format</li>
                </ul>
              </div>
              <div>
                <ul className="text-sm text-indigo-700 space-y-1">
                  <li>• <strong>Auto:</strong> System fills based on your permissions</li>
                  <li>• <strong>Password:</strong> Never in Excel - auto-generated on upload</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for usage instructions
function UsageInstructions({ role }) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-800">How to Use the Clean Templates</h3>
      <div className="bg-gray-50 rounded-lg p-4">
        <ol className="space-y-2 list-decimal pl-5 text-sm text-gray-700">
          <li>Download the appropriate template for your needs:
            {role === 'super_admin' ? (
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li><strong>Campus Admin Template:</strong> For creating campus administrators</li>
                <li><strong>Faculty Template:</strong> For creating faculty members</li>
              </ul>
            ) : (
              <span className="ml-2">Faculty template for your college</span>
            )}
          </li>
          <li>Open the Excel file in <strong>Microsoft Excel</strong> (required for dropdown functionality)</li>
          <li><strong>Start entering data from Row 2</strong> (Row 1 contains headers)</li>
          <li>For dropdown fields (College, Institute, Department):
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Click on the cell to see a dropdown arrow</li>
              <li>Select from the pre-populated list</li>
              <li>Do not type manually to avoid errors</li>
            </ul>
          </li>
          <li>For manual fields (fullName, facultyId, email):
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Type the information directly</li>
              <li>Ensure email domains match college requirements</li>
              <li>Faculty IDs should be unique</li>
            </ul>
          </li>
          <li><strong>Do not add a password column</strong> - passwords are auto-generated</li>
          <li>Save the file and upload via the <strong>Bulk Upload</strong> button</li>
        </ol>
      </div>
    </div>
  );
}

// Helper component for important notes
function ImportantNotes({ instructions }) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-800">Important Notes</h3>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <ul className="space-y-1 list-disc pl-5 text-sm text-gray-700">
          {instructions.notes?.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
          <li><strong>Excel Required:</strong> Dropdown functionality only works in Microsoft Excel or compatible software</li>
          <li><strong>No Password Column:</strong> Passwords are automatically generated and emailed to users</li>
          <li><strong>Email Domains:</strong> Must match the selected college's domain requirements</li>
          <li><strong>Real-time Validation:</strong> Excel will prevent invalid entries with error messages</li>
          <li><strong>Clean Templates:</strong> No pre-filled data - enter your users starting from row 2</li>
        </ul>
      </div>
    </div>
  );
}

// Helper component for email domain requirements
function EmailDomainRequirements() {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-800">Email Domain Requirements</h3>
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-indigo-800 mb-2">Regular Colleges</h4>
            <ul className="text-sm text-indigo-700 space-y-1">
              <li><strong>SRMIST RAMAPURAM:</strong> @srmist.edu.in</li>
              <li><strong>SRM TRICHY:</strong> @srmtrichy.edu.in</li>
              <li><strong>EASWARI ENGINEERING:</strong> @eec.srmrmp.edu.in</li>
              <li><strong>TRP ENGINEERING:</strong> @trp.srmtrichy.edu.in</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-indigo-800 mb-2">SRM RESEARCH Institute</h4>
            <p className="text-sm text-indigo-700 mb-2">Can use any of these domains:</p>
            <ul className="text-sm text-indigo-700 space-y-1">
              <li>@srmist.edu.in</li>
              <li>@srmtrichy.edu.in</li>
              <li>@eec.srmrmp.edu.in</li>
              <li>@trp.srmtrichy.edu.in</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for template preview
function TemplatePreview() {
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-800">Excel Template Preview</h3>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-700 mb-2">
          <strong>✅ Clean template structure:</strong>
        </p>
        <ul className="text-xs text-green-600 space-y-1">
          <li>• <strong>Row 1:</strong> Column headers with professional styling</li>
          <li>• <strong>Row 2+:</strong> Empty rows ready for your data entry</li>
          <li>• <strong>Dropdowns:</strong> Available from row 2 onwards for 1000+ rows</li>
          <li>• <strong>Validation:</strong> Real-time error prevention for invalid entries</li>
          <li>• <strong>No Clutter:</strong> Clean workspace without sample data</li>
        </ul>
      </div>
    </div>
  );
}