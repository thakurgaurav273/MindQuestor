import { useRef, useEffect } from "react";
import ChatBubble from "./ui/ChatBubble";

const MessageList = ({ messages }: { messages: { text: string; timeStamp: number; isUser?: boolean }[] }) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if(listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={listRef} className="flex flex-col overflow-y-auto p-4 space-y-1 h-[80%] bg-[whitesmoke] rounded-t">
      {messages.length === 0 ? <p className="text-gray-500 text-center mt-10">No messages yet</p> : null}
      {messages.map((msg, index) => (
        <ChatBubble key={index} {...msg} />
      ))}
    </div>
  );
};

export default MessageList;