import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  try {
    const { user } = await getSession(req, res);
    const { chatId, role, content } = JSON.parse(req.body);

    // validation chatId
    let objectId = null;
    try {
      objectId = new ObjectId(chatId);
    } catch (error) {
      res.status(422).json({
        message: "Invalid chatId",
      });
      return;
    }

    // validate message data
    if (!content || typeof content !== "string" 
    || (role === 'user' && content.length > 200)
    || (role === 'assistant' && content.length > 100000)
    ) {
      res.status(422).json({
        message: "Message is required and must be less than 200 characters for user and less then 100 000 for assistant",
      });
      return;
    }

    // validate role
    if (role !== "user" && role !== "assistant") {
      res.status(422).json({
        message: "Role must be either 'assistant' or 'user'",
      });
      return;
    }

    const client = await clientPromise;
    const db = client.db("ChattyPete");
    const chat = await db.collection("chats").findOneAndUpdate(
      { _id: objectId, userId: user.sub },
      {
        $push: {
          messages: {
            role,
            content,
          },
        },
      },
      { returnDocument: "after" }
    );

    res.status(200).json({
      ...chat.value,
      _id: chat.value._id.toString(),
    });
  } catch (error) {
    console.log(
      "ERROR OCCURED IN ADDING NEW MESSAGE TO CHAT => ERROR: ",
      error
    );
    res
      .status(500)
      .json({ message: "ERROR OCCURED WHEN ADDING NEW MESSAGE TO CHAT" });
  }
}
