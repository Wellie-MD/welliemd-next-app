import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/features/treatments/common/components";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { VisitTypeProduct } from "@/features/treatments/libraries/data/visitTypeProducts.mock";

interface VisitTypeProductsTableProps {
  products: VisitTypeProduct[];
  onEditProduct?: (productId: string) => void;
}

export function VisitTypeProductsTable({ products, onEditProduct }: VisitTypeProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-400">
        No products configured for this visit type yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Product</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dose</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Titration</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="group hover:bg-slate-50/50">
              <TableCell className="font-semibold text-slate-800">{product.name}</TableCell>
              <TableCell className="text-slate-600">{product.dose}</TableCell>
              <TableCell className="text-slate-600">{product.titration}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  <StatusPill tone={product.status === "active" ? "green" : "yellow"}>
                    {product.status === "active" ? "Active" : "Draft"}
                  </StatusPill>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 opacity-0 transition-opacity hover:text-[#12517A] group-hover:opacity-100"
                    title="Edit product"
                    onClick={() => onEditProduct?.(product.id)}
                    data-testid={`visit-type-product-edit-${product.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
