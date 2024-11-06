// components/ChatWindow.tsx
import React from "react";
import Message from "./Message";
import MessageForm from "./MessageForm";

interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatar: string;
  message: string;
  time: string;
  isOwnMessage: boolean;
}

interface Member {
  id: number;
  name: string;
  avatar: string;
}

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  member: Member;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  member,
}) => {
  return (
    <>
      <h5 className="mb-3">Chat con {member.name}</h5>
      <ul className="list-unstyled">
        {messages.map((msg) => (
          <Message key={msg.id} {...msg} />
        ))}
      </ul>
      <MessageForm onSendMessage={onSendMessage} />
    </>
  );
};

export default ChatWindow;
