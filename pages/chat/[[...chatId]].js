import Head from "next/head";
import { streamReader } from "openai-edge-stream";
import { useState } from "react";
import { v4 as uuid } from "uuid";

import { ChatSidebar } from "components/ChatSidebar";
import { Message } from "components/Message";

export default function ChatPage() {
  const [incomingMessage, setIncomingMessage] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [newChatMessages, setNewChatMessages] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGeneratingResponse(true);
    setNewChatMessages((prevState) => {
      const newChatMessages = [
        ...prevState,
        {
          _id: uuid(),
          role: "user",
          content: messageText,
        },
      ];
      return newChatMessages;
    });

    setMessageText("");

    const response = await fetch("/api/chat/sendMessage", {
      method: "POST",
      headers: {
        "Content-Type": "aplication/json",
      },
      body: JSON.stringify({ message: messageText }),
    });
    const data = response.body;

    if (!data) return;

    const reader = data.getReader();
    await streamReader(reader, (message) => {
      
      setIncomingMessage((s) => `${s}${message.content}`);
    });
    setIsGeneratingResponse(false);
  };
  return (
    <>
      <Head>
        <title>New Chat</title>
      </Head>
      <div className="grid h-screen grid-cols-[260px_1fr] text-white">
        <ChatSidebar />
        <div className="flex flex-col bg-gray-700 overflow-hidden">
          <div className="flex-1 overflow-auto">
            {newChatMessages.map((message) => (
              <Message
                key={message._id}
                role={message.role}
                content={message.content}
              />
            ))}
            {incomingMessage ? (
              <Message role={"assistant"} content={incomingMessage} />
            ) : null}
          </div>
          <footer className="bg-gray-800 p-10">
            <form onSubmit={handleSubmit}>
              <fieldset className="flex gap-2" disabled={isGeneratingResponse}>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full resize-none rounded-md bg-gray-700 text-white
                focus:border-emerald-500 focus:bg-gray-600 focus:outline-emerald-500"
                  placeholder={isGeneratingResponse
                     ? '' : "Send a message..." }
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
