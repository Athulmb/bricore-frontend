import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Eye, Building2, MapPin, Hash, UserCircle2, Mail, Phone, Calendar, ChevronRight, ChevronLeft, CheckCircle2, Pencil, Trash2, Settings, X } from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import {
    useClientsQuery,
    useCreateClient,
    useUpdateClient,
    useDeleteClient,
    Client
} from '../hooks/useClients';
import { Loader2 } from 'lucide-react';

export function ClientManagement() {
    // Queries
    const { data: clients = [], isLoading } = useClientsQuery();

    // Mutations
    const createMutation = useCreateClient();
    const updateMutation = useUpdateClient();
    const deleteMutation = useDeleteClient();

    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingClientId, setEditingClientId] = useState<number | string | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<number | string | null>(null);

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        registrationDate: new Date().toISOString().split('T')[0],
        primaryContact: '',
        email: '',
        phone: '',
        tin: '',
        address: '',
        status: 'Onboarding' as Client['status'],
        type: 'Supplier' as Client['type']
    });

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleRegister = async () => {
        if (!formData.name || !formData.email) {
            toast.error('Please complete all required fields (Name, Email)');
            return;
        }

        try {
            if (isEditMode && editingClientId) {
                await updateMutation.mutateAsync({
                    id: editingClientId,
                    data: formData
                });
            } else {
                await createMutation.mutateAsync(formData);
            }
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            // Mutation handles toast
        }
    };

    const handleDelete = async () => {
        if (clientToDelete) {
            try {
                await deleteMutation.mutateAsync(clientToDelete);
                setIsDeleteConfirmOpen(false);
                setClientToDelete(null);
            } catch (error) {
                // Mutation handles toast
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-[#974926]" />
                    <p className="text-gray-500 font-medium">Loading client directory...</p>
                </div>
            </div>
        );
    }

    const handleEdit = (client: Client) => {
        setFormData({
            name: client.name,
            industry: client.industry,
            registrationDate: client.registrationDate,
            primaryContact: client.primaryContact,
            email: client.email,
            phone: client.phone,
            tin: client.tin,
            address: client.address,
            status: client.status,
            type: client.type
        });
        setEditingClientId(client.id);
        setIsEditMode(true);
        setCurrentStep(1);
        setIsModalOpen(true);
    };


    const resetForm = () => {
        setFormData({
            name: '',
            industry: '',
            registrationDate: new Date().toISOString().split('T')[0],
            primaryContact: '',
            email: '',
            phone: '',
            tin: '',
            address: '',
            status: 'Onboarding',
            type: 'Supplier'
        });
        setCurrentStep(1);
        setIsEditMode(false);
        setEditingClientId(null);
    };

    const typeFilter = searchParams.get('type');

    const filteredClients = clients.filter((client: any) => {
        const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.tin && client.tin.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = !typeFilter || client.type === typeFilter || client.type === 'Both';
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Client Management"
                description="Register and manage external clients, track onboarding status"
                action={{
                    label: 'Register Client',
                    icon: Plus,
                    onClick: () => setIsModalOpen(true),
                }}
            />

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? 'Edit Client Details' : 'Register New Client'}</DialogTitle>
                        <DialogDescription>
                            {isEditMode ? 'Update the information for this client' : 'Complete the 3-step onboarding process'}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-between mb-8 px-4">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center flex-1 last:flex-none">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${currentStep >= step ? 'bg-[#203727] border-[#203727] text-white' : 'border-gray-300 text-gray-400'
                                    }`}>
                                    {currentStep > step ? <CheckCircle2 className="h-5 w-5" /> : step}
                                </div>
                                {step < 3 && (
                                    <div className={`flex-1 h-0.5 mx-2 ${currentStep > step ? 'bg-[#203727]' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="py-4 min-h-[300px]">
                        {currentStep === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Company Name</Label>
                                        <Input
                                            placeholder="e.g. Global Ores Ltd"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Industry</Label>
                                        <Select
                                            value={formData.industry}
                                            onValueChange={v => setFormData({ ...formData, industry: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select industry" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Mining">Mining & Extraction</SelectItem>
                                                <SelectItem value="Logistics">Logistics & Supply Chain</SelectItem>
                                                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                                                <SelectItem value="Export">Import/Export</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Client Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={v => setFormData({ ...formData, type: v as Client['type'] })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Supplier">Company (Inbound)</SelectItem>
                                            <SelectItem value="Customer">Client (Outbound)</SelectItem>
                                            <SelectItem value="Both">Both (Contractor)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Registration Date</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            type="date"
                                            className="pl-9"
                                            value={formData.registrationDate}
                                            onChange={e => setFormData({ ...formData, registrationDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <Label>Primary Contact Person</Label>
                                    <div className="relative">
                                        <UserCircle2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Full Name"
                                            className="pl-9"
                                            value={formData.primaryContact}
                                            onChange={e => setFormData({ ...formData, primaryContact: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="email@company.com"
                                                className="pl-9"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="+234..."
                                                className="pl-9"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <Label>TIN Number (Taxpayer Identification Number)</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="e.g. 23456789-0001"
                                            className="pl-9"
                                            value={formData.tin}
                                            onChange={e => setFormData({ ...formData, tin: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Registered Office Address</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Textarea
                                            placeholder="Enter full office address"
                                            className="pl-9 min-h-[100px]"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex justify-between sm:justify-between border-t pt-4">
                        <Button
                            variant="outline"
                            onClick={prevStep}
                            disabled={currentStep === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        {currentStep < 3 ? (
                            <Button onClick={nextStep} className="bg-[#203727] hover:bg-[#2d4d39]">
                                Next Step
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        ) : (
                            <Button onClick={handleRegister} className="bg-[#974926] hover:bg-[#b85a2e]">
                                {isEditMode ? 'Save Changes' : 'Complete Onboarding'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 bg-white border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Clients</p>
                            <p className="text-2xl font-semibold mt-1">{clients.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-white border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <Plus className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">New This Month</p>
                            <p className="text-2xl font-semibold mt-1">2</p>
                        </div>
                    </div>
                </Card>
                {/* Additional stats can go here */}
            </div>

            <Card className="bg-white border border-gray-200">
                <div className="p-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-gray-900">Registered Clients</h3>
                        <div className="relative w-64">
                            <Input
                                type="text"
                                placeholder="Search clients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Entity Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Primary Contact</TableHead>
                            <TableHead>TIN Number</TableHead>
                            <TableHead>Industry</TableHead>
                            <TableHead>Reg. Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredClients.map((client: any) => (
                            <TableRow key={client.id}>
                                <TableCell>
                                    <div className="font-medium text-gray-900">{client.name}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                        <MapPin className="h-3 w-3" /> {client.address}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`text-[10px] ${client.type === 'Supplier' ? 'bg-green-50 text-green-700 border-green-200' :
                                        client.type === 'Customer' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                        {client.type === 'Supplier' ? 'Company' : client.type === 'Customer' ? 'Client' : 'Both'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm font-medium">{client.primaryContact}</div>
                                    <div className="text-xs text-gray-500">{client.email}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5 text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 w-fit font-mono">
                                        <Hash className="h-3 w-3" />
                                        {client.tin}
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">{client.industry}</TableCell>
                                <TableCell className="text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {client.registrationDate}
                                    </div>
                                </TableCell>
                                <TableCell><StatusBadge status={client.status} /></TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedClient(client);
                                                setIsProfileOpen(true);
                                            }}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(client)}
                                        >
                                            <Pencil className="h-4 w-4 text-blue-600" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setClientToDelete(client.id);
                                                setIsDeleteConfirmOpen(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Client?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. All data related to this client will be removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete Permanently</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Client Profile Side Panel */}
            {isProfileOpen && selectedClient && (
                <div className="fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l">
                    <div className="flex items-center justify-between p-6 border-b bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                                <Building2 className="h-6 w-6 text-[#203727]" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedClient.name}</h2>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{selectedClient.industry}</Badge>
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setIsProfileOpen(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                                <p className="text-xs text-blue-600 font-medium mb-1">Status</p>
                                <StatusBadge status={selectedClient.status} />
                            </div>
                            <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100">
                                <p className="text-xs text-orange-600 font-medium mb-1">Registered On</p>
                                <p className="text-sm font-semibold text-gray-900">{selectedClient.registrationDate}</p>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <UserCircle2 className="h-4 w-4 text-gray-400" />
                                Contact Information
                            </h3>
                            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Primary Contact</p>
                                    <p className="text-sm font-medium text-gray-900">{selectedClient.primaryContact}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                                        <p className="text-sm text-gray-900">{selectedClient.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                                        <p className="text-sm text-gray-900">{selectedClient.phone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financial & Address */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Settings className="h-4 w-4 text-gray-400" />
                                Compliance Details
                            </h3>
                            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">TIN Number</p>
                                    <div className="flex items-center gap-1.5 text-sm font-mono bg-white px-2 py-1 rounded border w-fit">
                                        <Hash className="h-3 w-3 text-gray-400" />
                                        {selectedClient.tin}
                                    </div>
                                </div>
                                <div className="pt-2 border-t">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Office Address</p>
                                    <div className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
                                        <MapPin className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                                        {selectedClient.address}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t bg-slate-50 flex gap-3">
                        <Button
                            className="flex-1 bg-[#203727] hover:bg-[#2d4d39]"
                            onClick={() => {
                                setIsProfileOpen(false);
                                handleEdit(selectedClient);
                            }}
                        >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Profile
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => {
                                setIsProfileOpen(false);
                                setClientToDelete(selectedClient.id);
                                setIsDeleteConfirmOpen(true);
                            }}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
