import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { FileDown, FileText, BarChart3 } from 'lucide-react';

const reportTypes = [
  { id: 1, name: 'Throughput Report', description: 'Analysis of material intake, processing, and export volumes', icon: BarChart3 },
  { id: 2, name: 'Revenue Report', description: 'Financial performance and revenue breakdown by client', icon: FileText },
  { id: 3, name: 'Cost Analysis', description: 'Detailed operational cost breakdown and variance analysis', icon: BarChart3 },
  { id: 4, name: 'Client Activity Report', description: 'Client-wise shipment and order summary', icon: FileText },
  { id: 5, name: 'Shipment Summary', description: 'Comprehensive shipment tracking and delivery performance', icon: BarChart3 },
  { id: 6, name: 'Quality Assurance Report', description: 'Test results and quality metrics summary', icon: FileText },
];

export function Reports() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate and export comprehensive operational and financial reports"
      />

      <Card className="bg-white border border-gray-200 p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Generate Custom Report</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input id="start-date" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input id="end-date" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier-filter">Company</Label>
            <Select>
              <SelectTrigger id="supplier-filter">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                <SelectItem value="abc">ABC Mining Ltd.</SelectItem>
                <SelectItem value="xyz">XYZ Materials Co.</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-filter">Client</Label>
            <Select>
              <SelectTrigger id="client-filter">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="global">Global Industries Ltd</SelectItem>
                <SelectItem value="euro">Euro Minerals GmbH</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mineral-filter">Mineral Type</Label>
            <Select>
              <SelectTrigger id="mineral-filter">
                <SelectValue placeholder="All Minerals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Minerals</SelectItem>
                <SelectItem value="feldspar">Feldspar</SelectItem>
                <SelectItem value="quartz">Quartz</SelectItem>
                <SelectItem value="kaolin">Kaolin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="p-5 bg-white border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{report.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <FileDown className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileDown className="h-4 w-4 mr-1" />
                      Excel
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
