"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Candidate, Document, JobPosition } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { X } from "lucide-react";
import { Textarea } from "./ui/textarea";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const fileSchema = z
  .any()
  .optional()
  .refine((file) => !file || (file instanceof File && file.size <= MAX_FILE_SIZE), {
    message: `O tamanho máximo do arquivo é 5MB.`
  })
  .refine((file) => !file || (file instanceof File && ACCEPTED_TYPES.includes(file.type)), {
    message: "Formatos suportados: JPEG, PNG e PDF."
  });


const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: "CPF inválido. Use o formato XXX.XXX.XXX-XX." }),
  email: z.string().email({ message: "Email inválido." }),
  phone: z.string().min(10, { message: "Telefone inválido." }),
  jobPosition: z.string({ required_error: "Por favor, selecione um cargo." }),
  description: z.string().optional(),
  documents: z.array(z.object({
    type: z.enum(['CNH', 'CTPS', 'CURRICULO', 'OUTROS']),
    file: fileSchema,
    fileName: z.string().optional(),
    fileUrl: z.string().optional(),
  })).optional(),
});

type CandidateFormValues = z.infer<typeof formSchema>;

interface CandidateFormProps {
  onSubmit: (data: Omit<Candidate, 'id' | 'statusHistory'>) => void;
  onCancel: () => void;
  existingCpfs: string[];
  jobPositions: JobPosition[];
  initialData?: Candidate;
}

export function CandidateForm({ onSubmit, onCancel, existingCpfs, jobPositions, initialData }: CandidateFormProps) {
    const dynamicSchema = formSchema.refine(
        (data) => initialData ? true : !existingCpfs.includes(data.cpf),
        {
          message: "Este CPF já está cadastrado no sistema.",
          path: ["cpf"],
        }
    );

  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: initialData ? {
        ...initialData,
        documents: [], // Don't pre-fill files, but can show existing ones
    } : {
      name: "",
      cpf: "",
      email: "",
      phone: "",
      jobPosition: "",
      description: "",
      documents: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "documents",
  });


  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    form.setValue("cpf", value, { shouldValidate: true });
  }

  const handleInternalSubmit = (data: CandidateFormValues) => {
    const documentsToSubmit = data.documents
      ?.filter(doc => doc.file instanceof File)
      .map(doc => ({
        type: doc.type,
        file: doc.file,
        fileName: doc.file.name,
        fileUrl: '', // This will be populated after upload in the parent
      })) as any[];

    onSubmit({
        ...data,
        documents: documentsToSubmit,
    });
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleInternalSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João da Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="jobPosition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo Pretendido</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o cargo" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {jobPositions.map(pos => (
                            <SelectItem key={pos.id} value={pos.name}>{pos.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF</FormLabel>
              <FormControl>
                <Input 
                  placeholder="000.000.000-00" 
                  {...field}
                  onChange={handleCpfChange}
                  disabled={!!initialData}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="joao.silva@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input placeholder="(99) 99999-9999" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição do Candidato</FormLabel>
              <FormControl>
                <Textarea
                    placeholder="Adicione observações sobre o candidato, como habilidades, experiências relevantes ou primeira impressão."
                    className="resize-none"
                    {...field}
                    />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-4">
            <FormLabel>Documentos</FormLabel>
            {initialData?.documents && initialData.documents.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Documentos existentes:</p>
                    <ul className="list-disc list-inside text-sm">
                        {initialData.documents.map((doc, index) => (
                            <li key={index}><a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">{doc.type}: {doc.fileName}</a></li>
                        ))}
                    </ul>
                    <p className="text-xs text-muted-foreground pt-2">Para adicionar novos documentos, use o botão abaixo. Não é possível remover documentos já enviados.</p>
                </div>
            )}
            <div className="space-y-3">
            {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md">
                    <FormField
                        control={form.control}
                        name={`documents.${index}.type`}
                        render={({ field }) => (
                            <FormItem className="flex-grow">
                                <FormLabel>Tipo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="CURRICULO">Currículo</SelectItem>
                                    <SelectItem value="CNH">CNH</SelectItem>
                                    <SelectItem value="CTPS">CTPS</SelectItem>
                                    <SelectItem value="OUTROS">Outros</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`documents.${index}.file`}
                        render={({ field: { onChange, value, ...rest } }) => (
                            <FormItem className="flex-grow">
                                <FormLabel>Arquivo</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="file" 
                                        accept={ACCEPTED_TYPES.join(',')}
                                        onChange={(e) => onChange(e.target.files?.[0])}
                                        {...rest}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            </div>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ type: 'CURRICULO', file: undefined })}
            >
                Adicionar Documento
            </Button>
            <FormDescription>Anexe novos documentos como currículo, CNH, etc. (PDF, JPG, PNG - Máx 5MB).</FormDescription>
        </div>


        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit">{initialData ? 'Salvar Alterações' : 'Cadastrar Candidato'}</Button>
        </div>
      </form>
    </Form>
  );
}
