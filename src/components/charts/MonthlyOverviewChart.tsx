
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

export type MonthlyData = {
    month: string;
    income: number;
    expenses: number;
};

const chartConfig = {
  income: {
    label: "Receitas",
    color: "hsl(var(--chart-2))",
  },
  expenses: {
    label: "Despesas",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

type MonthlyOverviewChartProps = {
    data: MonthlyData[];
};

export function MonthlyOverviewChart({ data }: MonthlyOverviewChartProps) {
    if (!data.length) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <p className="text-muted-foreground">Sem dados de desempenho para exibir.</p>
            </div>
        )
    }

  return (
    <ChartContainer config={chartConfig} className="w-full h-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis 
            tickFormatter={(value) => `R$ ${value / 1000}k`}
        />
        <ChartTooltip
          content={<ChartTooltipContent />}
          cursor={false}
        />
         <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="income" fill="var(--color-income)" radius={4} />
        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
