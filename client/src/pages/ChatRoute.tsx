import { useParams } from "react-router-dom";
import { Chat } from "./Chat";

// Keying by the route param forces a full remount when the user switches
// conversations, so Chat's state resets for free instead of needing to be
// reset manually inside an effect.
export function ChatRoute() {
  const { id } = useParams();
  return <Chat key={id} />;
}
