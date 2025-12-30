"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"
import { getCategoryByName } from "@/lib/data"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useMemo } from "react"

type CategoryChartProps = {
    data: Record<string, number>
}

export function CategoryChart({ data }: CategoryChartProps) {
  const { chartData, chartConfig } = useMemo(() => {
    const chartData = Object.entries(data).map(([category, amount]) => ({
      category,
      amount,
      fill: `hsl(var(--chart-${Object.keys(data).indexOf(category) + 1}))`,
    }));

    const chartConfig = chartData.reduce((acc, { category, fill }) => {
      const categoryInfo = getCategoryByName(category);
      acc[category] = {
        label: category,
        color: fill,
        icon: categoryInfo?.icon,
      };
      return acc;
    }, {} as ChartConfig);

    return { chartData, chartConfig };
  }, [data]);
  
  const totalAmount = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.amount, 0)
  }, [chartData])


  if (!chartData.length) {
    return (
        <div className="h-60 w-full flex items-center justify-center">
            <p className="text-muted-foreground">Sem dados de despesas para exibir.</p>
        </div>
    )
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[250px]"
    >
      <PieChart>
        <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="amount"
          nameKey="category"
          innerRadius={60}
          strokeWidth={5}
        >
            {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
        </Pie>
         <ChartLegend
            content={<ChartLegendContent nameKey="category" />}
            className="-translate-y-[2rem] flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  )
}
