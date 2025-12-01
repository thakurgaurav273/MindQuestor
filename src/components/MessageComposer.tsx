import { SendIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { getSocket } from "../App";
import { useUserStore } from "../store/userStore";

const MessageComposer = ({ onSend, quizId }: { onSend: (msg: string) => void, quizId?: string }) => {
  const [message, setMessage] = useState("");
  const socket = getSocket();

useEffect(() => {
  socket.on("message:received", (data) => {
    console.log("data received", data);
  });
  return () => {
    socket.off("message:received");
  };
}, [socket]);

  const user: any = useUserStore((state) => state.user);
  const handleSend = async () => {

    const response = await fetch('http://localhost:8080/message/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quizId: quizId,
        senderId: user.userId,
        username: user.username,
        text: message,
        messageType: 'TEXT'
      })
    });

    console.log(response);
    setMessage("");
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="flex p-2 border-t border-gray-300">
      <input
        type="text"
        placeholder="Share your message"
        className="flex-grow border border-gray-400 rounded-l px-3 py-2 focus:outline-none"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button onClick={handleSend} className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-r flex items-center justify-center">
        <SendIcon size={20} />
      </button>
    </div>
  );
};


export default MessageComposer;