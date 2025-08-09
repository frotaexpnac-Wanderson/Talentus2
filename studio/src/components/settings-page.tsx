"use client";

import { useState, useEffect } from "react";
import type { Interviewer, JobPosition } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Briefcase, UserPlus, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, setDoc, doc } from "firebase/firestore";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";


export default function SettingsPage() {
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [newJobPosition, setNewJobPosition] = useState("");
  const [newInterviewer, setNewInterviewer] = useState("");
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);
  const [isSubmittingInterviewer, setIsSubmittingInterviewer] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isMasterUser = user?.email === 'frotaexpnac@gmail.com';


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
        // This can be noisy if collection does not exist.
    }
  };

  useEffect(() => {
    fetchJobPositions();
    fetchInterviewers();
  }, []);

  const handleAddJobPosition = async () => {
    if (!newJobPosition.trim()) return;
    setIsSubmittingJob(true);
    try {
        const newPositionRef = doc(collection(db, "jobPositions"));
        await setDoc(newPositionRef, { 
            id: newPositionRef.id,
            name: newJobPosition.trim(),
            createdBy: user?.email,
            createdAt: new Date().toISOString(),
        });
        setNewJobPosition("");
        toast({
            title: "Sucesso!",
            description: "Novo cargo adicionado.",
            className: "bg-green-100 border-green-300 text-green-800",
        });
        fetchJobPositions();
    } catch (error) {
        console.error("Error adding job position: ", error);
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível adicionar o novo cargo.",
        });
    } finally {
        setIsSubmittingJob(false);
    }
  };
  
  const handleAddInterviewer = async () => {
    if (!newInterviewer.trim()) return;
    setIsSubmittingInterviewer(true);
    try {
        const newInterviewerRef = doc(collection(db, "interviewers"));
        await setDoc(newInterviewerRef, { 
            id: newInterviewerRef.id,
            name: newInterviewer.trim(),
            createdBy: user?.email,
            createdAt: new Date().toISOString(),
        });
        setNewInterviewer("");
        toast({
            title: "Sucesso!",
            description: "Novo(a) entrevistador(a) adicionado(a).",
            className: "bg-green-100 border-green-300 text-green-800",
        });
        fetchInterviewers();
    } catch (error) {
        console.error("Error adding interviewer: ", error);
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível adicionar o(a) novo(a) entrevistador(a).",
        });
    } finally {
        setIsSubmittingInterviewer(false);
    }
  };

  return (
    <Tabs defaultValue="general">
        <TabsList className="mb-4">
            <TabsTrigger value="general">Cadastros Gerais</TabsTrigger>
            {isMasterUser && <TabsTrigger value="permissions">Permissões</TabsTrigger>}
        </TabsList>

        <TabsContent value="general">
            <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Briefcase />Gerenciar Cargos</CardTitle>
                    <CardDescription>Adicione os cargos disponíveis para seleção no cadastro de candidatos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Nome do novo cargo"
                            value={newJobPosition}
                            onChange={(e) => setNewJobPosition(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddJobPosition()}
                        />
                        <Button onClick={handleAddJobPosition} disabled={isSubmittingJob}>
                            {isSubmittingJob ? <Loader2 className="animate-spin" /> : "Adicionar"}
                        </Button>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Cargos existentes</h4>
                            {jobPositions.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {jobPositions.map(pos => (
                                    <Badge key={pos.id} variant="secondary">{pos.name}</Badge>
                                ))}
                            </div>
                            ) : (
                            <p className="text-sm text-muted-foreground">Nenhum cargo cadastrado.</p>
                            )}
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserPlus />Gerenciar Entrevistadores</CardTitle>
                    <CardDescription>Adicione os entrevistadores que conduzirão as entrevistas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Nome do(a) entrevistador(a)"
                            value={newInterviewer}
                            onChange={(e) => setNewInterviewer(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddInterviewer()}
                        />
                        <Button onClick={handleAddInterviewer} disabled={isSubmittingInterviewer}>
                            {isSubmittingInterviewer ? <Loader2 className="animate-spin" /> : "Adicionar"}
                        </Button>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Entrevistadores existentes</h4>
                            {interviewers.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {interviewers.map(interviewer => (
                                    <Badge key={interviewer.id} variant="secondary">{interviewer.name}</Badge>
                                ))}
                            </div>
                            ) : (
                            <p className="text-sm text-muted-foreground">Nenhum entrevistador cadastrado.</p>
                            )}
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Tipos de Entrevista</CardTitle>
                    <CardDescription>Estes são os tipos de entrevista pré-definidos no sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Online</Badge>
                        <Badge variant="outline">Presencial</Badge>
                    </div>
                </CardContent>
            </Card>
            </div>
        </TabsContent>

        <TabsContent value="permissions">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield />Permissões de Usuário</CardTitle>
                    <CardDescription>
                        Selecione um usuário para definir quais ações ele pode realizar no sistema.
                        Esta funcionalidade é um protótipo visual e não possui lógica de back-end.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="user-select">Selecionar Usuário</Label>
                        <Select>
                            <SelectTrigger id="user-select">
                                <SelectValue placeholder="Selecione um email" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user1@example.com">user1@example.com</SelectItem>
                                <SelectItem value="user2@example.com">user2@example.com</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-medium">Ações Permitidas</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="perm-create-candidate" />
                                <Label htmlFor="perm-create-candidate">Cadastrar Candidato</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="perm-edit-candidate" />
                                <Label htmlFor="perm-edit-candidate">Editar Candidato</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="perm-change-status" />
                                <Label htmlFor="perm-change-status">Alterar Status</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="perm-schedule-interview" />
                                <Label htmlFor="perm-schedule-interview">Agendar Entrevista</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="perm-cancel-interview" />
                                <Label htmlFor="perm-cancel-interview">Cancelar Entrevista</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="perm-view-indicators" />
                                <Label htmlFor="perm-view-indicators">Ver Indicadores</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="perm-edit-settings" />
                                <Label htmlFor="perm-edit-settings">Editar Configurações</Label>
                            </div>
                        </div>
                    </div>
                     <Button disabled>Salvar Permissões (desabilitado)</Button>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
  );
}
