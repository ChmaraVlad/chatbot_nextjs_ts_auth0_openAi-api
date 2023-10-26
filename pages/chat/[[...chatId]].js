import Head from "next/head";
import { streamReader } from "openai-edge-stream";
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { useRouter } from "next/router";
import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";

import { ChatSidebar } from "components/ChatSidebar";
import { Message } from "components/Message";


export default function ChatPage({ chatId, title, messages=[] }) {
  const [newChatId, setNewChatId] = useState(null);
  const [incomingMessage, setIncomingMessage] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [newChatMessages, setNewChatMessages] = useState([]);
  const [fullMessage, setFullMessage] = useState("");

  const router = useRouter();

  // if we created a new chat
  useEffect(() => {
    if (!isGeneratingResponse && newChatId) {
      router.push(`/chat/${newChatId}`);
      setNewChatId(null);
    }
  }, [newChatId, isGeneratingResponse, router]);
  
  // when uor route changes
  useEffect(()=>{
    setNewChatMessages('')
    setNewChatId(null);
  },[chatId])

  // save the newly streamed message to new chat message
  useEffect(() => {
    if (!isGeneratingResponse && fullMessage) {
      setNewChatMessages((prev) => [
        ...prev,
        {
          _id: uuid(),
          role: "assistant",
          content: fullMessage,
        },
      ]);
    }
  }, [isGeneratingResponse, fullMessage]);

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
    let content = ''

    const response = await fetch("/api/chat/sendMessage", {
      method: "POST",
      headers: {
        "Content-Type": "aplication/json",
      },
      body: JSON.stringify({ message: messageText, chatId }),
    });
    const data = response.body;

    if (!data) return;

    const reader = data.getReader();
    await streamReader(reader, (message) => {
      if (message.event === "newChatId") {
        setNewChatId(message.content);
      } else {
        setIncomingMessage((s) => `${s}${message.content}`);
        content = content + message.content
      }
    });
    setIsGeneratingResponse(false);
    setIncomingMessage('')
    setFullMessage(content)
  };

  const allMessages = [...messages, ...newChatMessages]
  return (
    <>
      <Head>
        <title>New Chat</title>
      </Head>
      <div className="grid h-screen grid-cols-[260px_1fr] text-white">
        <ChatSidebar chatId={chatId} />
        <div className="flex flex-col overflow-hidden bg-gray-700">
          <div className="flex-1 overflow-auto">
            {allMessages.map((message) => (
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
                  placeholder={isGeneratingResponse ? "" : "Send a message..."}
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

export const getServerSideProps = async (ctx) => {
  const chatId = ctx.params?.chatId?.[0] || null;
  
  if (chatId) {
    const {user} = await getSession(ctx.req, ctx.res)
    const client = await clientPromise
    const db = client.db('ChattyPete')
    const chat = await db.collection('chats').findOne({
      userId: user.sub,
      _id: new ObjectId(chatId)
    })
    return {
      props: {
        chatId,
        title: chat?.title || null,
        messages: chat?.messages.map(msg => ({
          ...msg,
          _id: uuid()
        })) || []
      },
    };
  }
  return {
    props: {},
  };
};
