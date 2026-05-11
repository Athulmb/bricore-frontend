import { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Trash2, Plus, Package, Save, Search } from 'lucide-react';
import { useSettingsQuery, useUpdateSettings } from '../hooks/useSettings';
import { Loader2 } from 'lucide-react';

export function MaterialManagement() {
    const { data: companySettings, isLoading } = useSettingsQuery();
    const updateSettingsMutation = useUpdateSettings();
    const [searchTerm, setSearchTerm] = useState('');
    const [newMaterial, setNewMaterial] = useState('');

    const materials = companySettings?.materialTypes || [];
    const filteredMaterials = materials.filter((m: string) =>
        m.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddMaterial = async () => {
        if (!newMaterial.trim()) return;
        if (materials.includes(newMaterial.trim())) {
            toast.error('Material already exists');
            return;
        }

        try {
            await updateSettingsMutation.mutateAsync({
                ...companySettings,
                materialTypes: [...materials, newMaterial.trim()]
            });
            setNewMaterial('');
        } catch (error) {
            // Mutation handles toast
        }
    };

    const handleRemoveMaterial = async (material: string) => {
        try {
            await updateSettingsMutation.mutateAsync({
                ...companySettings,
                materialTypes: materials.filter((m: string) => m !== material)
            });
        } catch (error) {
            // Mutation handles toast
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-[#974926]" />
                    <p className="text-gray-500 font-medium">Loading material registry...</p>
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-6">
            <PageHeader
                title="Material Management"
                description="Manage the list of minerals and materials handled in the yard"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 md:col-span-1 space-y-4 bg-white border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Plus className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Add New Material</h3>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="material-name">Material Name</Label>
                        <Input
                            id="material-name"
                            placeholder="e.g., Quartz, Lithium Ore"
                            value={newMaterial}
                            onChange={(e) => setNewMaterial(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddMaterial()}
                        />
                    </div>

                    <Button
                        className="w-full bg-[#203727] hover:bg-[#2d4d39]"
                        onClick={handleAddMaterial}
                        disabled={!newMaterial.trim()}
                    >
                        Add Material
                    </Button>
                </Card>

                <Card className="p-6 md:col-span-2 space-y-4 bg-white border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                <Package className="h-5 w-5" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Material Registry</h3>
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-medium">
                                {materials.length} Total
                            </span>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search materials..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2">
                        {filteredMaterials.map((material) => (
                            <div
                                key={material}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:border-[#203727]/30 transition-colors"
                            >
                                <span className="font-medium text-gray-700">{material}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleRemoveMaterial(material)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        {filteredMaterials.length === 0 && (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400">
                                <Package className="h-12 w-12 mb-2 opacity-20" />
                                <p>No materials found</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
