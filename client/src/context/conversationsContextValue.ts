import { createContext } from "react";
import type { Conversation } from "../api/client";

export interface ConversationsContextValue {
  conversations: Conversation[] | null;
  loadError: string | null;
  refresh: () => Promise<void>;
  createConversation: () => Promise<Conversation>;
  deleteConversation: (id: number) => Promise<void>;
  updateTitleLocally: (id: number, title: string) => void;
  renameConversation: (id: number, title: string) => Promise<void>;
  togglePin: (id: number, pinned: boolean) => Promise<void>;
}

export const ConversationsContext = createContext<ConversationsContextValue | null>(null);
