import { useParams } from "react-router-dom";

export function Chat() {
  const { id } = useParams<{ id: string }>();

  return <p>Chat view for conversation {id} (built in phase 4c).</p>;
}
