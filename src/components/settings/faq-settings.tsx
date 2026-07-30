"use client";

import type { ZodIssue } from "zod";
import {
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Plus,
  Trash2,
} from "lucide-react";

import {
  SettingsField,
  SettingsInput,
  SettingsSectionHeading,
  SettingsTextarea,
  SettingsToggle,
} from "@/components/settings/settings-controls";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  FaqEntry,
  UpdateReceptionistSettingsInput,
} from "@/lib/domain";
import {
  createFaqEntry,
  getIssueMessage,
} from "@/lib/settings/settings";

interface FaqSettingsProps {
  issues: ZodIssue[];
  onChange: (faqs: UpdateReceptionistSettingsInput["faqs"]) => void;
  value: UpdateReceptionistSettingsInput["faqs"];
}

const normalizeOrder = (faqs: FaqEntry[]) =>
  faqs.map((faq, index) => ({ ...faq, sortOrder: index }));

export function FaqSettings({
  issues,
  onChange,
  value,
}: FaqSettingsProps) {
  const updateFaq = (index: number, faq: FaqEntry) => {
    const faqs = [...value];
    faqs[index] = faq;
    onChange(normalizeOrder(faqs));
  };

  const removeFaq = (index: number) => {
    onChange(
      normalizeOrder(
        value.filter((_, faqIndex) => faqIndex !== index),
      ),
    );
  };

  const moveFaq = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= value.length) {
      return;
    }

    const faqs = [...value];
    [faqs[index], faqs[destination]] = [
      faqs[destination],
      faqs[index],
    ];
    onChange(normalizeOrder(faqs));
  };

  const enabledCount = value.filter((faq) => faq.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SettingsSectionHeading
          description="Prepara risposte certe alle domande ricorrenti. L’ordine stabilisce quali informazioni vengono mostrate per prime."
          eyebrow="Conoscenza"
          title="Domande frequenti"
        />
        <Button
          className="sm:shrink-0"
          onClick={() =>
            onChange([...value, createFaqEntry(value.length)])
          }
          size="lg"
          type="button"
        >
          <Plus aria-hidden="true" data-icon="inline-start" />
          Nuova FAQ
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{value.length} domande</Badge>
        <Badge variant={enabledCount > 0 ? "success" : "warning"}>
          {enabledCount} attive
        </Badge>
      </div>

      {value.length === 0 ? (
        <EmptyState
          description="Inserisci le risposte che il salone ripete più spesso, come parcheggio, pagamenti e preparazione ai servizi."
          eyebrow="Base di conoscenza vuota"
          title="Nessuna FAQ configurata"
        >
          <Button
            onClick={() => onChange([createFaqEntry(0)])}
            size="lg"
            type="button"
          >
            <Plus aria-hidden="true" data-icon="inline-start" />
            Aggiungi la prima FAQ
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {value.map((faq, index) => {
            const prefix: PropertyKey[] = ["faqs", index];
            const questionError = getIssueMessage(issues, [
              ...prefix,
              "question",
            ]);
            const answerError = getIssueMessage(issues, [
              ...prefix,
              "answer",
            ]);

            return (
              <Card key={faq.id}>
                <CardHeader className="gap-4 border-b">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                        <CircleHelp aria-hidden="true" className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="line-clamp-2">
                          {faq.question || `Nuova domanda ${index + 1}`}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Posizione {index + 1} di {value.length}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex shrink-0">
                      <Button
                        aria-label="Sposta domanda in alto"
                        disabled={index === 0}
                        onClick={() => moveFaq(index, -1)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <ChevronUp aria-hidden="true" />
                      </Button>
                      <Button
                        aria-label="Sposta domanda in basso"
                        disabled={index === value.length - 1}
                        onClick={() => moveFaq(index, 1)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <ChevronDown aria-hidden="true" />
                      </Button>
                      <Button
                        aria-label={`Rimuovi domanda ${index + 1}`}
                        onClick={() => removeFaq(index)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </div>

                  <SettingsToggle
                    checked={faq.enabled}
                    description="Una FAQ disattivata resta salvata ma non viene usata."
                    label="Risposta disponibile alla receptionist"
                    onCheckedChange={(enabled) =>
                      updateFaq(index, { ...faq, enabled })
                    }
                  />
                </CardHeader>

                <CardContent className="space-y-5 pt-5">
                  <SettingsField
                    error={questionError}
                    htmlFor={`faq-question-${faq.id}`}
                    label="Domanda del cliente"
                  >
                    <SettingsInput
                      aria-invalid={Boolean(questionError) || undefined}
                      id={`faq-question-${faq.id}`}
                      maxLength={240}
                      onChange={(event) =>
                        updateFaq(index, {
                          ...faq,
                          question: event.target.value,
                        })
                      }
                      placeholder="Posso pagare con la carta?"
                      value={faq.question}
                    />
                  </SettingsField>

                  <SettingsField
                    error={answerError}
                    htmlFor={`faq-answer-${faq.id}`}
                    label="Risposta autorizzata"
                  >
                    <SettingsTextarea
                      aria-invalid={Boolean(answerError) || undefined}
                      id={`faq-answer-${faq.id}`}
                      maxLength={1_500}
                      onChange={(event) =>
                        updateFaq(index, {
                          ...faq,
                          answer: event.target.value,
                        })
                      }
                      placeholder="Sì, accettiamo…"
                      value={faq.answer}
                    />
                  </SettingsField>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
