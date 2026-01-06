import React, { useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getAffiliateInsights, Affiliate } from '@/api/affiliatesApi';
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
} from 'recharts';
import { Loader2, TrendingUp, Users, DollarSign, Award } from 'lucide-react';
import { format } from 'date-fns';

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
  const { data: insights, isLoading } = useQuery({
    queryKey: ['affiliateInsights', affiliate?.id],
    queryFn: () => getAffiliateInsights(affiliate!.id),
    enabled: !!affiliate && open,
  });

  const chartData = useMemo(() => {
    if (!insights?.impact_chart) return [];
    return insights.impact_chart.map(item => ({
      ...item,
      formattedDate: format(new Date(item.date), 'MMM dd'),
    }));
  }, [insights]);

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
                  <SheetTitle className="text-xl font-bold">{affiliate.name}</SheetTitle>
                  <SheetDescription>
                    Affiliate Performance & Commission Insights
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-sm text-muted-foreground font-medium">Calculating influencer data...</p>
              </div>
            ) : insights ? (
              <div className="space-y-6">
                {/* Summary Stats GRID */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-none bg-slate-50 shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2 text-slate-500">
                        <Users className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Referrals</span>
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
                        <span className="text-xs font-medium uppercase tracking-wider">Earnings</span>
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
                        <p className="text-blue-100 text-xs font-medium uppercase tracking-wider mb-1">Generated Revenue</p>
                        <h3 className="text-2xl font-bold">${insights.summary.total_revenue.toLocaleString()}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-100 text-xs font-medium uppercase tracking-wider mb-1">Commission Type</p>
                        <p className="font-semibold capitalize text-sm">
                          {insights.summary.commission_type === 'flat' 
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
                            <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
                              backgroundColor: '#fff', 
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              fontSize: '12px',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
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
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Referral Breakdown</h4>
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium">Influencer Campaign</span>
                    </div>
                    <span className="text-sm font-bold">{insights.summary.total_referrals} Units</span>
                  </div>
                </div>
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
