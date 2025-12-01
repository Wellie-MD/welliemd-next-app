import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PharmacyPriorityManager } from "@/components/clients/PharmacyPriorityManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/api/axiosInstance";

interface Client {
  id: string;
  name: string;
}

export default function PharmacyPriority() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>(
    searchParams.get("client_id") || ""
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/clients/clients/");
      setClients(response.data.results || []);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setSearchParams({ client_id: clientId });
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pharmacy Priority Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage pharmacy priorities for clients. When multiple pharmacies serve the same state,
          the highest priority pharmacy will be selected.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Client</CardTitle>
          <CardDescription>Choose a client to manage their pharmacy priorities</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedClientId} onValueChange={handleClientChange}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a client..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClient && (
        <PharmacyPriorityManager clientId={selectedClient.id} clientName={selectedClient.name} />
      )}

      {!selectedClient && !loading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Select a client above to manage their pharmacy priorities
          </CardContent>
        </Card>
      )}
    </div>
  );
}
