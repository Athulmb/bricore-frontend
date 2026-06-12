import { useState } from 'react';
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
import { Plus, Eye, Upload, X, ExternalLink, Phone, Mail, Map } from 'lucide-react';
import {
  useTransportersQuery,
  useTripsQuery,
  useAddTransporter,
  useUpdateTransporter,
  useDeleteTransporter,
  useAddTrip,
  useUpdateTrip,
  useDeleteTrip
} from '../hooks/useTransportation';
import { useDispatchQuery } from '../hooks/useDispatch';
import { useYardIntakeQuery } from '../hooks/useYardIntake';
import { useWeighbridgeQuery } from '../hooks/useWeighbridge';
import { Loader2 } from 'lucide-react';

import { useSettingsQuery } from '../hooks/useSettings';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Combobox } from '../components/ui/combobox';

export function Transportation() {
  const navigate = useNavigate();
  const { data: companySettings, isLoading: isLoadingSettings } = useSettingsQuery();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: companySettings?.currency || 'GHS',
    }).format(amount);
  };


  // Queries
  const { data: transporters = [], isLoading: isLoadingTrans } = useTransportersQuery();
  const { data: trips = [], isLoading: isLoadingTrips } = useTripsQuery();
  const { data: dispatchRecords = [] } = useDispatchQuery();
  const { data: yardIntake = [] } = useYardIntakeQuery();
  const { data: weighbridgeRecords = [] } = useWeighbridgeQuery();

  // Derived weighbridge data for vehicle suggestions
  const weighbridgeInbound = weighbridgeRecords.filter(r => r.type === 'Inbound');
  const weighbridgeOutbound = weighbridgeRecords.filter(r => r.type === 'Outbound');

  // Mutations
  const addTransporterMutation = useAddTransporter();
  const updateTransporterMutation = useUpdateTransporter();
  const deleteTransporterMutation = useDeleteTransporter();
  const addTripMutation = useAddTrip();
  const updateTripMutation = useUpdateTrip();
  const deleteTripMutation = useDeleteTrip();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'transporter' | 'trip' } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    vat: '',
  });

  const [tripFormData, setTripFormData] = useState({
    transporterId: '',
    dispatchId: '',
    vehicleNumber: '',
    route: '',
    freight: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '-',
  });

  const handleEditTransporter = (transporter: any) => {
    setFormData({
      name: transporter.name,
      contactPerson: transporter.contactPerson,
      phone: transporter.phone,
      email: transporter.email,
      vat: transporter.vat || '',
    });
    setEditingId(transporter.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        if (deleteTarget.type === 'transporter') {
          await deleteTransporterMutation.mutateAsync(deleteTarget.id);
        } else {
          await deleteTripMutation.mutateAsync(deleteTarget.id);
        }
        setIsDeleteConfirmOpen(false);
        setDeleteTarget(null);
        if (selectedRecord?.id === deleteTarget.id) {
          setSelectedRecord(null);
        }
      } catch (error) {
        // Mutation handles toast
      }
    }
  };

  const handleAddTransporter = async () => {
    if (!formData.name || !formData.contactPerson || !formData.phone) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      if (isEditMode && editingId) {
        await updateTransporterMutation.mutateAsync({
          id: editingId,
          data: formData
        });
      } else {
        await addTransporterMutation.mutateAsync({
          ...formData,
          // status: 'Active' // Handled by hook/backend usually
        });
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      // Mutation handles toast
    }
  };

  const handleAddTrip = async () => {
    if (!tripFormData.transporterId || !tripFormData.dispatchId || tripFormData.freight <= 0) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await addTripMutation.mutateAsync({
        ...tripFormData,
        tripId: `TRP-2026-${Math.floor(100 + Math.random() * 900)}`,
        status: 'Pending'
      });

      setIsTripModalOpen(false);
      resetTripForm();
    } catch (error) {
      // Mutation handles toast
    }
  };

  const resetTripForm = () => {
    setTripFormData({
      transporterId: '',
      dispatchId: '',
      vehicleNumber: '',
      route: '',
      freight: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '-',
    });
  };

  if (isLoadingTrans || isLoadingTrips) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#E8491F]" />
          <p className="text-gray-500 font-medium">Loading transportation data...</p>
        </div>
      </div>
    );
  }


  const vehicleOptions = Array.from(new Set([
    ...(companySettings?.vehicles || []),
    ...(yardIntake || []).map(r => r.vehicleNumber),
    ...(weighbridgeInbound || []).map(r => r.vehicleNo),
    ...(weighbridgeOutbound || []).map(r => r.vehicleNo),
    ...(dispatchRecords || []).map(r => r.container)
  ])).filter(Boolean).sort().map(v => ({ label: v!, value: v! }));

  const routeOptions = (companySettings?.destinations || []).map((d: any) => ({ label: d, value: d }));

  const resetForm = () => {
    setFormData({ name: '', contactPerson: '', phone: '', email: '', vat: '' });
    setIsEditMode(false);
    setEditingId(null);
  };

  return (
    <div>
      <PageHeader
        title="Transportation Management"
        description="Manage transporters, trips, and freight costs"
        action={{
          label: 'Add Transporter',
          icon: Plus,
          onClick: () => setIsModalOpen(true),
        }}
        secondaryAction={{
          label: 'Create Trip',
          icon: Plus,
          onClick: () => setIsTripModalOpen(true),
        }}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Active Transporters</p>
          <p className="text-2xl font-semibold mt-1">
            {transporters.filter((t: any) => t.status === 'Active').length}
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Active Trips</p>
          <p className="text-2xl font-semibold mt-1">
            {trips.filter((t: any) => t.status === 'In-Transit').length}
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Total Freight (Month)</p>
          <p className="text-2xl font-semibold mt-1">
            {formatCurrency(trips.reduce((acc: any, curr: any) => acc + curr.freight, 0))}
          </p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">On-Time Delivery</p>
          <p className="text-2xl font-semibold mt-1">96%</p>
        </Card>
      </div>

      <Card className="bg-white border border-gray-200 mb-6">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Transporter Database</h3>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transporter Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>VAT No</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transporters.map((transporter: any) => (
              <TableRow
                key={transporter.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedRecord({ ...transporter, type: 'transporter' })}
              >
                <TableCell className="font-medium">{transporter.name || transporter.companyName}</TableCell>
                <TableCell>{transporter.contactPerson}</TableCell>
                <TableCell>{transporter.phone}</TableCell>
                <TableCell className="text-blue-600">{transporter.email}</TableCell>
                <TableCell>{transporter.vat || '-'}</TableCell>
                <TableCell><StatusBadge status={transporter.status} /></TableCell>
                <TableCell>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedRecord({ ...transporter, type: 'transporter' })}>
                      <Eye className="h-4 w-4 text-gray-400" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditTransporter(transporter)}>
                      <span className="text-gray-400">✎</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteTarget({ id: transporter.id, type: 'transporter' });
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

      <Card className="bg-white border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Trip Assignments</h3>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trip ID</TableHead>
              <TableHead>Transporter</TableHead>
              <TableHead>Dispatch ID</TableHead>
              <TableHead>Vehicle / Container</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Freight Cost</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((trip: any) => (
              <TableRow
                key={trip.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedRecord({ ...trip, type: 'trip' })}
              >
                <TableCell className="font-medium text-blue-600">{trip.tripId}</TableCell>
                <TableCell>{trip.transporter}</TableCell>
                <TableCell className="text-blue-600 font-mono">{trip.dispatchId}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium uppercase">
                      {trip.vehicleNumber || dispatchRecords.find(d => d.dispatchId === trip.dispatchId)?.container || 'N/A'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{trip.route}</TableCell>
                <TableCell className="font-medium">{formatCurrency(trip.freight)}</TableCell>
                <TableCell className="text-gray-600">{trip.startDate}</TableCell>
                <TableCell><StatusBadge status={trip.status} /></TableCell>
                <TableCell>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedRecord({ ...trip, type: 'trip' })}>
                      <Eye className="h-4 w-4 text-gray-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteTarget({ id: trip.id, type: 'trip' });
                        setIsDeleteConfirmOpen(true);
                      }}
                    >
                      <X className="h-4 w-4 text-red-400" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Upload className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Transporter' : 'Add New Transporter'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update the registered transportation service provider details' : 'Register a new transportation service provider'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="ABC Logistics Pvt Ltd"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-person">Contact Person</Label>
              <Input
                id="contact-person"
                placeholder="Rajesh Kumar"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+91-98765-43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@logistics.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vat">VAT Number</Label>
              <Input
                id="vat"
                placeholder="VAT-12345678"
                value={formData.vat}
                onChange={(e) => setFormData({ ...formData, vat: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTransporter}>
              {isEditMode ? 'Save Changes' : 'Add Transporter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTripModalOpen} onOpenChange={(open) => {
        setIsTripModalOpen(open);
        if (!open) resetTripForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign New Trip</DialogTitle>
            <DialogDescription>
              Create a new trip assignment for a transporter and link it to a dispatch.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="trip-id">Trip ID</Label>
              <Input id="trip-id" placeholder="Auto-generated" disabled className="bg-gray-100" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transporter">Select Transporter</Label>
              <Select
                value={tripFormData.transporterId}
                onValueChange={(v) => setTripFormData({ ...tripFormData, transporterId: v })}
              >
                <SelectTrigger id="transporter">
                  <SelectValue placeholder="Select transporter" />
                </SelectTrigger>
                <SelectContent>
                  {transporters.map((t: any) => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispatch-link">Dispatch ID</Label>
              <Select
                value={tripFormData.dispatchId}
                onValueChange={(v) => {
                  const dispatch = dispatchRecords.find(d => d.dispatchId === v);
                  setTripFormData({
                    ...tripFormData,
                    dispatchId: v,
                    vehicleNumber: dispatch?.container || tripFormData.vehicleNumber
                  });
                }}
              >
                <SelectTrigger id="dispatch-link">
                  <SelectValue placeholder="Select dispatch record" />
                </SelectTrigger>
                <SelectContent>
                  {dispatchRecords.map(d => (
                    <SelectItem key={d.id} value={d.dispatchId}>{d.dispatchId} ({d.batchId})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-no">Vehicle / Container Number</Label>
              <Combobox
                options={vehicleOptions}
                value={tripFormData.vehicleNumber}
                onValueChange={(v: any) => setTripFormData({ ...tripFormData, vehicleNumber: v })}
                placeholder="Select or enter vehicle/container"
                emptyText="Vehicle/Container not found"
                allowCustom
                onCustomAdd={(v: any) => setTripFormData({ ...tripFormData, vehicleNumber: v })}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="route">Route Details</Label>
              <Combobox
                options={routeOptions}
                value={tripFormData.route}
                onValueChange={(v: any) => setTripFormData({ ...tripFormData, route: v })}
                placeholder="Select or enter route details"
                emptyText="Route not found"
                allowCustom
                onCustomAdd={(v) => setTripFormData({ ...tripFormData, route: v })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="freight">Freight Amount</Label>
              <Input
                id="freight"
                type="number"
                placeholder="0.00"
                value={tripFormData.freight}
                onChange={(e) => setTripFormData({ ...tripFormData, freight: parseFloat(e.target.value) || 0 })}
                onFocus={(e) => e.target.select()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={tripFormData.startDate}
                onChange={(e) => setTripFormData({ ...tripFormData, startDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTripModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTrip}>Assign Trip</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Panel */}
      {selectedRecord && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-[#1a1a1a] text-white shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold">
                {selectedRecord.type === 'transporter' ? selectedRecord.name : selectedRecord.tripId}
              </h2>
              {selectedRecord.type === 'trip' && (
                <button
                  className="text-gray-400 hover:text-white"
                  onClick={() => navigate(`/transportation/${selectedRecord.tripId}`)}
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              )}
            </div>
            <button onClick={() => setSelectedRecord(null)} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <StatusBadge status={selectedRecord.status} />
            </div>

            {selectedRecord.type === 'transporter' ? (
              <>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Contact Person</p>
                    <p className="font-medium text-lg">{selectedRecord.contactPerson}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-[10px] text-gray-500">PHONE</p>
                        <p className="text-sm">{selectedRecord.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-[10px] text-gray-500">EMAIL</p>
                        <p className="text-sm truncate">{selectedRecord.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">VAT Number</p>
                    <p className="font-medium text-lg font-mono text-blue-400">{selectedRecord.vat || 'Not Provided'}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Dispatch Reference</p>
                    <p className="font-medium text-blue-400 font-mono">{selectedRecord.dispatchId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Transporter</p>
                    <p className="font-medium">{selectedRecord.transporter}</p>
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-6 p-4 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Vehicle / Container</p>
                      <p className="font-mono text-lg uppercase">
                        {selectedRecord.vehicleNumber || dispatchRecords.find(d => d.dispatchId === selectedRecord.dispatchId)?.container || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Driver Details</p>
                      <p className="text-sm font-medium">
                        {dispatchRecords.find(d => d.dispatchId === selectedRecord.dispatchId)?.driverName || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {dispatchRecords.find(d => d.dispatchId === selectedRecord.dispatchId)?.contactNumber || ''}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Route</p>
                    <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
                      <Map className="h-4 w-4 text-green-500" />
                      <p className="text-sm font-medium">{selectedRecord.route}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Freight Cost</p>
                    <p className="text-lg font-bold text-orange-400">{formatCurrency(selectedRecord.freight)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Trip Start</p>
                    <p className="text-sm">{selectedRecord.startDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Batch Linked</p>
                    <p className="text-sm text-blue-400 font-mono">
                      {dispatchRecords.find(d => d.dispatchId === selectedRecord.dispatchId)?.batchId || 'N/A'}
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Actions</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800"
                  onClick={() => {
                    if (selectedRecord.type === 'transporter') {
                      handleEditTransporter(selectedRecord);
                    } else {
                      // Trip edit logic could be added here if needed, but per plan primarily Transporter edit
                    }
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {selectedRecord.type === 'transporter' ? 'Edit Details' : 'Update Trip'}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800">
                  <Eye className="h-4 w-4 mr-2" />
                  Full History
                </Button>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  setDeleteTarget({ id: selectedRecord.id, type: selectedRecord.type });
                  setIsDeleteConfirmOpen(true);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Delete {selectedRecord.type === 'transporter' ? 'Transporter' : 'Trip'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
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
