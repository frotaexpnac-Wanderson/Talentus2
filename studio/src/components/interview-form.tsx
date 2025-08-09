
"use client";

import { useForm } from "react-hook-form";
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
import type { Interview, Interviewer, InterviewType } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formSchema = z.object({
  interviewerId: z.string({ required_error: "Por favor, selecione um entrevistador." }),
  type: z.enum(['Online', 'Presencial'], { required_error: "Por favor, selecione o tipo de entrevista." }),
  date: z.date({ required_error: "Por favor, selecione a data." }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido. Use HH:MM."}),
  notes: z.string().optional(),
});

type InterviewFormValues = z.infer<typeof formSchema>;

interface InterviewFormProps {
  onSubmit: (data: Omit<Interview, 'id' | 'candidateId' | 'candidateName'>) => void;
  onCancel: () => void;
  interviewers: Interviewer[];
  initialData?: Interview;
}

export function InterviewForm({ onSubmit, onCancel, interviewers, initialData }: InterviewFormProps) {
  const form = useForm<InterviewFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
        ...initialData,
        date: new Date(initialData.date),
        time: format(new Date(initialData.date), "HH:mm"),
    } : {
      interviewerId: '',
      type: undefined,
      date: undefined,
      time: '',
      notes: "",
    },
  });

  const handleInternalSubmit = (data: InterviewFormValues) => {
    const [hours, minutes] = data.time.split(':').map(Number);
    const combinedDateTime = new Date(data.date);
    combinedDateTime.setHours(hours);
    combinedDateTime.setMinutes(minutes);

    const interviewer = interviewers.find(i => i.id === data.interviewerId);

    onSubmit({
        interviewerId: data.interviewerId,
        interviewerName: interviewer?.name ?? 'N/A',
        type: data.type as InterviewType,
        date: combinedDateTime.toISOString(),
        notes: data.notes,
    });
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleInternalSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="interviewerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entrevistador(a)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o(a) entrevistador(a)" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {interviewers.map(pos => (
                            <SelectItem key={pos.id} value={pos.id}>{pos.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Entrevista</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="Online">Online</SelectItem>
                        <SelectItem value="Presencial">Presencial</SelectItem>
                    </SelectContent>
                </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-4">
            <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem className="flex flex-col flex-1">
                <FormLabel>Data da Entrevista</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                        ) : (
                            <span>Escolha uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                    <FormItem className="flex flex-col w-28">
                        <FormLabel>Horário</FormLabel>
                        <FormControl>
                            <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                    placeholder="Adicione informações relevantes sobre o agendamento, como links para a chamada ou endereço."
                    className="resize-none"
                    {...field}
                    />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
    
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : "Agendar Entrevista"}
            </Button>
        </div>
      </form>
    </Form>
  );
}
