"use client";

import { useState, useEffect } from "react";
import type { Candidate } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { HiringMetricsChart } from "./hiring-metrics-chart";
import { FlowAnalysis } from "./flow-analysis";

export default function IndicatorsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "candidates"), orderBy("lastUpdate", "desc"));
      const querySnapshot = await getDocs(q);
      const candidatesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
      setCandidates(candidatesData);
    } catch (error) {
        console.error("Error fetching candidates: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao buscar candidatos",
            description: "Não foi possível carregar a lista de candidatos para os indicadores.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  if (isLoading) {
    return (
        <div className="flex flex-1 items-center justify-center p-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Carregando indicadores...</p>
        </div>
    )
  }

  return (
    <div className="grid gap-6">
      <HiringMetricsChart candidates={candidates} />
      <FlowAnalysis candidates={candidates} />
    </div>
  );
}
