"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import CreateClientForm from "@/components/clients/CreateClientForm"

const mockClients = [
  {
    domain: "raerx.nimbusrx.io",
    portal: "app.raerx.com",
    status: "Active",
    database: "rae_rx",
    host: "db1",
    created: "26 Aug 2025",
  },
  {
    domain: "startzion.nimbusrx.io",
    portal: "portal.startzion.com",
    status: "Active",
    database: "start_zion_",
    host: "db1",
    created: "23 Aug 2025",
  },
  {
    domain: "md-weightlossrx.nimbusrx.io",
    portal: "portal.md-weightlossrx.com",
    status: "Active",
    database: "md_weightloss_rx",
    host: "db1",
    created: "22 Aug 2025",
  },
]

export default function Clients() {
  const [clients, setClients] = useState(mockClients)

  const handleDelete = (domain: string) => {
    const confirmDelete = window.confirm(`Delete client "${domain}"?`)
    if (!confirmDelete) return
    setClients(clients.filter((c) => c.domain !== domain))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Clients</h2>
        <CreateClientForm
          onCreate={(newClient) => {
            setClients((prev) => [
              ...prev,
              {
                domain: newClient.domain,
                portal: newClient.portal || newClient.domain,
                status: "Active",
                database: newClient.database,
                host: newClient.host,
                created: new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                }),
              },
            ])
          }}
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-muted text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Domain</th>
              <th className="px-4 py-3">Patient Portal Domain</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Database</th>
              <th className="px-4 py-3">Database Host</th>
              <th className="px-4 py-3">Created At</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2">{client.domain}</td>
                <td className="px-4 py-2">{client.portal}</td>
                <td className="px-4 py-2 text-green-600 flex items-center gap-2">
                  {client.status}
                  <Pencil className="w-3 h-3 cursor-pointer" />
                </td>
                <td className="px-4 py-2">{client.database}</td>
                <td className="px-4 py-2">{client.host}</td>
                <td className="px-4 py-2">{client.created}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-3">
                    <Pencil className="h-4 w-4 cursor-pointer" />
                    <Trash2
                      className="h-4 w-4 text-red-500 cursor-pointer"
                      onClick={() => handleDelete(client.domain)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
