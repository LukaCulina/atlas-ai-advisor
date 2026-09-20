import { useContext } from "react";
import { ConversationsContext, type ConversationsContextValue } from "../context/conversationsContextValue";

export function useConversations(): ConversationsContextValue {
  const value = useContext(ConversationsContext);
  if (!value) {
    throw new Error("useConversations must be used within a ConversationsProvider");
  }
  return value;
}
