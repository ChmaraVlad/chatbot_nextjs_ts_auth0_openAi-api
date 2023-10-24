import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "lib/mongodb";
import { ObjectId } from "mongodb";


export default async function handler(req, res) {
    try {
    const { user } = await getSession(req, res);
    
    const client = await clientPromise;
    
    const db = client.db("ChattyPete");
    
    const { chatId, role, content } = JSON.parse(req.body);

    const chat = await db.collection("chats").findOneAndUpdate({
        _id: new ObjectId(chatId),
        userId: user.sub,
    },
    {
        $push: {
            messages: {
                role, content
            }
        }
    },
    {
        returnDocument: 'after'
    });

    res.status(200).json({
        ...chat.value,
        _id: chat.value._id.toString()
    });
    } catch (error) {
    console.log("ERROR OCCURED IN ADDING NEW MESSAGE TO CHAT => ERROR: ", error);
    res
      .status(500)
      .json({ message: "ERROR OCCURED WHEN ADDING NEW MESSAGE TO CHAT" });
    }
}