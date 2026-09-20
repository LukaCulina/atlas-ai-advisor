import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConversations } from "../hooks/useConversations";
import { useTopBarTitle } from "../hooks/useTopBarTitle";

export function Home() {
  useTopBarTitle(null);
  const { createConversation } = useConversations();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNewChat = async () => {
    setCreating(true);
    setError(null);
    try {
      const conversation = await createConversation();
      navigate(`/c/${conversation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setCreating(false);
    }
  };

  return (
    <div className="empty-state">
      <h1>Welcome to Travel Advisor</h1>
      <p>Select a conversation from the sidebar, or start a new one.</p>
      <button onClick={handleNewChat} disabled={creating}>
        {creating ? "Starting..." : "New chat"}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
