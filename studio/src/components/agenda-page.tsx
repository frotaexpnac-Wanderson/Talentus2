"use client";

import { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/pt-br';
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, writeBatch, doc, getDoc } from "firebase/firestore";
import type { Candidate, Interview, StatusHistory } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { useAuth } from "@/contexts/auth-context";

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

const messages = {
  allDay: 'Dia todo',
  previous: '<',
  next: '>',
  today: 'Hoje',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'Não há eventos neste período.',
  showMore: (total: number) => `+ Ver mais (${total})`,
};

type CalendarEvent = {
    title: string;
    start: Date;
    end: Date;
    resource: Interview;
}

export default function AgendaPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();


    const fetchInterviews = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, "interviews"), orderBy("date", "asc"));
            const querySnapshot = await getDocs(q);
            const interviewsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interview));
            const formattedEvents = interviewsData.map(interview => ({
                title: `${moment(interview.date).format('HH:mm')} - ${interview.candidateName}`,
                start: new Date(interview.date),
                end: moment(interview.date).add(1, 'hour').toDate(), // Assume 1 hour duration
                resource: interview
            }));
            setEvents(formattedEvents);
        } catch (error) {
            console.error("Error fetching interviews: ", error);
            toast({
                variant: "destructive",
                title: "Erro ao buscar entrevistas",
                description: "Não foi possível carregar os agendamentos.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchInterviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setIsAlertOpen(true);
    }

    const handleCancelInterview = async () => {
        if (!selectedEvent) return;

        setIsLoading(true);
        try {
            // Step 1: Fetch the candidate document first to get the current status history
            const candidateRef = doc(db, "candidates", selectedEvent.resource.candidateId);
            const candidateSnap = await getDoc(candidateRef);

            if (!candidateSnap.exists()) {
                throw new Error("Candidato não encontrado para atualizar o histórico.");
            }

            const existingCandidate = candidateSnap.data() as Candidate;
            
            // Prepare the batch operation
            const batch = writeBatch(db);
            
            // Action 1: Delete interview document
            const interviewRef = doc(db, "interviews", selectedEvent.resource.id);
            batch.delete(interviewRef);

            // Action 2: Update candidate history
            const now = new Date().toISOString();
            const newHistoryEntry: StatusHistory = { 
                status: "Em Triagem", 
                date: now, 
                notes: `Entrevista de ${moment(selectedEvent.resource.date).format('DD/MM/YYYY HH:mm')} cancelada.`,
                actor: user?.email ?? 'Sistema',
            };
            const updatedHistory = [...existingCandidate.statusHistory, newHistoryEntry];
            
            batch.update(candidateRef, { 
                statusHistory: updatedHistory, 
                lastUpdate: now,
                lastUpdatedBy: user?.email,
            });

            // Commit the batch
            await batch.commit();

            toast({
                title: "Entrevista Cancelada",
                description: "O agendamento foi removido e o histórico do candidato foi atualizado.",
            });
            
            // Refresh data on the page
            fetchInterviews();

        } catch(error) {
            console.error("Error cancelling interview: ", error);
            toast({
                variant: "destructive",
                title: "Erro ao cancelar",
                description: "Não foi possível cancelar a entrevista. Tente novamente.",
            });
        } finally {
            setIsLoading(false);
            setIsAlertOpen(false);
            setSelectedEvent(null);
        }
    }


    const tooltipAccessor = (event: CalendarEvent) => {
        const { resource } = event;
        let tooltip = `Candidato(a): ${resource.candidateName}\n`;
        tooltip += `Entrevistador(a): ${resource.interviewerName}\n`;
        tooltip += `Tipo: ${resource.type}`;
        if (resource.notes) {
            tooltip += `\n\nObservações:\n${resource.notes}`;
        }
        tooltip += `\n\nClique para cancelar a entrevista.`;
        return tooltip;
    }

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Carregando agenda...</p>
            </div>
        )
    }

    return (
        <>
            <div className="bg-card p-4 rounded-lg shadow space-y-4">
                {events.length === 0 && !isLoading ? (
                    <Alert>
                        <CalendarIcon className="h-4 w-4" />
                        <AlertTitle>Nenhuma entrevista agendada</AlertTitle>
                        <AlertDescription>
                            Ainda não há entrevistas no calendário. Para agendar, vá para o dashboard, selecione um candidato e altere o status para "Entrevista".
                        </AlertDescription>
                    </Alert>
                ) : null}
                <div className="h-[calc(100vh_-_12rem)]">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        messages={messages}
                        tooltipAccessor={tooltipAccessor}
                        onSelectEvent={handleSelectEvent}
                    />
                </div>
            </div>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
                        <AlertDialogDescription>
                            Você tem certeza que deseja cancelar a entrevista com <strong>{selectedEvent?.resource.candidateName}</strong> no dia <strong>{selectedEvent ? moment(selectedEvent.resource.date).format('DD/MM/YYYY [às] HH:mm') : ''}</strong>?
                            <br/><br/>
                            Esta ação não pode ser desfeita. O status do candidato será revertido para "Em Triagem".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedEvent(null)}>Manter Agendamento</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelInterview}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            <Trash2 className="mr-2"/>
                            Sim, Cancelar Entrevista
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
