import { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
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
import { Scale, Plus, X, ExternalLink, Printer, FileText, Eye } from 'lucide-react';
import { 
  useWeighbridgeQuery, 
  useAddWeighbridgeInbound, 
  useAddWeighbridgeOutbound 
} from '../hooks/useWeighbridge';
import { useYardIntakeQuery } from '../hooks/useYardIntake';
import { Loader2 } from 'lucide-react';

import { useSettingsQuery } from '../hooks/useSettings';
import { useNavigate } from 'react-router';
import { Combobox } from '../components/ui/combobox';

export function Weighbridge() {
  const navigate = useNavigate();
  const { data: companySettings, isLoading: isLoadingSettings } = useSettingsQuery();


  // Queries
  const { data: weighbridgeRecords = [], isLoading } = useWeighbridgeQuery();
  const { data: yardIntake = [] } = useYardIntakeQuery();

  // Derived data
  const weighbridgeInbound = weighbridgeRecords.filter(r => r.type === 'Inbound');
  const weighbridgeOutbound = weighbridgeRecords.filter(r => r.type === 'Outbound');

  // Mutations
  const addInboundMutation = useAddWeighbridgeInbound();
  const addOutboundMutation = useAddWeighbridgeOutbound();


  const [isInboundModalOpen, setIsInboundModalOpen] = useState(false);
  const [isOutboundModalOpen, setIsOutboundModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [inboundFormData, setInboundFormData] = useState({
    vehicleNo: '',
    supplier: '',
    grossWeight: '',
    tareWeight: '',
  });
  const [outboundFormData, setOutboundFormData] = useState({
    vehicleNo: '',
    destination: '',
    loadedWeight: '',
  });

  const handleCreateInbound = async () => {
    const gross = parseFloat(inboundFormData.grossWeight);
    const tare = parseFloat(inboundFormData.tareWeight);
    const net = gross - tare;

    try {
      await addInboundMutation.mutateAsync({
        ...inboundFormData,
        grossWeight: gross,
        tareWeight: tare,
        net: net,
        time: new Date().toISOString(),
        status: 'Completed'
      });
      setIsInboundModalOpen(false);
      setInboundFormData({ vehicleNo: '', supplier: '', grossWeight: '', tareWeight: '' });
    } catch (error) {
      // Mutation handles toast
    }
  };

  const handleCreateOutbound = async () => {
    try {
      await addOutboundMutation.mutateAsync({
        ...outboundFormData,
        loadedWeight: parseFloat(outboundFormData.loadedWeight),
        time: new Date().toISOString(),
        status: 'Dispatched'
      });
      setIsOutboundModalOpen(false);
      setOutboundFormData({ vehicleNo: '', destination: '', loadedWeight: '' });
    } catch (error) {
      // Mutation handles toast
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#974926]" />
          <p className="text-gray-500 font-medium">Loading weighbridge data...</p>
        </div>
      </div>
    );
  }

  const totalInboundWeight = weighbridgeInbound.reduce((acc, curr) => acc + (curr.net || 0), 0);
  const totalOutboundWeight = weighbridgeOutbound.reduce((acc, curr) => acc + (curr.loadedWeight || 0), 0);


  const vehicleOptions = Array.from(new Set([
    ...(companySettings?.vehicles || []),
    ...(yardIntake || []).map(r => r.vehicleNumber),
    ...(weighbridgeInbound || []).map(r => r.vehicleNo),
    ...(weighbridgeOutbound || []).map(r => r.vehicleNo)
  ])).filter(Boolean).sort().map(v => ({ label: v!, value: v! }));

  return (
    <div>
      <PageHeader
        title="Weighbridge"
        description="Manage inbound and outbound weight measurements"
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Total Inbound Logs</p>
          <p className="text-2xl font-semibold mt-1">{weighbridgeInbound.length}</p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Total Outbound Logs</p>
          <p className="text-2xl font-semibold mt-1">{weighbridgeOutbound.length}</p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Total Inbound (MT)</p>
          <p className="text-2xl font-semibold mt-1">{(totalInboundWeight / 1000).toFixed(1)} MT</p>
        </Card>
        <Card className="p-4 bg-white border border-gray-200">
          <p className="text-sm text-gray-600">Total Outbound (MT)</p>
          <p className="text-2xl font-semibold mt-1">{(totalOutboundWeight / 1000).toFixed(1)} MT</p>
        </Card>
      </div>

      <Tabs defaultValue="inbound" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="inbound">Inbound Weight Logs</TabsTrigger>
            <TabsTrigger value="outbound">Outbound Weight Logs</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button size="sm" onClick={() => setIsInboundModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Inbound Log
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsOutboundModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Outbound Log
            </Button>
          </div>
        </div>

        <TabsContent value="inbound">
          <Card className="bg-white border border-gray-200">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Inbound Weighbridge Logs</h3>
                <Input type="text" placeholder="Search vehicle..." className="w-64" />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle Number</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Gross Weight (kg)</TableHead>
                  <TableHead>Tare Weight (kg)</TableHead>
                  <TableHead>Net Weight (kg)</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weighbridgeInbound.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedRecord({ ...log, type: 'inbound' })}
                  >
                    <TableCell className="font-medium">{log.vehicleNo}</TableCell>
                    <TableCell>{log.supplier}</TableCell>
                    <TableCell>{log.grossWeight?.toLocaleString() || '-'}</TableCell>
                    <TableCell>{log.tareWeight?.toLocaleString() || log.tare?.toLocaleString() || '-'}</TableCell>
                    <TableCell className="font-medium text-blue-600">{log.net?.toLocaleString() || '-'}</TableCell>
                    <TableCell className="text-gray-600">{log.time}</TableCell>
                    <TableCell><StatusBadge status={log.status} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedRecord({ ...log, type: 'inbound' }); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="outbound">
          <Card className="bg-white border border-gray-200">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Outbound Weighbridge Logs</h3>
                <Input type="text" placeholder="Search container..." className="w-64" />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Container/Vehicle Number</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Loaded Weight (kg)</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weighbridgeOutbound.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedRecord({ ...log, type: 'outbound' })}
                  >
                    <TableCell className="font-medium">{log.vehicleNo}</TableCell>
                    <TableCell>{log.destination}</TableCell>
                    <TableCell className="font-medium text-blue-600">{log.loadedWeight?.toLocaleString() || '-'}</TableCell>
                    <TableCell className="text-gray-600">{log.time}</TableCell>
                    <TableCell><StatusBadge status={log.status} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedRecord({ ...log, type: 'outbound' }); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Panel */}
      {selectedRecord && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-[#1a1a1a] text-white shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold">{selectedRecord.vehicleNo}</h2>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => navigate(`/weighbridge/${selectedRecord.vehicleNo}`)}
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
            <button onClick={() => setSelectedRecord(null)} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Log Type</p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${selectedRecord.type === 'inbound' ? 'bg-blue-900/40 text-blue-400' : 'bg-purple-900/40 text-purple-400'}`}>
                {selectedRecord.type === 'inbound' ? 'Inbound Receipt' : 'Outbound Dispatch'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {selectedRecord.type === 'inbound' ? 'Company' : 'Destination'}
                </p>
                <p className="font-medium">
                  {selectedRecord.type === 'inbound' ? selectedRecord.supplier : selectedRecord.destination}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Timestamp</p>
                <p className="text-sm">{selectedRecord.time}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Weight Metrics (kg)</p>
              {selectedRecord.type === 'inbound' ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-gray-800 rounded">
                    <p className="text-[10px] text-gray-500 mb-1">GROSS</p>
                    <p className="font-bold">{selectedRecord.grossWeight?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="p-3 bg-gray-800 rounded">
                    <p className="text-[10px] text-gray-500 mb-1">TARE</p>
                    <p className="font-bold">{(selectedRecord.tareWeight || selectedRecord.tare)?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="p-3 bg-orange-950/40 rounded border border-orange-900/40">
                    <p className="text-[10px] text-orange-400 mb-1">NET</p>
                    <p className="font-bold text-orange-400">{selectedRecord.net?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-blue-950/40 rounded border border-blue-900/40">
                  <p className="text-[10px] text-blue-400 mb-1">LOADED WEIGHT</p>
                  <p className="text-2xl font-bold text-blue-400">{selectedRecord.loadedWeight?.toLocaleString() || '0'} kg</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Actions</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Slip
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-800">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Inbound Modal */}
      <Dialog open={isInboundModalOpen} onOpenChange={setIsInboundModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Inbound Weight Log</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="in-vehicle">Vehicle Number</Label>
              <Combobox
                options={vehicleOptions}
                value={inboundFormData.vehicleNo}
                onValueChange={(v) => setInboundFormData({ ...inboundFormData, vehicleNo: v })}
                placeholder="Select or enter vehicle"
                emptyText="Vehicle not found"
                allowCustom
                onCustomAdd={(v) => setInboundFormData({ ...inboundFormData, vehicleNo: v })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="in-supplier">Company</Label>
              <Input
                id="in-supplier"
                value={inboundFormData.supplier}
                onChange={(e) => setInboundFormData({ ...inboundFormData, supplier: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="gross">Gross Weight (kg)</Label>
                <Input
                  id="gross"
                  type="number"
                  value={inboundFormData.grossWeight}
                  onChange={(e) => setInboundFormData({ ...inboundFormData, grossWeight: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tare">Tare Weight (kg)</Label>
                <Input
                  id="tare"
                  type="number"
                  value={inboundFormData.tareWeight}
                  onChange={(e) => setInboundFormData({ ...inboundFormData, tareWeight: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateInbound}>Create Log</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Outbound Modal */}
      <Dialog open={isOutboundModalOpen} onOpenChange={setIsOutboundModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Outbound Weight Log</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="out-vehicle">Vehicle/Container Number</Label>
              <Combobox
                options={vehicleOptions}
                value={outboundFormData.vehicleNo}
                onValueChange={(v) => setOutboundFormData({ ...outboundFormData, vehicleNo: v })}
                placeholder="Select or enter vehicle/container"
                emptyText="Vehicle/Container not found"
                allowCustom
                onCustomAdd={(v) => setOutboundFormData({ ...outboundFormData, vehicleNo: v })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="out-dest">Destination</Label>
              <Select
                value={outboundFormData.destination}
                onValueChange={(v) => setOutboundFormData({ ...outboundFormData, destination: v })}
              >
                <SelectTrigger id="out-dest">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {(companySettings?.destinations || []).map((dest: string) => (
                    <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="out-weight">Loaded Weight (kg)</Label>
              <Input
                id="out-weight"
                type="number"
                value={outboundFormData.loadedWeight}
                onChange={(e) => setOutboundFormData({ ...outboundFormData, loadedWeight: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateOutbound}>Create Log</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
