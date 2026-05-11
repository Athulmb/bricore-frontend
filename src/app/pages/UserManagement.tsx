import { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import { Plus, Eye, Shield, Building2, UserCircle2, Mail, Phone, MapPin, Hash, X } from 'lucide-react';
import { 
  useUsersQuery, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser 
} from '../hooks/useUsers';
import { Loader2 } from 'lucide-react';

const roles = [
  { id: 1, name: 'Admin', users: 2, permissions: 'Full system access' },
  { id: 2, name: 'Operations Manager', users: 5, permissions: 'Operations, Processing, Dispatch' },
  { id: 3, name: 'Finance', users: 3, permissions: 'Invoices, Reports, Financials' },
  { id: 4, name: 'Yard Operator', users: 8, permissions: 'Yard Intake, Weighbridge' },
  { id: 5, name: 'Lab Technician', users: 4, permissions: 'Assaying, Testing' },
  { id: 6, name: 'Inspector', users: 3, permissions: 'Inspection, Certification' },
];

export function UserManagement() {
  // Queries
  const { data: users = [], isLoading } = useUsersQuery();
  
  // Mutations
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | string | null>(null);
  const [activeTab, setActiveTab] = useState('users');

  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    phone: '',
  });

  const handleEdit = (user: any) => {
    setUserFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone || '',
    });
    setEditingId(user.id);
    setIsEditMode(true);
    setIsUserModalOpen(true);
  };

  const handleDelete = async () => {
    if (userToDelete) {
      try {
        await deleteMutation.mutateAsync(userToDelete);
        setIsDeleteConfirmOpen(false);
        setUserToDelete(null);
      } catch (error) {
        // Mutation handles toast
      }
    }
  };

  const handleCreateUser = async () => {
    if (!userFormData.name || !userFormData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (isEditMode && editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: userFormData
        });
      } else {
        await createMutation.mutateAsync({
          ...userFormData,
          lastLogin: 'Never',
          status: 'Active'
        });
      }

      setIsUserModalOpen(false);
      resetForm();
    } catch (error) {
      // Mutation handles toast
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#974926]" />
          <p className="text-gray-500 font-medium">Loading user directory...</p>
        </div>
      </div>
    );
  }


  const resetForm = () => {
    setUserFormData({ name: '', email: '', role: '', department: '', phone: '' });
    setIsEditMode(false);
    setEditingId(null);
  };

  const activeUsers = users.filter(u => u.status === 'Active').length;

  return (
    <div>
      <PageHeader
        title="User & Access Management"
        description="Manage system users, roles, and permissions"
        action={{
          label: 'Add User',
          icon: Plus,
          onClick: () => setIsUserModalOpen(true),
        }}
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-white border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <UserCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold mt-1">{users.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Roles Defined</p>
              <p className="text-2xl font-semibold mt-1">{roles.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Plus className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Sessions</p>
              <p className="text-2xl font-semibold mt-1">12</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">System Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="bg-white border border-gray-200">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">System Users</h3>
                <Input type="text" placeholder="Search users..." className="w-64" />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-blue-600">{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell className="text-gray-600">{user.lastLogin}</TableCell>
                    <TableCell><StatusBadge status={user.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 text-gray-400" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                          <span className="text-gray-400">✎</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUserToDelete(user.id);
                            setIsDeleteConfirmOpen(true);
                          }}
                        >
                          <X className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="bg-white border border-gray-200 p-8 text-center">
            <p className="text-gray-600">Audit trail and activity logs will be displayed here</p>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={isUserModalOpen} onOpenChange={(open) => {
        setIsUserModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit User' : 'Add New System User'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update user details and access level' : 'Create a new user account and assign system roles'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={userFormData.name}
                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                value={userFormData.email}
                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                placeholder="john@gemmineral.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>System Role</Label>
                <Select
                  value={userFormData.role || undefined}
                  onValueChange={(v) => setUserFormData({ ...userFormData, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Operations Manager">Operations Manager</SelectItem>
                    <SelectItem value="Yard Operator">Yard Operator</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Inspector">Inspector</SelectItem>
                    <SelectItem value="Lab Technician">Lab Technician</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={userFormData.department || undefined}
                  onValueChange={(v) => setUserFormData({ ...userFormData, department: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Administration">Administration</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Logistics">Logistics</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Quality Control">Quality Control</SelectItem>
                    <SelectItem value="Laboratory">Laboratory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>Cancel</Button>
            <Button className="bg-[#203727] hover:bg-[#2d4d39]" onClick={handleCreateUser}>
              {isEditMode ? 'Save Changes' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
