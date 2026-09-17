import { useState, useMemo } from "react";
import { RotateCcw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

interface ArchivedClient {
  id: string;
  name: string;
  email: string;
  category: string;
  archivedAt: string;
  lastActive: string;
  assignedCoach: string;
}

const MOCK_ARCHIVED_CLIENTS: ArchivedClient[] = [
  {
    id: "cli-1",
    name: "Eleanor Vance",
    email: "eleanor.vance@example.com",
    category: "Chronic Care",
    archivedAt: "2026-07-05",
    lastActive: "May 12, 2026",
    assignedCoach: "Dr. Sarah Chen",
  },
  {
    id: "cli-2",
    name: "Marcus Thompson",
    email: "m.thompson@example.com",
    category: "Cardiovascular",
    archivedAt: "2026-06-30",
    lastActive: "June 15, 2026",
    assignedCoach: "Dr. James Wilson",
  },
  {
    id: "cli-3",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@example.com",
    category: "Preventative",
    archivedAt: "2026-06-12",
    lastActive: "May 28, 2026",
    assignedCoach: "Dr. Rachel Green",
  },
  {
    id: "cli-4",
    name: "Robert Martinez",
    email: "r.martinez@example.com",
    category: "Weight Management",
    archivedAt: "2026-05-20",
    lastActive: "April 30, 2026",
    assignedCoach: "Dr. Michael Park",
  },
  {
    id: "cli-5",
    name: "Lisa Thompson",
    email: "l.thompson@example.com",
    category: "Mental Health",
    archivedAt: "2026-04-15",
    lastActive: "March 22, 2026",
    assignedCoach: "Dr. Emily Foster",
  },
];

export default function ArchiveClientsTab() {
  const { toast } = useToast();
  const [archivedClients, setArchivedClients] = useState<ArchivedClient[]>(MOCK_ARCHIVED_CLIENTS);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return archivedClients;
    return archivedClients.filter(
      (client) =>
        client.name.toLowerCase().includes(q) ||
        client.email.toLowerCase().includes(q) ||
        client.category.toLowerCase().includes(q)
    );
  }, [archivedClients, searchQuery]);

  const handleRestore = (id: string, name: string) => {
    setArchivedClients((prev) => prev.filter((c) => c.id !== id));
    toast({
      title: "Client Restored",
      description: `${name} has been restored to the active clients list.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search archived clients..."
            className="pl-9 h-9 text-xs bg-white border-slate-200 rounded-lg shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Name</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Category</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Archived</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Last Active</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned Coach</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold">
                        {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900">{client.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{client.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-slate-50 text-slate-600 border-slate-200">
                      {client.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-500">{client.archivedAt}</TableCell>
                  <TableCell className="text-slate-500">{client.lastActive}</TableCell>
                  <TableCell className="text-slate-600">{client.assignedCoach}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleRestore(client.id, client.name)}
                    >
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      Restore
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-sm text-slate-500">
                  {searchQuery ? "No archived clients match your search." : "No archived clients found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
