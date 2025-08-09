"use client";

import type { StatusHistory, Status } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Briefcase, CircleCheck, ClipboardList, FileText, MessageSquareQuote, UserCheck, XCircle, User } from "lucide-react";

const statusIcons: Record<Status, React.ReactNode> = {
  "Em Triagem": <ClipboardList className="size-5" />,
  "Entrevista": <UserCheck className="size-5" />,
  "Teste Técnico": <FileText className="size-5" />,
  "Oferta": <CircleCheck className="size-5" />,
  "Contratado": <Briefcase className="size-5" />,
  "Rejeitado": <XCircle className="size-5" />,
};

const statusColors: Record<Status, string> = {
    "Em Triagem": "bg-blue-200 text-blue-800",
    "Entrevista": "bg-purple-200 text-purple-800",
    "Teste Técnico": "bg-yellow-200 text-yellow-800",
    "Oferta": "bg-green-200 text-green-800",
    "Contratado": "bg-primary text-primary-foreground",
    "Rejeitado": "bg-red-200 text-red-800",
}

export function CandidateTimeline({ history }: { history: StatusHistory[] }) {
  if (!history || history.length === 0) {
    return <p className="text-muted-foreground">Nenhum histórico de status para este candidato.</p>;
  }

  // Sort history from newest to oldest
  const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-medium">Trilha do Candidato</h4>
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[34px] top-2 h-[calc(100%_-_1rem)] w-0.5 bg-border -translate-x-1/2"></div>
        
        {sortedHistory.map((item, index) => (
          <div key={index} className="flex items-start gap-4 mb-4">
            <div className={cn("z-10 flex-shrink-0 flex items-center justify-center rounded-full w-12 h-12", statusColors[item.status])}>
                {statusIcons[item.status]}
            </div>
            <div className="flex-grow pt-2">
              <p className="font-semibold text-card-foreground">{item.status}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(item.date).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              {item.actor && (
                 <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="size-3"/> por: {item.actor}
                 </p>
              )}
              {item.notes && (
                <div className="mt-2 text-sm text-foreground bg-muted/50 p-3 rounded-md border border-border/50">
                  <div className="flex items-start gap-2">
                    <MessageSquareQuote className="size-4 text-muted-foreground flex-shrink-0 mt-0.5"/>
                    <p className="whitespace-pre-wrap">{item.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
