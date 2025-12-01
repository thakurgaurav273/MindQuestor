const ChatBubble = ({ text, timeStamp, isUser }: { text: string; timeStamp: number; isUser?: boolean }) => {
  // Format timestamp to a readable time (e.g., hh:mm AM/PM)
  const formatTime = (time: number) => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex flex-col max-w-xs p-2 rounded-lg mb-2 ${isUser ? 'self-end bg-blue-400 text-white' : 'self-start bg-gray-300 text-black'}`}>
      <p className="break-words">{text}</p>
      <span className="text-xs text-gray-700 self-end mt-1">{formatTime(timeStamp)}</span>
    </div>
  );
};

export default ChatBubble;