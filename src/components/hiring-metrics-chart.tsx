"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { Candidate, Status } from "@/lib/types";
import { Activity } from "lucide-react";

const chartConfig = {
  days: {
    label: "Dias",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function HiringMetricsChart({ candidates }: { candidates: Candidate[] }) {
  const data = React.useMemo(() => {
    const durations: Record<string, number[]> = {};

    candidates.forEach((candidate) => {
      const sortedHistory = [...candidate.statusHistory].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      for (let i = 0; i < sortedHistory.length - 1; i++) {
        const currentStage = sortedHistory[i];
        const nextStage = sortedHistory[i + 1];

        // Ensure we are only calculating forward movement
        if (new Date(nextStage.date) > new Date(currentStage.date)) {
          const startDate = new Date(currentStage.date).getTime();
          const endDate = new Date(nextStage.date).getTime();
          const duration = (endDate - startDate) / (1000 * 60 * 60 * 24); // in days

          if (duration >= 0) {
            const stageName = `${currentStage.status} → ${nextStage.status}`;
            if (!durations[stageName]) {
              durations[stageName] = [];
            }
            durations[stageName].push(duration);
          }
        }
      }
    });

    const avgDurations = Object.keys(durations).map((stageName) => {
      const stageDurations = durations[stageName];
      const avg =
        stageDurations.reduce((acc, curr) => acc + curr, 0) /
        stageDurations.length;
      return {
        stage: stageName,
        days: parseFloat(avg.toFixed(1)),
      };
    }).sort((a,b) => a.days - b.days);

    return avgDurations;
  }, [candidates]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Activity />
            Métricas do Funil
        </CardTitle>
        <CardDescription>
          Tempo médio (em dias) que um candidato leva entre cada fase do processo seletivo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
            <ChartContainer config={chartConfig} className="min-h-64 w-full">
            <BarChart
                accessibilityLayer
                data={data}
                layout="vertical"
                margin={{
                  left: 10,
                  right: 10,
                }}
            >
                <CartesianGrid horizontal={false} />
                <YAxis
                    dataKey="stage"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.length > 30 ? `${value.slice(0, 30)}...` : value}
                    width={180}
                />
                <XAxis dataKey="days" type="number" />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                />
                <Bar dataKey="days" fill="var(--color-days)" radius={4}>
                </Bar>
            </BarChart>
            </ChartContainer>
        ) : (
            <div className="flex min-h-64 items-center justify-center text-muted-foreground">
                <p>Ainda não há dados suficientes para exibir as métricas.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
