import {
  faMessage,
  faPlus,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useEffect, useState } from "react";

export const ChatSidebar = ({ chatId }) => {
  const [chatList, setChatList] = useState([]);

  useEffect(() => {
    const loadChatList = async () => {
      const res = await fetch("/api/chat/getChatList", {
        method: "POST",
      });
      const json = await res.json();
      setChatList(json.chats);
    };
    loadChatList();
  }, [chatId]);

  return (
    <div className="flex flex-col overflow-hidden bg-gray-900">
      <Link
        className="sidebar-menu-item bg-emerald-500 hover:bg-emerald-600"
        href="/chat"
      >
        <FontAwesomeIcon icon={faPlus} />
        New Chat
      </Link>
      <div className="flex-1 overflow-auto bg-gray-950 ">
        {chatList.map((chat) => (
          <Link
            className={`sidebar-menu-item ${
              chatId === chat._id ? "bg-gray-700 hover:bg-gray-700" : ""
            }`}
            href={`/chat/${chat._id}`}
            key={chat._id}
          >
            <FontAwesomeIcon icon={faMessage}  className="text-white/50"/>
            <span
            title={chat.title}
            className="overflow-hidden text-ellipsis whitespace-nowrap"
            >{chat.title}</span>
          </Link>
        ))}
      </div>
      <Link className="sidebar-menu-item" href="/api/auth/logout">
        <FontAwesomeIcon icon={faRightFromBracket} />
        Logout
      </Link>
    </div>
  );
};
