"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2 } from "lucide-react";
import type { Candidate } from "@/lib/types";
import { analyzeCandidateFlow } from "@/ai/flows/candidate-flow-analysis";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export function FlowAnalysis({ candidates }: { candidates: Candidate[] }) {
  const [jobProfile, setJobProfile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState("");
  const [error, setError] = useState("");

  const handleAnalysis = async () => {
    if (!jobProfile.trim()) {
      setError("Por favor, descreva o perfil da vaga.");
      return;
    }
    setError("");
    setIsLoading(true);
    setInsights("");

    try {
      const candidateFlowData = JSON.stringify(
        candidates.map(c => ({
            id: c.id,
            statusHistory: c.statusHistory,
        }))
      );

      const result = await analyzeCandidateFlow({
        candidateFlowData,
        jobProfile,
      });
      setInsights(result.insights);
    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro ao analisar o fluxo. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="text-primary" />
          Otimização de Fluxo com IA
        </CardTitle>
        <CardDescription>
          Use a inteligência artificial para analisar o fluxo de seus candidatos e obter insights sobre o melhor momento para abordar novos talentos com perfis semelhantes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="job-profile">Perfil da Vaga</Label>
          <Textarea
            id="job-profile"
            placeholder="Ex: Desenvolvedor(a) Sênior de Frontend com experiência em React, TypeScript e Next.js..."
            value={jobProfile}
            onChange={(e) => setJobProfile(e.target.value)}
            rows={4}
          />
        </div>
        {error && (
            <Alert variant="destructive">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {insights && (
            <Card className="bg-green-50 border-green-200">
                <CardHeader>
                    <CardTitle className="text-lg text-green-900">Insights Gerados</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-green-800 whitespace-pre-wrap">{insights}</p>
                </CardContent>
            </Card>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleAnalysis} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            "Analisar Fluxo"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
