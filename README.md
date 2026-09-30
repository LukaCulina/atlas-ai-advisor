# Atlas - AI Advisor Chatbot

## 1. Setup & run

In order to run the app properly, you first need to have Docker Desktop installed and an OpenRouter API Key. If you ahve those ready, you can extract the ZIP and then open the project and navigate to its root directory. You will need to copy the existing .env.example file and rename it .env. After doing so, paste your OpenRouter API Key in the file, as the value of OPENROUTER_API_KEY. Finally, run the follwoing command in the project insdie your terminal: `docker compose up --build`. Once that is all done, open http://localhost:3000 in your browser of choice.

## 2. Architecture overview

The application runs in a single Docker container via a multi-stage build (node:22-bookworm-slim), with an Express backend serving both the REST API and the compiled React 19 frontend on port 3000. For persistence, I used SQLite via better-sqlite3 in WAL mode with foreign keys enabled, stored inside a named Docker volume (/app/data). Instead of bringing in a heavy ORM, the database initializes on boot from schema.sql and uses guarded in-code checks to apply schema updates safely without data loss.   The frontend is built with React 19, Vite, and React Router, with a central ConversationsContext keeping the sidebar and chat views in sync. The agent core lives in agent.ts and connects to OpenRouter, running an autonomous tool-calling loop (up to 4 rounds) for live data (weather via Open-Meteo, exchange rates via Frankfurter, holidays via Nager.Date), trip plan modifications, and cross-conversation memory. To keep interactions snappy, secondary tasks like title generation and follow-up suggestion chips run through dedicated standalone services (title.ts, suggestions.ts) using a faster model.

## 3. Key decisions

I chose to use a singelton model for the trip plan. Since we didn't have user accounts, I wanted to simplify things by having a global trip entity which allows for it o be created and edited from multiple chats. I also chose to mimic how most LLM-s work and make the homepage a new chat page which enabels crating a chat only after something is written and creates it after the message is submitted. The initial setup was such that the new chat button immediately created a new conversation that could then be left empty. This also allwoed me to implement proper conversation names.

I also implemented title generation to run in parallel with the main agent response after the first message. This keeps latency minimal since the user doesn't wait for a second sequential LLM call, and by isolating title errors with an internal .catch(), a failure in title generation will never delay or crash the main chat reply.

## 4. Ambiguities

I was unsure of what to do regarding which visa is required for a country. There isn't a free REST API that can provide the answe to that question, so I thought about creating a custom json file that would contain the most commonly searched countries and their requirements, but I decided that that idea wasn't trustworthy enough, as there was a possibility that the file would contain incorect data from the start, adn the fear that the data wouldn't be updated regularly, and then a user could get incorrect information for such a delicate matter. I also thought about using the web_search tool of OpenRouter, but ultimately decided against it as I wasn't sure about the operating costs of those API calls and also had doubts about the datas validity. In the end I decided on instructing the model to give a general message to the user containing guidence from known info and telling them to check with their local embassy. This was added to the system prompt.

I also wasn't sure how I wa supposed to implement the user+s created trip. First it was included in every conversation and was always available. Later I added it as a dedicated trip page which makes it more readily available. After doing so, it didn't make sense to always have the trip visible inside every conversation, so I made it a collapsible right side panel inside the chat, which is hidden by default but becomes visible after a trip is created or updated. This alo makes it cleaner on mobiel as it overlay the whoel screen.

## 5. AI usage

Firstly I had Claude Code go through the whole repostiry and analyse the requirements. After that I suggested my tech stack, worked it out and then started planning the architecture. Plan mdoe was used for the initial separation of theimplementation into phases and subphases, which were each implemented one by one. I also used plan mdoe for every new major edition to the app.

Subagents were also used to perform background tasks and analyze the frontend and backend separately. This way the context asn't too cluttered. After a plan wasfinalized, I choose to manually acccept each change that Claude Code suggested, in order to both check the change and gain a better udnerstanding of the whole process. I also asked Cluade Code to show me each commit message before approving it.

Claude Code wproved to also be a remarkable tool for testing purposes, as it was able to fully test both the functionalities and performance of the app.

## 6. Known limitations

The visa issue is a known limtiation as it wasn't really handled and the chatbot simply tells the user some general information. This also doesn't occure 100% of the time and could probably be implemented more thoroughly. The user can also have only one active trip, which was a deliberate choice but is a limitation.

Another limitation is that the whole chat context is sent to the model everytime, which means that latency and token use will exponentially increase overtime.

## 7. Beyond the spec (optional)

I added a tool which wasn't specified that checks if there are any public holidays in the destination country. Suggestion chips were also added to the app to enhacne the users experience while chatting and provide them with examples. I also included the option for users to rename a covnersation or pin it, influenced by how most LLM-s do it.
