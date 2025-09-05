import { useState } from "react";
import { FileText, Download, Eye, Upload, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface MedicalRecord {
  id: number;
  title: string;
  type: string;
  date: string;
  doctor: string;
  size: string;
  description?: string;
  category: 'lab-results' | 'imaging' | 'reports' | 'prescriptions' | 'other';
}

export default function MedicalRecords() {
  const [searchTerm, setSearchTerm] = useState("");
  const [records] = useState<MedicalRecord[]>([
    {
      id: 1,
      title: "Blood Test Results",
      type: "PDF",
      date: "2024-12-20",
      doctor: "Dr. Sarah Johnson",
      size: "245 KB",
      description: "Complete blood count and lipid panel",
      category: "lab-results"
    },
    {
      id: 2,
      title: "Chest X-Ray",
      type: "DICOM",
      date: "2024-12-18",
      doctor: "Dr. Michael Chen",
      size: "12.3 MB",
      description: "Routine chest imaging",
      category: "imaging"
    },
    {
      id: 3,
      title: "Cardiology Consultation Report",
      type: "PDF",
      date: "2024-12-15",
      doctor: "Dr. Sarah Johnson",
      size: "156 KB",
      description: "Follow-up consultation and treatment plan",
      category: "reports"
    },
    {
      id: 4,
      title: "Prescription - Lisinopril",
      type: "PDF",
      date: "2024-12-10",
      doctor: "Dr. Emily Rodriguez",
      size: "89 KB",
      description: "Blood pressure medication prescription",
      category: "prescriptions"
    },
    {
      id: 5,
      title: "MRI Scan - Knee",
      type: "DICOM",
      date: "2024-12-05",
      doctor: "Dr. David Wilson",
      size: "245 MB",
      description: "Right knee MRI following injury",
      category: "imaging"
    },
    {
      id: 6,
      title: "Annual Physical Exam",
      type: "PDF",
      date: "2024-11-28",
      doctor: "Dr. Emily Rodriguez",
      size: "324 KB",
      description: "Comprehensive annual health examination",
      category: "reports"
    }
  ]);

  const filteredRecords = records.filter(record =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRecordsByCategory = (category: string) => {
    return filteredRecords.filter(record => record.category === category);
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return 'bg-red-100 text-red-800';
      case 'dicom':
        return 'bg-blue-100 text-blue-800';
      case 'jpg':
      case 'png':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const RecordCard = ({ record }: { record: MedicalRecord }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-lg text-gray-900">{record.title}</h3>
                <Badge className={getTypeColor(record.type)}>{record.type}</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">{record.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{record.date}</span>
                <span>•</span>
                <span>{record.doctor}</span>
                <span>•</span>
                <span>{record.size}</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Medical Records</h1>
          <p className="text-gray-600">Access and manage your health documents</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search medical records..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Records ({filteredRecords.length})</TabsTrigger>
          <TabsTrigger value="lab-results">Lab Results ({getRecordsByCategory('lab-results').length})</TabsTrigger>
          <TabsTrigger value="imaging">Imaging ({getRecordsByCategory('imaging').length})</TabsTrigger>
          <TabsTrigger value="reports">Reports ({getRecordsByCategory('reports').length})</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions ({getRecordsByCategory('prescriptions').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <RecordCard key={record.id} record={record} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No records found</h3>
                <p className="text-gray-600">Try adjusting your search criteria.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="lab-results" className="space-y-4">
          {getRecordsByCategory('lab-results').map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </TabsContent>

        <TabsContent value="imaging" className="space-y-4">
          {getRecordsByCategory('imaging').map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {getRecordsByCategory('reports').map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-4">
          {getRecordsByCategory('prescriptions').map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}