import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, AlertCircle, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { clientApi } from "@/api/clientApi";
import type { InvoiceType } from "@/types/b2bBilling";

interface B2BInvoiceListProps {
  clientId: string;
}

export function B2BInvoiceList({ clientId }: B2BInvoiceListProps) {
  const [invoiceType, setInvoiceType] = useState<InvoiceType | "all">("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ["b2bInvoices", clientId, invoiceType, page],
    queryFn: () =>
      clientApi.getB2BInvoices(
        clientId,
        invoiceType === "all" ? undefined : invoiceType,
        {
          page,
          page_size: pageSize,
          ordering: "-issued_at",
        }
      ),
    enabled: !!clientId,
  });

  const invoices = data?.results || [];
  const formatBreakdown = (inv: any) => {
    const items = inv.line_items ?? [];
    const pharmacy = items
      .filter((li: any) => ["medication_reimbursement", "shipping_cost"].includes(li.item_type))
      .reduce(
        (sum: number, li: any) =>
          sum + parseFloat(li.total_amount || li.unit_price || 0),
        0
      );
    const consult = items
      .filter((li: any) => li.item_type === "consultation")
      .reduce(
        (sum: number, li: any) =>
          sum + parseFloat(li.total_amount || li.unit_price || 0),
        0
      );
    if (!pharmacy && !consult) return "-";
    return `Pharmacy: $${pharmacy.toFixed(2)} · Consult: $${consult.toFixed(2)}`;
  };
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default";
      case "overdue":
      case "failed":
        return "destructive";
      case "pending":
      case "due":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getInvoiceTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "reimbursement":
        return "default";
      case "saas_fee":
        return "secondary";
      case "aggregated_snapshot":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              B2B Invoices
            </CardTitle>
            <CardDescription>
              Platform billing invoices for this client
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={invoiceType}
              onValueChange={(value) => {
                setInvoiceType(value as InvoiceType | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="reimbursement">Reimbursement</SelectItem>
                <SelectItem value="saas_fee">SaaS Fee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load invoices. Please try again later.
            </AlertDescription>
          </Alert>
        ) : invoices.length === 0 ? (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              No invoices found
              {invoiceType !== "all" && ` for type: ${invoiceType}`}.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Breakdown</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued Date</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const statusLabel =
                      (invoice as any).is_overdue && invoice.status !== "paid"
                        ? "overdue"
                        : invoice.status;
                    return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getInvoiceTypeBadgeVariant(invoice.invoice_type)}>
                          {invoice.invoice_type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${parseFloat(invoice.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatBreakdown(invoice)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(statusLabel)}>
                          {statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(invoice.issued_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(invoice.due_date)}
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, totalCount)} of {totalCount} invoices
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
