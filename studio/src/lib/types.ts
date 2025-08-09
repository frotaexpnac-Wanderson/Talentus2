export type Status = 'Em Triagem' | 'Entrevista' | 'Teste Técnico' | 'Oferta' | 'Rejeitado' | 'Contratado';

export interface StatusHistory {
  status: Status;
  date: string;
  notes?: string;
  interviewId?: string; // Link to the interview
  actor?: string; // User who performed the action
}

export interface Document {
    type: 'CNH' | 'CTPS' | 'CURRICULO' | 'OUTROS';
    fileName: string;
    fileUrl: string; 
    file?: File; // Keep File for upload purposes
}

export interface JobPosition {
    id: string;
    name: string;
}

export interface Interviewer {
    id: string;
    name: string;
}

export type InterviewType = 'Online' | 'Presencial';

export interface Interview {
    id: string;
    candidateId: string;
    candidateName: string;
    interviewerId: string;
    interviewerName: string;
    type: InterviewType;
    date: string; // ISO String
    notes?: string;
    actor?: string;
}

export interface Candidate {
  id: string; // Firestore document ID
  name: string;
  cpf: string;
  email: string;
  phone: string;
  jobPosition: string; // The name of the job position
  description?: string;
  statusHistory: StatusHistory[];
  documents?: Document[];
  lastUpdate: string; // ISO string date for ordering
  createdBy?: string;
  lastUpdatedBy?: string;
}
