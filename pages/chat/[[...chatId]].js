import { ChatSidebar } from "components/ChatSidebar";
import Head from "next/head";
import { streamReader } from "openai-edge-stream";
import { useState } from "react";

export default function ChatPage() {
  const [incomingMessage, setIncomingMessage] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

 
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('"handleSubmit MESSAGE": - ', messageText);

    const response = await fetch("/api/chat/sendMessage", {
      method: "POST",
      headers: {
        "Content-Type": "aplication/json",
      },
      body: JSON.stringify({ message: messageText }),
    });
    const data = response.body;

    if (!data) return;

    const reader = data.getReader()
    await streamReader(reader, (message) => {
    setIncomingMessage((s) => `${s}${message.content}`);
  });
    
  };
  return (
    <>
      <Head>
        <title>New Chat</title>
      </Head>
      <div className="grid h-screen grid-cols-[260px_1fr] text-white">
        <ChatSidebar />
        <div className="flex flex-col bg-gray-700">
          <div className="flex-1">{incomingMessage}</div>
          <footer className="bg-gray-800 p-10">
            <form onSubmit={handleSubmit}>
              <fieldset className="flex gap-2">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full resize-none rounded-md bg-gray-700 text-white
                focus:border-emerald-500 focus:bg-gray-600 focus:outline-emerald-500"
                  placeholder="Send a message..."
                />
                <button className="btn" type="submit">
                  Send
                </button>
              </fieldset>
            </form>
          </footer>
        </div>
      </div>
    </>
  );
}
