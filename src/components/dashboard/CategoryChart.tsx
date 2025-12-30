
"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"
import { getIconComponent } from "@/lib/data"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useMemo } from "react"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import type { Category } from "@/lib/types"

type CategoryChartProps = {
    data: Record<string, number>
}

export function CategoryChart({ data }: CategoryChartProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const categoriesQuery = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'categories') : null
  , [firestore, user]);
  const { data: categories } = useCollection<Category>(categoriesQuery);

  const { chartData, chartConfig } = useMemo(() => {
    if (!categories) return { chartData: [], chartConfig: {} };

    const chartData = Object.entries(data).map(([categoryId, amount]) => {
      const category = categories.find(c => c.id === categoryId);
      return {
        id: categoryId,
        name: category?.name || 'Desconhecido',
        amount,
        icon: category?.icon,
        fill: `hsl(var(--chart-${(categories.findIndex(c => c.id === categoryId) % 5) + 1}))`,
      };
    });

    const chartConfig = chartData.reduce((acc, { name, fill, icon }) => {
      acc[name] = {
        label: name,
        color: fill,
        icon: icon ? getIconComponent(icon) : undefined,
      };
      return acc;
    }, {} as ChartConfig);

    return { chartData, chartConfig };
  }, [data, categories]);
  
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
            content={<ChartTooltipContent hideLabel nameKey="name" />}
        />
        <Pie
          data={chartData}
          dataKey="amount"
          nameKey="name"
          innerRadius={60}
          strokeWidth={5}
        >
            {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
        </Pie>
         <ChartLegend
            content={<ChartLegendContent nameKey="name" />}
            className="-translate-y-[2rem] flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  )
}
