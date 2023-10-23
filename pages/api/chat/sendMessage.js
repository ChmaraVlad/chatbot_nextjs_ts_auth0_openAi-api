import { OpenAIEdgeStream } from "openai-edge-stream";

export const config = {
  runtime: "edge",
};

export default async function handler(req, res) {
  try {
    const { message } = await req.json();

    const initialChatMessage = {
      role: 'system',
      content: 'Your name is Chatty Pete. And incredible inteligent and quick-thinking AI, that always replies with an enthusiastic and positive energy. You were created by Vlad. Your response must be formatted as markdown.'
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
          messages: [initialChatMessage, {content: message, role: 'user'}],
          stream: true,
        }),
      }
    );
    return new Response(stream)
    
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

