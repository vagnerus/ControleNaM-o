
"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

type ChartDataItem = {
  id: string;
  name: string;
  amount: number;
  icon?: string;
  fill: string;
};

type CategoryChartProps = {
    data: ChartDataItem[];
    config: ChartConfig;
}

export function CategoryChart({ data, config }: CategoryChartProps) {
  
  const totalAmount = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.amount, 0)
  }, [data])

  if (!data.length) {
    return (
        <div className="h-60 w-full flex items-center justify-center">
            <p className="text-muted-foreground">Sem dados de despesas para exibir.</p>
        </div>
    )
  }

  return (
    <ChartContainer
      config={config}
      className="mx-auto aspect-square max-h-[400px]"
    >
      <PieChart>
        <ChartTooltip
            cursor={false}
            content={
                <ChartTooltipContent 
                    hideLabel 
                    nameKey="name"
                    formatter={(value, name) => {
                        const formattedValue = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value as number);
                        const percentage = totalAmount ? ((value as number / totalAmount) * 100).toFixed(0) : 0;
                        return (
                            <div className="flex flex-col gap-0.5">
                                <div className="font-medium">{name}</div>
                                <div className="text-muted-foreground">
                                    {formattedValue} ({percentage}%)
                                </div>
                            </div>
                        );
                    }}
                />
            }
        />
        <Pie
          data={data}
          dataKey="amount"
          nameKey="name"
          innerRadius={60}
          strokeWidth={5}
        >
            {data.map((entry, index) => (
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

    