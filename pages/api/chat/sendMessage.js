import { OpenAIEdgeStream } from "openai-edge-stream";

export const config = {
  runtime: "edge",
};

export default async function handler(req, res) {
  try {
    const { message, chatId: chatIdFromParam } = await req.json();
    let chatId = chatIdFromParam;
    let newChatId = null;

    const initialChatMessage = {
      role: "system",
      content:
        "Your name is Chatty Pete. And incredible inteligent and quick-thinking AI, that always replies with an enthusiastic and positive energy. You were created by Vlad. Your response must be formatted as markdown.",
    };
    if (chatId) {
      // added message in exist chat
      const response = await fetch(
        `${req.headers.get("origin")}/api/chat/addMessageToChat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "aplication/json",
            cookie: req.headers.get("cookie"),
          },
          body: JSON.stringify({
            chatId,
            role: "user",
            content: message,
          }),
        }
      );
    } else {
      // create new chat in Db
      const response = await fetch(
        `${req.headers.get("origin")}/api/chat/createNewChat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "aplication/json",
            cookie: req.headers.get("cookie"),
          },
          body: JSON.stringify({ message }),
        }
      );
      const json = await response.json();
      chatId = json._id;
      newChatId = json._id;
    }
    
    const stream = await OpenAIEdgeStream(
      "https://api.openai.com/v1/chat/completions",
      {
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        method: "POST",
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [initialChatMessage, { content: message, role: "user" }],
          stream: true,
        }),
      },
      {
        onBeforeStream: ({ emit }) => {
          if (newChatId) {
            emit(chatId, "newChatId");
          }
        },
        // adding message from openAI api to chat that was created above
        onAfterStream: async ({ fullContent }) => {
          await fetch(
            `${req.headers.get("origin")}/api/chat/addMessageToChat`,
            {
              method: "POST",
              headers: {
                "Content-Type": "aplication/json",
                cookie: req.headers.get("cookie"),
              },
              body: JSON.stringify({
                chatId,
                role: "assistant",
                content: fullContent,
              }),
            }
          );
        },
      }
    );
    return new Response(stream);
  } catch (error) {
    console.log("error", error);

    return new Response(JSON.stringify(error), {
      status: 400,
      headers: {
        "content-type": "application/json",
      },
    });
  }
}
