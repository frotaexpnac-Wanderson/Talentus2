

"use client";

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Search, User, FileText, Briefcase, XCircle, Edit, ExternalLink, Paperclip, MessageSquareQuote, Loader2, Workflow, CalendarPlus, Trash2 } from "lucide-react";
import type { Candidate, Status, StatusHistory, Document, JobPosition, Interviewer, Interview, InterviewType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CandidateForm } from "./candidate-form";
import { InterviewForm } from "./interview-form";
import { CandidateTimeline } from "./candidate-timeline";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, query, orderBy, setDoc, writeBatch, Timestamp, where, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/auth-context";

const statusColors: Record<Status, string> = {
    "Em Triagem": "border-blue-500/80 bg-blue-50 text-blue-800",
    "Entrevista": "border-purple-500/80 bg-purple-50 text-purple-800",
    "Teste Técnico": "border-yellow-500/80 bg-yellow-50 text-yellow-800",
    "Oferta": "border-green-500/80 bg-green-50 text-green-800",
    "Contratado": "border-primary/80 bg-primary/10 text-primary",
    "Rejeitado": "border-red-500/80 bg-red-50 text-red-800",
}

const statusUpdateSchema = z.object({
  notes: z.string().min(10, { message: "A observação deve ter pelo menos 10 caracteres." }),
});
type StatusUpdateFormValues = z.infer<typeof statusUpdateSchema>;


export default function Dashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isInterviewModalOpen, setInterviewModalOpen] = useState(false);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [statusUpdateInfo, setStatusUpdateInfo] = useState<{candidateId: string, newStatus: Status} | null>(null);
  const { user } = useAuth();


  const statusUpdateForm = useForm<StatusUpdateFormValues>({
    resolver: zodResolver(statusUpdateSchema),
  });

  const { toast } = useToast();

  const fetchJobPositions = async () => {
    try {
        const q = query(collection(db, "jobPositions"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const positionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobPosition));
        setJobPositions(positionsData);
    } catch (error) {
        console.error("Error fetching job positions: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao buscar cargos",
            description: "Não foi possível carregar a lista de cargos.",
        });
    }
  };

  const fetchInterviewers = async () => {
    try {
        const q = query(collection(db, "interviewers"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const interviewersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interviewer));
        setInterviewers(interviewersData);
    } catch (error) {
        console.error("Error fetching interviewers: ", error);
        // This toast can be noisy if the collection doesn't exist yet, so it's commented out.
        // toast({
        //     variant: "destructive",
        //     title: "Erro ao buscar entrevistadores",
        //     description: "Não foi possível carregar a lista de entrevistadores.",
        // });
    }
  };

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
            description: "Não foi possível carregar a lista de candidatos.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchJobPositions();
    fetchInterviewers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadDocument = async (file: File, candidateId: string): Promise<{url: string, name: string}> => {
    const storageRef = ref(storage, `candidates/${candidateId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return { url: downloadURL, name: file.name };
  };

  const getLatestStatus = (history: StatusHistory[]) => {
    return [...history].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }

 const handleAddCandidate = async (data: Omit<Candidate, 'id' | 'statusHistory' | 'documents' | 'lastUpdate'> & { documents?: { type: Document['type']; file: File }[] }) => {
    const newCandidateRef = doc(collection(db, "candidates"));
    const candidateId = newCandidateRef.id;
    const now = new Date().toISOString();

    try {
        const uploadPromises = (data.documents || [])
          .filter(doc => doc.file)
          .map(async (doc) => {
            const { url, name } = await uploadDocument(doc.file, candidateId);
            return { type: doc.type, fileName: name, fileUrl: url };
        });

        const uploadedDocuments = await Promise.all(uploadPromises);

        const initialStatus: StatusHistory = { status: "Em Triagem", date: now, notes: "Candidato cadastrado no sistema.", actor: user?.email ?? 'Sistema' };

        const newCandidateData: Candidate = {
            id: candidateId,
            name: data.name,
            cpf: data.cpf,
            email: data.email,
            phone: data.phone,
            jobPosition: data.jobPosition,
            description: data.description,
            statusHistory: [initialStatus],
            documents: uploadedDocuments,
            lastUpdate: now,
            createdBy: user?.email,
        };

        await setDoc(newCandidateRef, newCandidateData);

        setAddModalOpen(false);
        fetchCandidates();

        toast({
            title: "Sucesso!",
            description: "Candidato cadastrado com sucesso.",
            className: "bg-green-100 border-green-300 text-green-800",
        });

    } catch (error) {
        console.error("Error adding candidate: ", error);
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível cadastrar o candidato.",
        });
    }
};
  
  const handleUpdateCandidate = async (data: Partial<Omit<Candidate, 'id' | 'cpf' | 'statusHistory' | 'documents'>> & { documents?: (Document | { type: Document['type']; file: File })[] }) => {
      if (!editingCandidate) return;
      const now = new Date().toISOString();

      try {
        const candidateRef = doc(db, "candidates", editingCandidate.id);
        
        const existingDocs = editingCandidate.documents || [];
        
        const uploadPromises = (data.documents || [])
          .map(async doc => {
              if ('file' in doc && doc.file instanceof File) {
                const { url, name } = await uploadDocument(doc.file as File, editingCandidate.id);
                return {
                    type: doc.type,
                    fileName: name,
                    fileUrl: url,
                };
              }
              return doc as Document;
          });

        const newUploadedDocs = await Promise.all(uploadPromises.filter(p => p !== undefined));
        
        const allDocuments = [...existingDocs, ...newUploadedDocs];
        
        const updateData: Partial<Candidate> = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          jobPosition: data.jobPosition,
          description: data.description,
          documents: allDocuments as Document[],
          lastUpdate: now,
          lastUpdatedBy: user?.email,
        };
        
        await updateDoc(candidateRef, updateData);

        setEditingCandidate(null);
        setEditModalOpen(false);
        toast({
            title: "Sucesso!",
            description: "Dados do candidato atualizados.",
            className: "bg-green-100 border-green-300 text-green-800",
        });
        fetchCandidates();
      } catch (error) {
        console.error("Error updating candidate: ", error);
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível atualizar o candidato.",
        });
      }
  };


  const handleUpdateStatus = async (formData: StatusUpdateFormValues) => {
    if (!statusUpdateInfo) return;
    const { candidateId, newStatus } = statusUpdateInfo;
    const { notes } = formData;
    
    const candidateToUpdate = candidates.find(c => c.id === candidateId);
    if (!candidateToUpdate) return;
  
    try {
      const now = new Date().toISOString();
      const newHistoryEntry: StatusHistory = { status: newStatus, date: now, notes, actor: user?.email ?? 'Sistema' };
      const updatedHistory = [...candidateToUpdate.statusHistory, newHistoryEntry];
  
      const batch = writeBatch(db);
  
      // 1. Update Candidate Document
      const candidateRef = doc(db, "candidates", candidateId);
      batch.update(candidateRef, {
        statusHistory: updatedHistory,
        lastUpdate: now,
        lastUpdatedBy: user?.email,
      });
  
      // 2. Check if previous status was "Entrevista" and delete the interview if so
      const latestStatus = getLatestStatus(candidateToUpdate.statusHistory);
      if (latestStatus.status === 'Entrevista' && latestStatus.interviewId) {
        const interviewRef = doc(db, "interviews", latestStatus.interviewId);
        batch.delete(interviewRef);
      }
  
      await batch.commit();
  
      toast({
        title: "Status Atualizado",
        description: `O status do candidato foi alterado para "${newStatus}".`,
      });
      setStatusUpdateInfo(null);
      statusUpdateForm.reset();
      
      // We need to refresh all candidates to reflect changes in the table
      fetchCandidates(); 
  
      // Update selected candidate if it's the one being changed
      if (selectedCandidate && selectedCandidate.id === candidateId) {
        const updatedSelectedCandidate = {
          ...candidateToUpdate,
          statusHistory: updatedHistory,
          lastUpdate: now
        };
        setSelectedCandidate(updatedSelectedCandidate);
      }
  
    } catch (error) {
      console.error("Error updating status: ", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o status.",
      });
    }
  };

  const handleInterviewSubmit = async (data: Omit<Interview, 'id' | 'candidateId' | 'candidateName'>) => {
    if (!selectedCandidate) return;

    const batch = writeBatch(db);
    const now = new Date().toISOString();
    
    // 1. Create new interview document
    const newInterviewRef = doc(collection(db, "interviews"));
    const newInterview: Interview = {
        id: newInterviewRef.id,
        candidateId: selectedCandidate.id,
        candidateName: selectedCandidate.name,
        ...data,
        actor: user?.email,
    };
    batch.set(newInterviewRef, newInterview);

    // 2. Update candidate status history
    const interviewer = interviewers.find(i => i.id === data.interviewerId);
    const formattedDate = format(new Date(data.date), "'dia' dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    const notes = `Entrevista (${data.type}) agendada com ${interviewer?.name || 'N/A'} para ${formattedDate}. ${data.notes || ''}`.trim();

    const newHistoryEntry: StatusHistory = { 
        status: "Entrevista", 
        date: now, 
        notes,
        interviewId: newInterviewRef.id,
        actor: user?.email ?? 'Sistema',
    };
    const updatedHistory = [...selectedCandidate.statusHistory, newHistoryEntry];
    
    const candidateRef = doc(db, "candidates", selectedCandidate.id);
    batch.update(candidateRef, {
        statusHistory: updatedHistory,
        lastUpdate: now,
        lastUpdatedBy: user?.email,
    });

    try {
        await batch.commit();
        setInterviewModalOpen(false);

        // Update local state to reflect changes immediately
        const updatedSelectedCandidate = {
            ...selectedCandidate,
            statusHistory: updatedHistory,
            lastUpdate: now,
        };
        setSelectedCandidate(updatedSelectedCandidate);
        setCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? updatedSelectedCandidate : c));
        
        toast({
            title: "Sucesso!",
            description: "Entrevista agendada e status do candidato atualizado.",
            className: "bg-green-100 border-green-300 text-green-800",
        });

    } catch (error) {
        console.error("Error scheduling interview: ", error);
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível agendar a entrevista.",
        });
    }
  };

  const handleDeleteCandidate = async () => {
    if (!selectedCandidate) return;

    setIsLoading(true);
    setDeleteAlertOpen(false);

    try {
        const batch = writeBatch(db);

        // 1. Delete associated interviews
        const interviewsQuery = query(collection(db, "interviews"), where("candidateId", "==", selectedCandidate.id));
        const interviewsSnapshot = await getDocs(interviewsQuery);
        interviewsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // 2. Delete associated documents from Storage
        if (selectedCandidate.documents && selectedCandidate.documents.length > 0) {
            const docDeletePromises = selectedCandidate.documents.map(doc => {
                if (doc.fileUrl) { // Ensure fileUrl exists
                    const fileRef = ref(storage, doc.fileUrl);
                    return deleteObject(fileRef).catch(err => {
                        // Ignore not found errors, as file might have been deleted manually
                        if (err.code !== 'storage/object-not-found') {
                            console.error("Error deleting file from storage:", err);
                            throw err; // Re-throw other errors
                        }
                    });
                }
                return Promise.resolve();
            });
            await Promise.all(docDeletePromises);
        }

        // 3. Delete candidate document
        const candidateRef = doc(db, "candidates", selectedCandidate.id);
        batch.delete(candidateRef);

        await batch.commit();

        toast({
            title: "Candidato Excluído",
            description: `${selectedCandidate.name} foi removido(a) do sistema.`,
        });

        setSelectedCandidate(null);
        fetchCandidates();

    } catch (error) {
        console.error("Error deleting candidate: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao Excluir",
            description: "Não foi possível remover o candidato. Tente novamente.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const filteredCandidates = useMemo(() => {
    if (!searchTerm) return candidates;
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cpf.includes(searchTerm) ||
        (c.jobPosition && c.jobPosition.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, candidates]);

  const groupedCandidates = useMemo(() => {
    return filteredCandidates.reduce((acc, candidate) => {
      const latestStatus = getLatestStatus(candidate.statusHistory).status;
      if (!acc[latestStatus]) {
        acc[latestStatus] = [];
      }
      acc[latestStatus].push(candidate);
      return acc;
    }, {} as Record<Status, Candidate[]>);
  }, [filteredCandidates]);

  const statusCounts = useMemo(() => {
    return candidates.reduce((acc, candidate) => {
      const latestStatus = getLatestStatus(candidate.statusHistory).status;
      acc[latestStatus] = (acc[latestStatus] || 0) + 1;
      return acc;
    }, {} as Record<Status, number>);
  }, [candidates]);
  
  const openEditModal = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setSelectedCandidate(null);
    setEditModalOpen(true);
  }

  const summaryItems = [
    { title: 'Total de Candidatos', value: candidates.length, icon: User, color: "bg-sky-100 text-sky-800 border-sky-200" },
    { title: 'Contratados', value: statusCounts['Contratado'] || 0, icon: Briefcase, color: "bg-green-100 text-green-800 border-green-200" },
    { title: 'Em Processo', value: (statusCounts['Em Triagem'] || 0) + (statusCounts['Entrevista'] || 0) + (statusCounts['Teste Técnico'] || 0) + (statusCounts['Oferta'] || 0), icon: FileText, color: "bg-amber-100 text-amber-800 border-amber-200" },
    { title: 'Rejeitados', value: statusCounts['Rejeitado'] || 0, icon: XCircle, color: "bg-red-100 text-red-800 border-red-200" },
  ];

  const statusOrder: Status[] = ["Em Triagem", "Entrevista", "Teste Técnico", "Oferta", "Contratado", "Rejeitado"];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summaryItems.map(item => (
              <Card key={item.title} className={cn("border-2", item.color)}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                      <item.icon className="h-4 w-4 text-current" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">{item.value}</div>
                  </CardContent>
              </Card>
          ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
           <Card className="lg:col-span-3">
              <CardHeader>
                  <CardTitle>Gerenciamento de Candidatos</CardTitle>
                  <CardDescription>
                  Pesquise, adicione e gerencie seus candidatos em um só lugar.
                  </CardDescription>
                  <div className="flex items-center justify-between pt-4">
                  <div className="relative w-full max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                      type="search"
                      placeholder="Pesquisar por nome, CPF ou cargo..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                  <Dialog open={isAddModalOpen} onOpenChange={setAddModalOpen}>
                      <DialogTrigger asChild>
                      <Button>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Novo Candidato
                      </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>Cadastrar Novo Candidato</DialogTitle>
                        </DialogHeader>
                        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
                            <CandidateForm 
                                onSubmit={handleAddCandidate as any}
                                onCancel={() => setAddModalOpen(false)}
                                existingCpfs={candidates.map(c => c.cpf)}
                                jobPositions={jobPositions}
                            />
                        </div>
                      </DialogContent>
                  </Dialog>
                  </div>
              </CardHeader>
              <CardContent>
                  {isLoading ? (
                      <div className="flex items-center justify-center p-10">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="ml-4 text-muted-foreground">Carregando candidatos...</p>
                      </div>
                  ) : (
                  <Tabs defaultValue="Em Triagem" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
                          {statusOrder.map((status) => (
                              <TabsTrigger key={status} value={status}>
                                  {status} ({groupedCandidates[status]?.length || 0})
                              </TabsTrigger>
                          ))}
                      </TabsList>
                      {statusOrder.map(status => (
                          <TabsContent key={status} value={status}>
                              <div className="overflow-hidden rounded-md border mt-4">
                                  <Table>
                                      <TableHeader>
                                      <TableRow>
                                          <TableHead>Candidato</TableHead>
                                          <TableHead className="hidden sm:table-cell">Cargo</TableHead>
                                          <TableHead>Status</TableHead>
                                          <TableHead className="text-right">Ações</TableHead>
                                      </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                      {(groupedCandidates[status] || []).length > 0 ? (
                                          groupedCandidates[status].map((candidate) => {
                                              const latestStatus = getLatestStatus(candidate.statusHistory);
                                              return (
                                              <TableRow key={candidate.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedCandidate(candidate)}>
                                                  <TableCell>
                                                      <div className="flex items-center gap-3">
                                                          <Avatar>
                                                              <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                                                          </Avatar>
                                                          <div>
                                                              <p className="font-medium">{candidate.name}</p>
                                                              <p className="text-sm text-muted-foreground hidden md:inline">{candidate.email}</p>
                                                          </div>
                                                      </div>
                                                  </TableCell>
                                                  <TableCell className="hidden sm:table-cell">{candidate.jobPosition}</TableCell>
                                                  <TableCell>
                                                  <Badge variant="outline" className={cn("font-medium", statusColors[latestStatus.status])}>
                                                      {latestStatus.status}
                                                  </Badge>
                                                  </TableCell>
                                                  <TableCell className="text-right">
                                                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedCandidate(candidate); }}>
                                                      Ver Detalhes
                                                  </Button>
                                                  </TableCell>
                                              </TableRow>
                                              );
                                          })
                                      ) : (
                                          <TableRow>
                                          <TableCell colSpan={4} className="h-24 text-center">
                                              Nenhum candidato nesta fase.
                                          </TableCell>
                                          </TableRow>
                                      )}
                                      </TableBody>
                                  </Table>
                              </div>
                          </TabsContent>
                      ))}
                  </Tabs>
                  )}
              </CardContent>
           </Card>
      </div>

      {/* Details Modal */}
      <Dialog open={!!selectedCandidate} onOpenChange={(isOpen) => !isOpen && setSelectedCandidate(null)}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
              {selectedCandidate && (
                  <>
                      <DialogHeader>
                          <DialogTitle>Detalhes do Candidato</DialogTitle>
                      </DialogHeader>
                      <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-6">
                          <Card>
                              <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                                  <div className="flex items-start gap-4">
                                      <Avatar className="h-16 w-16">
                                          <AvatarFallback className="text-2xl">{selectedCandidate.name.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                          <h3 className="text-xl font-bold">{selectedCandidate.name}</h3>
                                          <p className="text-muted-foreground font-medium">{selectedCandidate.jobPosition}</p>
                                          <p className="text-muted-foreground">{selectedCandidate.email}</p>
                                          <p className="text-muted-foreground">{selectedCandidate.phone} | {selectedCandidate.cpf}</p>
                                          {selectedCandidate.createdBy && <p className="text-xs text-muted-foreground mt-1">Cadastrado por: {selectedCandidate.createdBy}</p>}
                                          {selectedCandidate.lastUpdatedBy && <p className="text-xs text-muted-foreground">Última atualização por: {selectedCandidate.lastUpdatedBy}</p>}
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <Button variant="outline" size="sm" onClick={() => openEditModal(selectedCandidate)}>
                                          <Edit className="mr-2"/>
                                          Editar
                                      </Button>
                                      <Button variant="destructive" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteAlertOpen(true) }}>
                                          <Trash2 className="size-4"/>
                                      </Button>
                                  </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                  {selectedCandidate.description && (
                                      <div className="text-sm text-foreground bg-muted/50 p-3 rounded-md border border-border/50">
                                          <div className="flex items-start gap-2">
                                              <MessageSquareQuote className="size-4 text-muted-foreground flex-shrink-0 mt-0.5"/>
                                              <p className="whitespace-pre-wrap">{selectedCandidate.description}</p>
                                          </div>
                                      </div>
                                  )}
                                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                      <div className="space-y-2">
                                          <Label>Atualizar Status</Label>
                                          <div className="flex items-center gap-2">
                                          <Select onValueChange={(value: Status) => {
                                                if (value === 'Entrevista') {
                                                    setInterviewModalOpen(true);
                                                    setStatusUpdateInfo(null);
                                                } else {
                                                    setStatusUpdateInfo({ candidateId: selectedCandidate.id, newStatus: value })
                                                }
                                            }}
                                            value={getLatestStatus(selectedCandidate.statusHistory).status}
                                            >
                                              <SelectTrigger>
                                                  <SelectValue placeholder="Selecione um novo status" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                  {(Object.keys(statusColors) as Status[]).map(status => (
                                                      <SelectItem key={status} value={status}>{status}</SelectItem>
                                                  ))}
                                              </SelectContent>
                                          </Select>
                                          </div>
                                      </div>
                                      {selectedCandidate.documents && selectedCandidate.documents.length > 0 && (
                                          <div className="space-y-2">
                                              <Label>Documentos Anexados</Label>
                                              <ul className="space-y-1">
                                                  {selectedCandidate.documents.map((doc, index) => (
                                                      <li key={index}>
                                                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                                                              <Paperclip className="h-4 w-4"/>
                                                              <span>{doc.type}: {doc.fileName}</span>
                                                              <ExternalLink className="h-3 w-3 text-muted-foreground"/>
                                                          </a>
                                                      </li>
                                                  ))}
                                              </ul>
                                          </div>
                                      )}
                                  </div>
                              </CardContent>
                          </Card>
                          
                          <CandidateTimeline history={selectedCandidate.statusHistory} />
                      </div>
                  </>
              )}
          </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
              <DialogHeader>
                  <DialogTitle>Editar Candidato</DialogTitle>
              </DialogHeader>
              {editingCandidate && (
                <div className="flex-grow overflow-y-auto pr-4 -mr-4">
                  <CandidateForm 
                      onSubmit={handleUpdateCandidate as any}
                      onCancel={() => { setEditModalOpen(false); setEditingCandidate(null); }}
                      existingCpfs={candidates.map(c => c.cpf)}
                      initialData={editingCandidate}
                      jobPositions={jobPositions}
                  />
                </div>
              )}
          </DialogContent>
      </Dialog>

      {/* Status Update Notes Modal */}
      <Dialog open={!!statusUpdateInfo} onOpenChange={(isOpen) => !isOpen && setStatusUpdateInfo(null)}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Adicionar Observação</DialogTitle>
                  <DialogDescription>Adicione uma observação sobre a mudança de status para "{statusUpdateInfo?.newStatus}".</DialogDescription>
              </DialogHeader>
              <FormProvider {...statusUpdateForm}>
                  <form onSubmit={statusUpdateForm.handleSubmit(handleUpdateStatus)} className="space-y-4">
                      <div className="space-y-2">
                          <Label htmlFor="notes">Observação (Obrigatório)</Label>
                          <Textarea 
                              id="notes" 
                              placeholder="Descreva o motivo da mudança, pontos da entrevista, etc."
                              className="resize-y"
                              {...statusUpdateForm.register("notes")}
                          />
                          {statusUpdateForm.formState.errors.notes && <p className="text-sm font-medium text-destructive">{statusUpdateForm.formState.errors.notes.message}</p>}
                      </div>
                      <div className="flex justify-end gap-2">
                          <Button type="button" variant="ghost" onClick={() => setStatusUpdateInfo(null)}>Cancelar</Button>
                          <Button type="submit" disabled={statusUpdateForm.formState.isSubmitting}>Salvar</Button>
                      </div>
                  </form>
              </FormProvider>
          </DialogContent>
      </Dialog>

       {/* Interview Schedule Modal */}
       <Dialog open={isInterviewModalOpen} onOpenChange={setInterviewModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarPlus />
                        Agendar Entrevista
                    </DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes para agendar a entrevista para {selectedCandidate?.name}.
                    </DialogDescription>
                </DialogHeader>
                <InterviewForm 
                    onSubmit={handleInterviewSubmit as any}
                    onCancel={() => setInterviewModalOpen(false)}
                    interviewers={interviewers}
                />
            </DialogContent>
       </Dialog>

       {/* Delete Confirmation Alert */}
       <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o candidato <strong>{selectedCandidate?.name}</strong>, juntamente com seu histórico de status, entrevistas e todos os documentos associados.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteAlertOpen(false)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleDeleteCandidate}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : "Sim, Excluir Candidato"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
       </AlertDialog>
    </>
  );
}
