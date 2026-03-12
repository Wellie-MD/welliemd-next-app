"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

interface Column {
  key: string
  label: string
}

interface DataTableProps {
  title: string
  data: any[]
  columns: Column[]
}

export function DataTable({ title, data, columns }: DataTableProps) {
  const navigate = useNavigate()

  return (
    <Card className="rounded-2xl border-border/70 bg-gradient-to-br from-primary/5 via-background to-blue-50/30 shadow-sm w-full">
      <CardHeader className="flex flex-row items-start justify-between">
        <CardTitle className="text-gray-800">{title}</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700"
          onClick={() => navigate("/dashboard/orders")}
        >
          View All
        </Button>
      </CardHeader>
      <CardContent className="w-full">
        <div className="max-w-full overflow-x-visible w-full">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-gray-200">
                {columns.map((column) => (
                  <TableHead key={column.key} className="font-medium text-xs text-gray-600 bg-gray-50 text-nowrap px-2">
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index} className="border-gray-100">
                  {columns.map((column) => (
                    <TableCell key={column.key} className="text-xs text-gray-800 text-nowrap px-2">
                      {column.key === "orderNumber" ? (
                        <span className="text-blue-600 underline cursor-pointer">{row[column.key]}</span>
                      ) : (
                        row[column.key]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
