import { useState, useMemo } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Trash2, Plus, Truck, Search, History, Calendar, ArrowRight, Package, Scale } from 'lucide-react';
import { useSettingsQuery, useUpdateSettings } from '../hooks/useSettings';
import { useYardIntakeQuery } from '../hooks/useYardIntake';
import { useWeighbridgeQuery } from '../hooks/useWeighbridge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function VehicleManagement() {
    // Queries
    const { data: companySettings, isLoading: isLoadingSettings } = useSettingsQuery();
    const { data: yardIntake = [], isLoading: isLoadingYard } = useYardIntakeQuery();
    const { data: wbRecords = [], isLoading: isLoadingWB } = useWeighbridgeQuery();
    
    // Mutations
    const updateSettingsMutation = useUpdateSettings();

    const weighbridgeInbound = (wbRecords || []).filter((r: any) => r.type === 'Inbound' || r.direction === 'Inbound');
    const weighbridgeOutbound = (wbRecords || []).filter((r: any) => r.type === 'Outbound' || r.direction === 'Outbound');

    const isLoading = isLoadingSettings || isLoadingYard || isLoadingWB;

    const [searchTerm, setSearchTerm] = useState('');
    const [newVehicle, setNewVehicle] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

    const vehicles = companySettings?.vehicles || [];
    const filteredVehicles = vehicles.filter(v =>
        v.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const vehicleActivity = useMemo(() => {
        if (!selectedVehicle) return [];

        const activities: any[] = [];

        // Add Yard Intake records
        yardIntake.filter((r: any) => r.vehicleNumber === selectedVehicle).forEach((r: any) => {
            activities.push({
                id: `intake-${r.id}`,
                type: 'Yard Intake',
                date: r.date,
                details: `${r.mineralType} - ${r.netWeight}kg`,
                status: r.status,
                icon: <Package className="h-4 w-4" />
            });
        });

        // Add Weighbridge Inbound
        weighbridgeInbound.filter((r: any) => r.vehicleNo === selectedVehicle).forEach((r: any) => {
            activities.push({
                id: `wb-in-${r.id}`,
                type: 'Weighbridge IN',
                date: r.time,
                details: `Net: ${r.net}kg - ${r.supplier}`,
                status: r.status,
                icon: <Scale className="h-4 w-4" />
            });
        });

        // Add Weighbridge Outbound
        weighbridgeOutbound.filter((r: any) => r.vehicleNo === selectedVehicle).forEach((r: any) => {
            activities.push({
                id: `wb-out-${r.id}`,
                type: 'Weighbridge OUT',
                date: r.time,
                details: `Loaded: ${r.loadedWeight}kg -> ${r.destination}`,
                status: r.status,
                icon: <ArrowRight className="h-4 w-4" />
            });
        });

        return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedVehicle, yardIntake, weighbridgeInbound, weighbridgeOutbound]);

    const handleAddVehicle = async () => {
        if (!newVehicle.trim()) return;
        if (vehicles.includes(newVehicle.trim())) {
            toast.error('Vehicle already exists');
            return;
        }

        try {
            await updateSettingsMutation.mutateAsync({
                ...companySettings,
                vehicles: [...vehicles, newVehicle.trim()]
            });
            setNewVehicle('');
        } catch (error) {
            // Mutation handles toast
        }
    };

    const handleRemoveVehicle = async (vehicle: string) => {
        try {
            await updateSettingsMutation.mutateAsync({
                ...companySettings,
                vehicles: vehicles.filter(v => v !== vehicle)
            });
            if (selectedVehicle === vehicle) setSelectedVehicle(null);
        } catch (error) {
            // Mutation handles toast
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-[#974926]" />
                    <p className="text-gray-500 font-medium">Loading vehicle history...</p>
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-6">
            <PageHeader
                title="Vehicle Management"
                description="Manage the list of authorized vehicles and track their operational history"
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Add and Registry */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6 space-y-4 bg-white border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <Plus className="h-5 w-5" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Add New Vehicle</h3>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="vehicle-no">Vehicle Number</Label>
                                <Input
                                    id="vehicle-no"
                                    placeholder="e.g., KL-07-AB-1234"
                                    value={newVehicle}
                                    onChange={(e) => setNewVehicle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddVehicle()}
                                />
                            </div>

                            <Button
                                className="w-full bg-[#203727] hover:bg-[#2d4d39]"
                                onClick={handleAddVehicle}
                                disabled={!newVehicle.trim()}
                            >
                                Add Vehicle
                            </Button>
                        </Card>

                        <Card className="p-6 bg-[#203727] text-white border-0 shadow-lg flex flex-col justify-center relative overflow-hidden">
                            <Truck className="absolute -right-6 -bottom-6 h-32 w-32 opacity-10 rotate-12" />
                            <p className="text-sm opacity-80 uppercase tracking-wider font-medium">Registry Status</p>
                            <h2 className="text-4xl font-bold mt-2">{vehicles.length}</h2>
                            <p className="text-xs mt-1 opacity-70">Authenticated vehicles in system</p>
                        </Card>
                    </div>

                    <Card className="p-6 space-y-4 bg-white border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                    <Truck className="h-5 w-5" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Vehicle Registry</h3>
                            </div>

                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search vehicles..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2">
                            {filteredVehicles.map((vehicle) => (
                                <div
                                    key={vehicle}
                                    onClick={() => setSelectedVehicle(vehicle)}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer group ${selectedVehicle === vehicle
                                            ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100'
                                            : 'bg-gray-50 border-gray-100 hover:border-[#203727]/30'
                                        }`}
                                >
                                    <span className={`font-medium ${selectedVehicle === vehicle ? 'text-blue-700' : 'text-gray-700'}`}>{vehicle}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveVehicle(vehicle);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            {filteredVehicles.length === 0 && (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400">
                                    <Truck className="h-12 w-12 mb-2 opacity-20" />
                                    <p>No vehicles found</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Activity History */}
                <Card className="lg:col-span-4 bg-white border border-gray-200 flex flex-col min-h-[600px]">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                        <History className="h-5 w-5 text-gray-500" />
                        <h3 className="font-semibold text-gray-900">Activity History</h3>
                    </div>

                    <div className="flex-1 p-0 overflow-hidden flex flex-col">
                        {selectedVehicle ? (
                            <>
                                <div className="p-4 bg-blue-50/30 border-b border-blue-100 flex items-center justify-between">
                                    <p className="text-sm font-medium text-blue-800">{selectedVehicle}</p>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                                        {vehicleActivity.length} Events
                                    </span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {vehicleActivity.length > 0 ? (
                                        vehicleActivity.map((activity) => (
                                            <div key={activity.id} className="relative pl-6 pb-2 border-l border-gray-100 last:border-0">
                                                <div className="absolute left-[-9px] top-0 p-1 bg-white border border-gray-100 rounded-full text-gray-500 shadow-sm">
                                                    {activity.icon}
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-gray-900 uppercase tracking-tight">{activity.type}</span>
                                                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                            <Calendar className="h-3 w-3" />
                                                            {activity.date}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-600 font-medium leading-tight">{activity.details}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${activity.status === 'Paid' || activity.status === 'Completed' || activity.status === 'Dispatched'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-orange-100 text-orange-700'
                                                            }`}>
                                                            {activity.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                                            <div className="p-3 bg-gray-50 rounded-full mb-3">
                                                <History className="h-6 w-6 opacity-20" />
                                            </div>
                                            <p className="text-sm">No recent activity detected</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                <div className="p-4 bg-gray-50 rounded-full mb-4">
                                    <Truck className="h-8 w-8 text-gray-300" />
                                </div>
                                <h4 className="font-medium text-gray-900 mb-1">Select a vehicle</h4>
                                <p className="text-sm text-gray-500 px-6">
                                    Choose a vehicle from the registry to view its operational history across all modules.
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
