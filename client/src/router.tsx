import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { ConversationList } from "./pages/ConversationList";
import { Chat } from "./pages/Chat";
import { Settings } from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <ConversationList /> },
      { path: "c/:id", element: <Chat /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
