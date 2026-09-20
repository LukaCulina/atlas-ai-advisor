import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { Home } from "./pages/Home";
import { ChatRoute } from "./pages/ChatRoute";
import { TripPage } from "./pages/TripPage";
import { Settings } from "./pages/Settings";
import { ConversationsPage } from "./pages/ConversationsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "c/:id", element: <ChatRoute /> },
      { path: "trip", element: <TripPage /> },
      { path: "conversations", element: <ConversationsPage /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
