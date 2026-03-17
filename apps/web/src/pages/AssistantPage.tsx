import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, MessageSquarePlus, Send, Sparkles, Wrench, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  createConversation,
  getMessages,
  listConversations,
  listModels,
  sendMessage,
  type ChatConversation,
  type ChatEvent,
  type ChatMessage,
  type ChatModelOption,
} from "@/lib/chat-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type StreamState = {
  text: string;
  events: ChatEvent[];
};

function formatConversationTitle(conversation: ChatConversation) {
  return conversation.title?.trim() || "New chat";
}

function formatRelativeTime(timestamp: string) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function MessageBubble(props: { message: ChatMessage }) {
  const isUser = props.message.role === "USER";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border/60 bg-card text-card-foreground",
        )}
      >
        <div className="whitespace-pre-wrap text-sm leading-6">{props.message.content}</div>
        {!isUser && props.message.toolCalls?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {props.message.toolCalls.map((toolCall, index) => (
              <Badge key={`${props.message.id}-tool-${index}`} variant="secondary" className="gap-1">
                <Wrench className="h-3 w-3" />
                {toolCall.name}
              </Badge>
            ))}
          </div>
        ) : null}
        {!isUser && props.message.actionIds.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {props.message.actionIds.map((actionId) => (
              <Badge key={actionId} variant="outline" className="gap-1">
                <ShieldCheck className="h-3 w-3" />
                {actionId}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StreamingBubble(props: { stream: StreamState }) {
  const toolEvents = props.stream.events.filter((event) => event.type === "tool_start" || event.type === "tool_done");
  const actionEvents = props.stream.events.filter((event) => event.type === "action_proposed");
  const councilEvents = props.stream.events.filter((event) => event.type.startsWith("council_"));

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Assistant is working
        </div>
        <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
          {props.stream.text || "Thinking..."}
        </div>

        {toolEvents.length ? (
          <div className="mt-3 space-y-2">
            {toolEvents.map((event, index) => (
              <div key={`tool-${index}`} className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                {event.type === "tool_start" ? "Running" : "Completed"} {event.tool}
              </div>
            ))}
          </div>
        ) : null}

        {actionEvents.length ? (
          <div className="mt-3 space-y-2">
            {actionEvents.map((event, index) => (
              <div key={`action-${index}`} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
                {event.summary || "Action proposed"}
              </div>
            ))}
          </div>
        ) : null}

        {councilEvents.length ? (
          <div className="mt-3 space-y-2">
            {councilEvents.map((event, index) => (
              <div key={`council-${index}`} className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                {("message" in event && event.message) ? event.message : event.type}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [models, setModels] = useState<ChatModelOption[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatModel, setNewChatModel] = useState("");
  const [streamState, setStreamState] = useState<StreamState | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  );

  async function refreshConversations(preferredConversationId?: string | null) {
    setLoadingList(true);
    try {
      const [modelsResponse, conversationsResponse] = await Promise.all([
        listModels(),
        listConversations(),
      ]);
      setModels(modelsResponse.results);
      setConversations(conversationsResponse.results);
      setNewChatModel((current) => current || modelsResponse.results[0]?.id || "");

      const nextConversationId =
        preferredConversationId
        || selectedConversationId
        || conversationsResponse.results[0]?.id
        || null;
      setSelectedConversationId(nextConversationId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load assistant");
    } finally {
      setLoadingList(false);
    }
  }

  async function refreshMessages(conversationId: string) {
    setLoadingMessages(true);
    try {
      const response = await getMessages(conversationId);
      setMessages(response.results);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    refreshConversations();

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    refreshMessages(selectedConversationId);
  }, [selectedConversationId]);

  // Auto-scroll to bottom when messages or streaming text changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamState?.text]);

  async function handleCreateConversation() {
    if (!newChatModel) return;

    try {
      const conversation = await createConversation({ model: newChatModel });
      setNewChatOpen(false);
      setSelectedConversationId(conversation.id);
      setMessages([]);
      await refreshConversations(conversation.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create conversation");
    }
  }

  async function handleSendMessage() {
    if (!selectedConversationId || !draft.trim() || sending) return;

    const text = draft.trim();
    setDraft("");
    setSending(true);
    setStreamError(null);
    setMessages((current) => [
      ...current,
      {
        id: `pending-user-${Date.now()}`,
        role: "USER",
        content: text,
        actionIds: [],
        createdAt: new Date().toISOString(),
      },
    ]);
    setStreamState({ text: "", events: [] });

    try {
      const { runId } = await sendMessage(selectedConversationId, { text });

      eventSourceRef.current?.close();
      const source = new EventSource(`/api/chat/runs/${runId}/stream`);
      eventSourceRef.current = source;

      source.onmessage = (message) => {
        const event = JSON.parse(message.data) as ChatEvent;

        if (event.type === "text_delta") {
          setStreamState((current) => ({
            text: `${current?.text || ""}${event.text || ""}`,
            events: current?.events || [],
          }));
          return;
        }

        if (event.type === "done") {
          source.close();
          eventSourceRef.current = null;
          setSending(false);
          setStreamState(null);
          void refreshConversations(selectedConversationId);
          void refreshMessages(selectedConversationId);
          return;
        }

        if (event.type === "error") {
          source.close();
          eventSourceRef.current = null;
          setSending(false);
          setStreamError(event.message || "Assistant request failed");
          toast.error(event.message || "Assistant request failed");
          return;
        }

        setStreamState((current) => ({
          text: current?.text || "",
          events: [...(current?.events || []), event],
        }));
      };

      source.onerror = () => {
        source.close();
        eventSourceRef.current = null;
        setSending(false);
        setStreamState(null);
        setStreamError("Stream connection failed");
        toast.error("Assistant stream connection failed");
      };
    } catch (error) {
      setSending(false);
      setStreamState(null);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    }
  }

  return (
    <div className="grid h-[calc(100vh-8.5rem)] gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="glass-card overflow-hidden">
        <CardHeader className="border-b border-border/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Assistant</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Saved conversations and fixed-model threads</p>
            </div>
            <Button size="sm" className="gap-2" onClick={() => setNewChatOpen(true)}>
              <MessageSquarePlus className="h-4 w-4" />
              New chat
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-15rem)]">
            <div className="space-y-2 p-3">
              {loadingList ? (
                <div className="flex items-center gap-2 rounded-xl border border-border/60 p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading conversations...
                </div>
              ) : conversations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                  No conversations yet. Start a new chat to use the assistant.
                </div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                      selectedConversationId === conversation.id
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/60 bg-background/50 hover:bg-secondary/60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">
                          {formatConversationTitle(conversation)}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatRelativeTime(conversation.updatedAt)}
                        </div>
                      </div>
                      {conversation.model ? (
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          {conversation.model.replace("claude-", "").replace(/-\d{8}/, "")}
                        </Badge>
                      ) : null}
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="glass-card flex min-h-0 flex-col overflow-hidden">
        <CardHeader className="border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-lg">
                {selectedConversation ? formatConversationTitle(selectedConversation) : "Assistant"}
              </CardTitle>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {selectedConversation?.model ? (
                  <Badge variant="outline">{selectedConversation.model}</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">Create a chat to pick a model and start</span>
                )}
                {streamError ? <Badge variant="destructive">{streamError}</Badge> : null}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <ScrollArea className="flex-1">
            <div className="space-y-4 p-4">
              {!selectedConversation ? (
                <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold">Start a conversation</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Choose an Anthropic model once, then keep the whole thread on that model.
                  </p>
                  <Button className="mt-4 gap-2" onClick={() => setNewChatOpen(true)}>
                    <MessageSquarePlus className="h-4 w-4" />
                    New chat
                  </Button>
                </div>
              ) : loadingMessages ? (
                <div className="flex items-center gap-2 rounded-xl border border-border/60 p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading messages...
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                  {streamState ? <StreamingBubble stream={streamState} /> : null}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-border/60 p-4">
            <div className="space-y-3">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={selectedConversation ? "Ask the assistant about risks, controls, audits, incidents..." : "Create a conversation first"}
                className="min-h-[96px] resize-none"
                disabled={!selectedConversation || sending}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  The assistant can query MCP tools, show tool activity, and propose actions for approval.
                </p>
                <Button
                  className="gap-2"
                  onClick={handleSendMessage}
                  disabled={!selectedConversation || !draft.trim() || sending}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New assistant chat</DialogTitle>
            <DialogDescription>
              Pick the Anthropic model once. It stays fixed for the whole conversation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="assistant-model">Model</Label>
            <Select value={newChatModel} onValueChange={setNewChatModel}>
              <SelectTrigger id="assistant-model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewChatOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateConversation} disabled={!newChatModel}>
              Create chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
