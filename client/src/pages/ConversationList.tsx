import { useEffect, useState } from "react";
import { api, type Conversation } from "../api/client";

export function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listConversations()
      .then(setConversations)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p>Failed to load conversations: {error}</p>;
  if (!conversations) return <p>Loading conversations...</p>;

  return (
    <div>
      <h1>Conversations</h1>
      {conversations.length === 0 ? (
        <p>No conversations yet.</p>
      ) : (
        <ul>
          {conversations.map((c) => (
            <li key={c.id}>
              {c.title} (updated {c.updated_at})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
