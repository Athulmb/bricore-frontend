import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Building2, Bell, Shield, Database, Save, ListTodo, Plus, Trash2 } from 'lucide-react';
import { useSettingsQuery, useUpdateSettings } from '../hooks/useSettings';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { currencies, CurrencyCode } from '../context/CurrencyContext';

export function Settings() {
  const { data: companySettings, isLoading } = useSettingsQuery();
  const updateMutation = useUpdateSettings();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'company';
  const [formData, setFormData] = useState<any>(companySettings || {});

  useEffect(() => {
    if (companySettings) {
      setFormData((prev: any) => ({ ...prev, ...companySettings }));
    }
  }, [companySettings]);

  const handleSaveCompanyInfo = async () => {
    try {
      await updateMutation.mutateAsync(formData);
    } catch (error) {
      // Mutation handles toast
    }
  };

  const updateSettingsList = async (newList: any) => {
    try {
      await updateMutation.mutateAsync({ ...formData, ...newList });
    } catch (error) {
      // Mutation handles toast
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#E8491F]" />
          <p className="text-gray-500 font-medium">Loading system settings...</p>
        </div>
      </div>
    );
  }


  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure system preferences and company information"
      />

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="company">Company Info</TabsTrigger>
          <TabsTrigger value="lists">Lists Management</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card className="bg-white border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Company Information</h3>
                <p className="text-sm text-gray-600">Update your company details and branding for compliance</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-reg">RC Number (Registration Number)</Label>
                  <Input
                    id="company-reg"
                    value={formData.rcNumber}
                    onChange={(e) => setFormData({ ...formData, rcNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Registered Business Address</Label>
                <Textarea
                  id="address"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">Company Email</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tin-number" className="after:content-['*'] after:ml-0.5 after:text-red-500">TIN Number (Taxpayer Identification Number)</Label>
                  <Input
                    id="tin-number"
                    value={formData.tin}
                    onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                    className="max-w-[50%]"
                  />
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-6">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Financial Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vat">Default VAT Percentage (%)</Label>
                    <Input
                      id="vat"
                      type="number"
                      step="0.1"
                      value={formData.vatPercentage}
                      onChange={(e) => setFormData({ ...formData, vatPercentage: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount">Default Discount Value</Label>
                    <div className="flex gap-2">
                      <Input
                        id="discount"
                        type="number"
                        value={formData.defaultDiscountValue}
                        onChange={(e) => setFormData({ ...formData, defaultDiscountValue: parseFloat(e.target.value) || 0 })}
                        className="flex-1"
                      />
                      <Select
                        value={formData.defaultDiscountType}
                        onValueChange={(v: any) => setFormData({ ...formData, defaultDiscountType: v })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Percentage">%</SelectItem>
                          <SelectItem value="Fixed">Fixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="flex justify-end gap-2 text-primary">
                <Button type="button" variant="outline" onClick={() => setFormData({ ...companySettings })}>Reset</Button>
                <Button type="button" onClick={handleSaveCompanyInfo} className="bg-[#0D0D0D] hover:bg-[#1A1A1A]">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="lists">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ListCard
              title="Laboratories"
              description="Manage the list of testing laboratories"
              items={formData.laboratories || []}
              onAdd={async (newItem) => {
                const updated = [...(formData.laboratories || []), newItem];
                setFormData((prev: any) => ({ ...prev, laboratories: updated }));
                await updateSettingsList({ laboratories: updated });
              }}
              onRemove={async (index) => {
                const updated = (formData.laboratories || []).filter((_: any, i: number) => i !== index);
                setFormData((prev: any) => ({ ...prev, laboratories: updated }));
                await updateSettingsList({ laboratories: updated });
              }}

            />
            <ListCard
              title="Inspection Types"
              description="Manage the list of inspection categories"
              items={formData.inspectionTypes || []}
              onAdd={async (newItem) => {
                const updated = [...(formData.inspectionTypes || []), newItem];
                setFormData((prev: any) => ({ ...prev, inspectionTypes: updated }));
                await updateSettingsList({ inspectionTypes: updated });
              }}
              onRemove={async (index) => {
                const updated = (formData.inspectionTypes || []).filter((_: any, i: number) => i !== index);
                setFormData((prev: any) => ({ ...prev, inspectionTypes: updated }));
                await updateSettingsList({ inspectionTypes: updated });
              }}

            />
            <ListCard
              title="Equipment/Machines"
              description="Manage the list of crushers and equipment"
              items={formData.machines || []}
              onAdd={async (newItem) => {
                const updated = [...(formData.machines || []), newItem];
                setFormData((prev: any) => ({ ...prev, machines: updated }));
                await updateSettingsList({ machines: updated });
              }}
              onRemove={async (index) => {
                const updated = (formData.machines || []).filter((_: any, i: number) => i !== index);
                setFormData((prev: any) => ({ ...prev, machines: updated }));
                await updateSettingsList({ machines: updated });
              }}

            />
            <ListCard
              title="Vehicles"
              description="Manage the list of authorized vehicles"
              items={formData.vehicles || []}
              onAdd={async (newItem) => {
                const updated = [...(formData.vehicles || []), newItem];
                setFormData((prev: any) => ({ ...prev, vehicles: updated }));
                await updateSettingsList({ vehicles: updated });
              }}
              onRemove={async (index) => {
                const updated = (formData.vehicles || []).filter((_: any, i: number) => i !== index);
                setFormData((prev: any) => ({ ...prev, vehicles: updated }));
                await updateSettingsList({ vehicles: updated });
              }}

            />
            <ListCard
              title="Material Types"
              description="Manage the list of mineral and material types"
              items={formData.materialTypes || []}
              onAdd={async (newItem) => {
                const updated = [...(formData.materialTypes || []), newItem];
                setFormData((prev: any) => ({ ...prev, materialTypes: updated }));
                await updateSettingsList({ materialTypes: updated });
              }}
              onRemove={async (index) => {
                const updated = (formData.materialTypes || []).filter((_: any, i: number) => i !== index);
                setFormData((prev: any) => ({ ...prev, materialTypes: updated }));
                await updateSettingsList({ materialTypes: updated });
              }}

            />
            <ListCard
              title="Inspectors"
              description="Manage the list of registered inspectors"
              items={formData.inspectors || []}
              onAdd={async (newItem) => {
                const updated = [...(formData.inspectors || []), newItem];
                setFormData((prev: any) => ({ ...prev, inspectors: updated }));
                await updateSettingsList({ inspectors: updated });
              }}
              onRemove={async (index) => {
                const updated = (formData.inspectors || []).filter((_: any, i: number) => i !== index);
                setFormData((prev: any) => ({ ...prev, inspectors: updated }));
                await updateSettingsList({ inspectors: updated });
              }}

            />
            <ListCard
              title="Destinations"
              description="Manage delivery and shipping destinations"
              items={formData.destinations || []}
              onAdd={async (newItem) => {
                const updated = [...(formData.destinations || []), newItem];
                setFormData((prev: any) => ({ ...prev, destinations: updated }));
                await updateSettingsList({ destinations: updated });
              }}
              onRemove={async (index) => {
                const updated = (formData.destinations || []).filter((_: any, i: number) => i !== index);
                setFormData((prev: any) => ({ ...prev, destinations: updated }));
                await updateSettingsList({ destinations: updated });
              }}

            />
            <ListCard
              title="Warehouses"
              description="Manage storage locations and bays"
              items={formData.warehouses || []}
              onAdd={async (newItem) => {
                const updated = [...(formData.warehouses || []), newItem];
                setFormData((prev: any) => ({ ...prev, warehouses: updated }));
                await updateSettingsList({ warehouses: updated });
              }}
              onRemove={async (index) => {
                const updated = (formData.warehouses || []).filter((_: any, i: number) => i !== index);
                setFormData((prev: any) => ({ ...prev, warehouses: updated }));
                await updateSettingsList({ warehouses: updated });
              }}
            />
            <ListCard
              title="Salespersons / Client Handlers"
              description="Manage the list of staff handling clients"
              items={formData.salesPersons || []}
              onAdd={async (newItem) => {
                const current = formData.salesPersons || [];
                if (current.includes(newItem)) {
                  toast.error('Salesperson already exists');
                  return;
                }
                const updated = [...current, newItem];
                // Update local state for immediate feedback
                setFormData((prev: any) => ({ ...prev, salesPersons: updated }));
                // Persist to backend
                try {
                  await updateMutation.mutateAsync({ ...formData, salesPersons: updated });
                } catch (error) {
                  // Revert on error
                  setFormData((prev: any) => ({ ...prev, salesPersons: current }));
                }
              }}
              onRemove={async (index) => {
                const current = formData.salesPersons || [];
                const updated = current.filter((_: any, i: number) => i !== index);
                // Update local state for immediate feedback
                setFormData((prev: any) => ({ ...prev, salesPersons: updated }));
                // Persist to backend
                try {
                  await updateMutation.mutateAsync({ ...formData, salesPersons: updated });
                } catch (error) {
                  // Revert on error
                  setFormData((prev: any) => ({ ...prev, salesPersons: current }));
                }
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="bg-white border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
                <p className="text-sm text-gray-600">Manage your notification settings</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Quality Alert Notifications</p>
                  <p className="text-sm text-gray-600">Receive alerts when quality tests fail</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dispatch Notifications</p>
                  <p className="text-sm text-gray-600">Get notified when shipments are dispatched</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Invoice Reminders</p>
                  <p className="text-sm text-gray-600">Receive reminders for pending invoices</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Inventory Alerts</p>
                  <p className="text-sm text-gray-600">Get alerts when inventory is low</p>
                </div>
                <Switch />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Digest</p>
                  <p className="text-sm text-gray-600">Receive daily summary via email</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator className="my-6" />

              <div className="flex justify-end gap-2 text-primary">
                <Button type="button" variant="outline">Reset to Default</Button>
                <Button type="button">Save Preferences</Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="bg-white border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Security Settings</h3>
                <p className="text-sm text-gray-600">Manage security and access controls</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
                <Switch />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Session Timeout</p>
                  <p className="text-sm text-gray-600">Auto logout after 30 minutes of inactivity</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div>
                <p className="font-medium mb-3">Change Password</p>
                <div className="space-y-3 max-w-md">
                  <Input type="password" placeholder="Current Password" />
                  <Input type="password" placeholder="New Password" />
                  <Input type="password" placeholder="Confirm New Password" />
                  <Button type="button" size="sm">Update Password</Button>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="flex justify-end gap-2 text-primary">
                <Button type="button" variant="outline">Cancel</Button>
                <Button type="button">Save Settings</Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card className="bg-white border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">System Configuration</h3>
                <p className="text-sm text-gray-600">Advanced system settings and integrations</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label htmlFor="timezone">Default Timezone</Label>
                <Input id="timezone" defaultValue="Asia/Kolkata (IST)" className="mt-2 max-w-md" />
              </div>

              <Separator />

              <div>
                <Label htmlFor="currency">Default Currency</Label>
                <Select
                  value={formData.currency || 'AED'}
                  onValueChange={(v: CurrencyCode) => setFormData({ ...formData, currency: v })}
                >
                  <SelectTrigger className="mt-2 max-w-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(currencies).map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} ({c.symbol}) - {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <Label htmlFor="date-format">Date Format</Label>
                <Input id="date-format" defaultValue="YYYY-MM-DD" className="mt-2 max-w-md" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Automatic Backup</p>
                  <p className="text-sm text-gray-600">Enable daily automated database backups</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              <div>
                <p className="font-medium mb-2">System Information</p>
                <div className="bg-gray-50 p-4 rounded-md text-sm space-y-1">
                  <p className="text-gray-600">Version: 2.4.1</p>
                  <p className="text-gray-600">Last Updated: February 1, 2026</p>
                  <p className="text-gray-600">Database Size: 2.8 GB</p>
                  <p className="text-gray-600">License: Enterprise</p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="flex justify-end gap-2 text-primary">
                <Button type="button" variant="outline" onClick={() => setFormData({ ...companySettings })}>Reset System</Button>
                <Button type="button" onClick={handleSaveCompanyInfo} className="bg-[#0D0D0D] hover:bg-[#1A1A1A]">
                  <Save className="h-4 w-4 mr-2" />
                  Apply Changes
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ListCard({ title, description, items, onAdd, onRemove }: {
  title: string;
  description: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
}) {
  const [newItem, setNewItem] = useState('');

  return (
    <Card className="bg-white border border-gray-200 p-6 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
          <ListTodo className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Add new..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newItem.trim()) {
              onAdd(newItem.trim());
              setNewItem('');
            }
          }}
        />
        <Button
          type="button"
          size="icon"
          className="bg-[#0D0D0D]"
          onClick={() => {
            if (newItem.trim()) {
              onAdd(newItem.trim());
              setNewItem('');
            }
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-100">
            <span className="text-sm">{item}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-red-500"
              onClick={() => onRemove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-4 italic">No items yet</p>
        )}
      </div>
    </Card>
  );
}
