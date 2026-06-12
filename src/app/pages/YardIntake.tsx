import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
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
import { Plus, Eye, Edit, Upload, Play, X, Loader2 } from 'lucide-react';
import { useSettingsQuery } from '../hooks/useSettings';
import { useTransportersQuery } from '../hooks/useTransportation';
import { useClientsQuery } from '../hooks/useClients';
import { useCreateYardIntake, useYardIntakeQuery } from '../hooks/useYardIntake';

export function YardIntake() {
  const { data: companySettings } = useSettingsQuery();
  const { data: transporters = [] } = useTransportersQuery();
  const { data: clients = [] } = useClientsQuery();

  const { data: yardIntake = [], isLoading: isFetching, isError } = useYardIntakeQuery();
  const createMutation = useCreateYardIntake();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [grossWeight, setGrossWeight] = useState('');
  const [tareWeight, setTareWeight] = useState('');

  const [formData, setFormData] = useState({
    supplierName: '',
    vehicleNumber: '',
    materialType: [],
    mineralType: [] as string[],
    customerName: '',
  });

  const netWeight = grossWeight && tareWeight
    ? (parseFloat(grossWeight) - parseFloat(tareWeight)).toFixed(0)
    : '';

  const handleCreateIntake = async () => {
    try {
      await createMutation.mutateAsync({
        ...formData,
        grossWeight: parseFloat(grossWeight),
        tareWeight: parseFloat(tareWeight),
        netWeight: parseFloat(netWeight),
      });
      setIsModalOpen(false);
      // Reset form
      setGrossWeight('');
      setTareWeight('');
      setFormData({
        supplierName: '',
        vehicleNumber: '',
        materialType: [],
        mineralType: [],
        customerName: '',
      });
    } catch (error) {
      // Error handled by mutation toast
    }
  };

  const handleProcess = (record: any) => {
    navigate('/crushing-processing', {
      state: {
        rawMaterial: record.mineralType || record.materialType,
        quantity: record.netWeight,
        grnReference: record.grnNumber,
        supplierName: record.supplierName || record.supplier,
        customerName: record.customerName || 'N/A'
      }
    });
  };

  return (
    <div>
      <PageHeader
        title="Yard Intake"
        description="Manage incoming mineral deliveries and generate GRNs"
        action={{
          label: 'Add Intake',
          icon: Plus,
          onClick: () => setIsModalOpen(true),
        }}
      />

      <Card className="bg-white border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Intake Records</h3>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search by GRN, Company, Vehicle..."
                className="w-80"
              />
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GRN Number</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Vehicle Number</TableHead>
              <TableHead>Gross Weight (kg)</TableHead>
              <TableHead>Tare Weight (kg)</TableHead>
              <TableHead>Net Weight (kg)</TableHead>
              <TableHead>Mineral Type</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-[#E8491F]" />
                    <span>Loading intake records...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-red-500">
                  Error loading records. Please try again.
                </TableCell>
              </TableRow>
            ) : yardIntake.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-gray-400">
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              yardIntake.map((record) => (
                <TableRow
                  key={record.id}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <TableCell
                    className="font-medium text-[#E8491F]"
                    onClick={() => navigate(`/yard-intake/${record.grnNumber}`)}
                  >
                    {record.grnNumber}
                  </TableCell>
                  <TableCell>{record.supplierName || record.supplier}</TableCell>
                  <TableCell>{record.vehicleNumber}</TableCell>
                  <TableCell>{record.grossWeight.toLocaleString()}</TableCell>
                  <TableCell>{record.tareWeight.toLocaleString()}</TableCell>
                  <TableCell className="font-medium">
                    {record.netWeight.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const materials = record.mineralType || record.materialType;
                      return Array.isArray(materials) 
                        ? materials.map((m: any) => typeof m === 'string' ? m : m.name).join(', ') 
                        : materials;
                    })()}
                  </TableCell>
                  <TableCell className="text-gray-600">{record.date || new Date(record.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <StatusBadge status={record.status} />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => handleProcess(record)}
                      >
                        <Play className="h-4 w-4 mr-1" /> Process
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/yard-intake/${record.grnNumber}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Yard Intake</DialogTitle>
            <DialogDescription>
              Create a new goods receipt note (GRN) for incoming mineral delivery
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Company Name</Label>
              <Select
                value={formData.supplierName}
                onValueChange={(v) => setFormData({ ...formData, supplierName: v })}
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {(transporters || []).map((t: any) => (
                    <SelectItem key={t.id} value={t.companyName || t.name}>{t.companyName || t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer">Client Name</Label>
              <Select
                value={formData.customerName}
                onValueChange={(v) => setFormData({ ...formData, customerName: v })}
              >
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N/A">N/A</SelectItem>
                  {(clients || []).filter((c: any) => c.type === 'Customer' || c.type === 'Both').map((client: any) => (
                    <SelectItem key={client.id} value={client.name}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle Number</Label>
              <Input
                id="vehicle"
                placeholder="e.g., KL-07-AB-1234"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gross">Gross Weight (kg)</Label>
              <Input
                id="gross"
                type="number"
                placeholder="24500"
                value={grossWeight}
                onChange={(e) => setGrossWeight(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tare">Tare Weight (kg)</Label>
              <Input
                id="tare"
                type="number"
                placeholder="2500"
                value={tareWeight}
                onChange={(e) => setTareWeight(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="net">Net Weight (kg)</Label>
              <Input
                id="net"
                value={netWeight}
                disabled
                className="bg-gray-100"
                placeholder="Auto-calculated"
              />
            </div>

            <div className="space-y-2">
              <Label>Mineral Type</Label>
              <div className="flex flex-wrap gap-1 mb-2 border rounded-md p-2 min-h-[42px] bg-white">
                {formData.mineralType.length === 0 && (
                  <span className="text-gray-400 text-sm">Select minerals...</span>
                )}
                {formData.mineralType.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1 bg-[#E8491F] text-white px-2 py-0.5 rounded text-sm"
                  >
                    {type}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          mineralType: formData.mineralType.filter(t => t !== type)
                        })
                      }
                      className="hover:text-red-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <Select
                onValueChange={(v) => {
                  if (!formData.mineralType.includes(v)) {
                    setFormData({
                      ...formData,
                      mineralType: [...formData.mineralType, v]
                    });
                  }
                }}
              >
                <SelectTrigger id="mineral">
                  <SelectValue placeholder="Add mineral" />
                </SelectTrigger>
                <SelectContent>
                  {(companySettings?.materialTypes || []).map((type: string) => (
                    <SelectItem key={type} value={type} disabled={formData.mineralType.includes(type)}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch">Batch Number</Label>
              <Input id="batch" placeholder="Auto-generated" disabled className="bg-gray-100" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documents">Upload Documents</Label>
              <div className="flex gap-2">
                <Input id="documents" type="file" className="flex-1" />
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateIntake}>
              Create GRN
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}