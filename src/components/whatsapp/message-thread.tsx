import {
  AlertCircle,
  Bot,
  Check,
  CheckCheck,
  Clock3,
  Store,
  UserRound,
} from "lucide-react";

import type { Message } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { formatMessageTime } from "@/lib/whatsapp/formatters";
import {
  messageAuthorLabels,
  messageStatusLabels,
} from "@/lib/whatsapp/labels";

interface MessageThreadProps {
  messages: Message[];
  timeZone: string;
}

export function MessageThread({
  messages,
  timeZone,
}: MessageThreadProps) {
  return (
    <ol
      aria-label="Cronologia dei messaggi"
      aria-live="polite"
      className="space-y-3 rounded-2xl border bg-muted/15 p-3 sm:p-4"
      role="log"
    >
      {messages.map((message) =>
        message.author === "system" ? (
          <li
            className="mx-auto max-w-[92%] rounded-full border bg-background/80 px-3 py-1.5 text-center text-[0.68rem] leading-4 text-muted-foreground"
            key={message.id}
          >
            {message.body} · {formatMessageTime(message.sentAt, timeZone)}
          </li>
        ) : (
          <MessageBubble
            key={message.id}
            message={message}
            timeZone={timeZone}
          />
        ),
      )}
    </ol>
  );
}

function MessageBubble({
  message,
  timeZone,
}: {
  message: Message;
  timeZone: string;
}) {
  const outgoing = message.direction === "outbound";
  const Icon =
    message.author === "customer"
      ? UserRound
      : message.author === "human"
        ? Store
        : Bot;

  return (
    <li className={cn("flex", outgoing ? "justify-end" : "justify-start")}>
      <article
        className={cn(
          "max-w-[88%] rounded-2xl border px-3.5 py-3 shadow-xs sm:max-w-[78%]",
          message.author === "human" &&
            "border-primary/25 bg-primary text-primary-foreground",
          message.author === "ai" &&
            "border-secondary bg-secondary text-secondary-foreground",
          message.author === "customer" && "bg-background",
          message.status === "failed" &&
            "border-destructive/30 bg-destructive/[0.055] text-foreground",
        )}
      >
        <div
          className={cn(
            "mb-1.5 flex items-center gap-1.5 text-[0.68rem] font-semibold",
            message.author === "human"
              ? "text-primary-foreground/75"
              : "text-muted-foreground",
          )}
        >
          <Icon aria-hidden="true" className="size-3.5" />
          {messageAuthorLabels[message.author]}
        </div>
        <p className="text-sm leading-6 whitespace-pre-wrap">{message.body}</p>
        <div
          className={cn(
            "mt-1.5 flex items-center justify-end gap-1 text-[0.65rem]",
            message.author === "human"
              ? "text-primary-foreground/70"
              : "text-muted-foreground",
          )}
        >
          <span>{formatMessageTime(message.sentAt, timeZone)}</span>
          {outgoing ? (
            <MessageStatusIcon message={message} />
          ) : null}
          {outgoing ? (
            <span className="sr-only">
              {messageStatusLabels[message.status]}
            </span>
          ) : null}
        </div>
      </article>
    </li>
  );
}

function MessageStatusIcon({ message }: { message: Message }) {
  if (message.status === "failed") {
    return <AlertCircle aria-hidden="true" className="size-3 text-destructive" />;
  }
  if (["delivered", "read"].includes(message.status)) {
    return <CheckCheck aria-hidden="true" className="size-3" />;
  }
  if (["sent"].includes(message.status)) {
    return <Check aria-hidden="true" className="size-3" />;
  }

  return <Clock3 aria-hidden="true" className="size-3" />;
}
