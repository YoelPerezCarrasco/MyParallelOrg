import React, { useState, useRef, useEffect } from 'react';
import {
  MDBTypography,
  MDBCard,
  MDBCardBody,
  MDBCardHeader,
  MDBTextArea,
  MDBBtn,
  MDBIcon
} from 'mdb-react-ui-kit';

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
  onSendMessage: (messageText: string) => void;
  member: Member;
  currentUserId: number; // Asegúrate de pasar el ID del usuario actual
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, member, currentUserId }) => {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (messageText.trim() !== '') {
      onSendMessage(messageText);
      setMessageText('');
    }
  };

  return (
    <div>
      <MDBTypography listUnStyled style={{ height: '400px', overflowY: 'auto' }}>
        {messages.map((msg) => (
          <li
            key={msg.id}
            className={`d-flex align-items-start mb-4 ${
              msg.isOwnMessage ? 'flex-row-reverse' : ''
            }`}
          >
            {/* Imagen del usuario */}
            <img
              src={msg.senderAvatar || 'https://via.placeholder.com/60'}
              alt="avatar"
              className="rounded-circle shadow-1-strong"
              width="60"
              style={{
                marginLeft: msg.isOwnMessage ? '15px' : '0',
                marginRight: msg.isOwnMessage ? '0' : '15px',
              }}
            />
  
            {/* Contenido del mensaje */}
            <MDBCard>
              <MDBCardHeader className="d-flex justify-content-between p-3">
                <p className="fw-bold mb-0">{msg.senderName}</p>
                <p className="text-muted small mb-0 ">
                  <MDBIcon far icon="clock" /> {msg.time}
                </p>
              </MDBCardHeader>
              <MDBCardBody>
                <p className="mb-0">{msg.message}</p>
              </MDBCardBody>
            </MDBCard>
          </li>
        ))}
        <div ref={messagesEndRef} />
      </MDBTypography>
  
      <div className="bg-white mb-3">
        <MDBTextArea
          id="textAreaExample"
          rows={2}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
      </div>
      <MDBBtn color="info" rounded className="float-end" onClick={handleSend}>
        Enviar
      </MDBBtn>
    </div>
  );
  
};

export default ChatWindow;
