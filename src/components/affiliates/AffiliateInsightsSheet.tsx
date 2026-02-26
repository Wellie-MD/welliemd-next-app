import React, { useMemo, useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import {
  getAffiliateInsights,
  getAffiliatePatientCommissions,
  Affiliate,
  PatientCommission,
} from "@/api/affiliatesApi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Loader2,
  TrendingUp,
  Users,
  DollarSign,
  Award,
  CalendarIcon,
} from "lucide-react";
import { format, subDays } from "date-fns";

interface AffiliateInsightsSheetProps {
  affiliate: Affiliate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AffiliateInsightsSheet({
  affiliate,
  open,
  onOpenChange,
}: AffiliateInsightsSheetProps) {
  // Date range state
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);

  // Sorting state for affiliate commissions table
  const [sortConfig, setSortConfig] = useState<{
    key: keyof PatientCommission;
    direction: "asc" | "desc";
  }>({ key: "created_at", direction: "desc" });

  const { data: insights, isLoading } = useQuery({
    queryKey: ["affiliateInsights", affiliate?.id, dateRange],
    queryFn: () =>
      getAffiliateInsights(affiliate!.id, {
        start_date: format(dateRange.from, "yyyy-MM-dd"),
        end_date: format(dateRange.to, "yyyy-MM-dd"),
      }),
    enabled: !!affiliate && open,
  });

  const { data: patientCommissionsData, isLoading: commissionsLoading } =
    useQuery({
      queryKey: ["affiliatePatientCommissions", affiliate?.id, dateRange, currentPage],
      queryFn: () =>
        getAffiliatePatientCommissions(affiliate!.id, {
          start_date: format(dateRange.from, "yyyy-MM-dd"),
          end_date: format(dateRange.to, "yyyy-MM-dd"),
          page: currentPage,
          page_size: pageSize,
        }),
      enabled: !!affiliate && open,
    });

  const patientCommissions = patientCommissionsData?.results || [];
  const totalCount = patientCommissionsData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Reset to page 1 when date range changes
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange]);

  const chartData = useMemo(() => {
    if (!insights?.impact_chart) return [];
    return insights.impact_chart.map((item) => ({
      ...item,
      formattedDate: format(new Date(item.date), "MMM dd"),
    }));
  }, [insights]);

  // Sorting logic for affiliate commissions
  const handleSort = (key: keyof PatientCommission) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedCommissions = useMemo(() => {
    const sorted = [...patientCommissions];
    sorted.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });
    return sorted;
  }, [patientCommissions, sortConfig]);

  const getSortIcon = (key: keyof PatientCommission) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  };

  if (!affiliate) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg w-full p-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            <SheetHeader className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-bold">
                    {affiliate.name}
                  </SheetTitle>
                  <SheetDescription>
                    Affiliate Performance & Commission Insights
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {/* Date Range Picker */}
            <Card className="border shadow-sm mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Date Range</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[280px] justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(dateRange.from, "MMM dd, yyyy")} -{" "}
                        {format(dateRange.to, "MMM dd, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range) => {
                          // Check if range exists at all
                          if (range) {
                            // Update state even if range.to is still undefined
                            setDateRange({
                              from: range.from || new Date(), // Fallback to now if undefined
                              to: range.to || range.from || new Date(), // Fallback to 'from' while picking
                            });
                          }
                        }}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-sm text-muted-foreground font-medium">
                  Calculating influencer data...
                </p>
              </div>
            ) : insights ? (
              <div className="space-y-6">
                {/* Summary Stats GRID */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-none bg-slate-50 shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2 text-slate-500">
                        <Users className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">
                          Referrals
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-slate-900">
                        {insights.summary.total_referrals}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none bg-blue-50 shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2 text-blue-600">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">
                          Earnings
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">
                        ${insights.summary.total_commission.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Total Revenue & Rate */}
                <Card className="border shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-blue-100 text-xs font-medium uppercase tracking-wider mb-1">
                          Generated Revenue
                        </p>
                        <h3 className="text-2xl font-bold">
                          ${insights.summary.total_revenue.toLocaleString()}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-100 text-xs font-medium uppercase tracking-wider mb-1">
                          Commission Type
                        </p>
                        <p className="font-semibold capitalize text-sm">
                          {insights.summary.commission_type === "flat"
                            ? `$${insights.summary.commission_value} Flat`
                            : `${insights.summary.commission_value}% Percent`}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Performance Chart */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Earnings Trend
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient
                              id="colorComm"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#3b82f6"
                                stopOpacity={0.1}
                              />
                              <stop
                                offset="95%"
                                stopColor="#3b82f6"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f1f5f9"
                          />
                          <XAxis
                            dataKey="formattedDate"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            stroke="#94a3b8"
                          />
                          <YAxis
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            stroke="#94a3b8"
                            tickFormatter={(value) => `$${value}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#fff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              fontSize: "12px",
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="commission"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorComm)"
                            name="Commission"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Breakdown */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Referral Breakdown
                  </h4>
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium">
                        Influencer Campaign
                      </span>
                    </div>
                    <span className="text-sm font-bold">
                      {insights.summary.total_referrals} Units
                    </span>
                  </div>
                </div>

                {/* Affiliate Commissions Table */}
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      Affiliate Commissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {commissionsLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      </div>
                    ) : sortedCommissions.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No affiliate commissions found for this date range
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead
                                  className="cursor-pointer hover:bg-muted/50"
                                  onClick={() => handleSort("display_id")}
                                >
                                  Order ID{getSortIcon("display_id")}
                                </TableHead>
                                <TableHead
                                  className="cursor-pointer hover:bg-muted/50"
                                  onClick={() => handleSort("patient_name")}
                                >
                                  Patient Name{getSortIcon("patient_name")}
                                </TableHead>
                                <TableHead
                                  className="cursor-pointer hover:bg-muted/50"
                                  onClick={() => handleSort("commission")}
                                >
                                  Commission{getSortIcon("commission")}
                                </TableHead>
                                <TableHead
                                  className="cursor-pointer hover:bg-muted/50"
                                  onClick={() => handleSort("status")}
                                >
                                  Status{getSortIcon("status")}
                                </TableHead>
                                <TableHead
                                  className="cursor-pointer hover:bg-muted/50"
                                  onClick={() => handleSort("created_at")}
                                >
                                  Created At{getSortIcon("created_at")}
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sortedCommissions.map((item) => (
                                <TableRow key={item.order_id}>
                                  <TableCell className="font-medium">
                                    {item.business_order_id ? (
                                      <span className="text-blue-600">{item.business_order_id}</span>
                                    ) : (
                                      item.display_id
                                    )}
                                  </TableCell>
                                  <TableCell>{item.patient_name}</TableCell>
                                  <TableCell>
                                    $
                                    {item.commission.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </TableCell>
                                  <TableCell>
                                    <span
                                      className={
                                        item.status === "earned"
                                          ? "inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                                          : item.status === "pending"
                                          ? "inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                                          : "inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700"
                                      }
                                    >
                                      {item.status === "earned"
                                        ? "Earned"
                                        : item.status === "pending"
                                        ? "Pending"
                                        : "Cancelled"}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {format(
                                      new Date(item.created_at),
                                      "MMM dd, yyyy",
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between px-4 py-3 border-t">
                          <div className="text-sm text-muted-foreground">
                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} records
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </Button>
                            <div className="text-sm">
                              Page {currentPage} of {totalPages}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                No data available for this influencer.
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
