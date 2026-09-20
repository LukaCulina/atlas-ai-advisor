import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type Conversation } from "../api/client";
import { ConversationsContext } from "./conversationsContextValue";

export function ConversationsProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await api.listConversations();
      setConversations(list);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    api
      .listConversations()
      .then((list) => {
        setConversations(list);
        setLoadError(null);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : String(err)));
  }, []);

  const createConversation = useCallback(async () => {
    const conversation = await api.createConversation();
    setConversations((prev) => (prev ? [conversation, ...prev] : [conversation]));
    return conversation;
  }, []);

  const deleteConversation = useCallback(async (id: number) => {
    await api.deleteConversation(id);
    setConversations((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
  }, []);

  const updateTitleLocally = useCallback((id: number, title: string) => {
    setConversations((prev) => (prev ? prev.map((c) => (c.id === id ? { ...c, title } : c)) : prev));
  }, []);

  const renameConversation = useCallback(async (id: number, title: string) => {
    await api.renameConversation(id, title);
    setConversations((prev) => (prev ? prev.map((c) => (c.id === id ? { ...c, title } : c)) : prev));
  }, []);

  const value = useMemo(
    () => ({
      conversations,
      loadError,
      refresh,
      createConversation,
      deleteConversation,
      updateTitleLocally,
      renameConversation,
    }),
    [conversations, loadError, refresh, createConversation, deleteConversation, updateTitleLocally, renameConversation]
  );

  return <ConversationsContext.Provider value={value}>{children}</ConversationsContext.Provider>;
}
