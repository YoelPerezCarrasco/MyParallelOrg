import React, { useState, useEffect } from "react";
import { MDBContainer, MDBRow, MDBCol } from "mdb-react-ui-kit";
import MemberList from "./MemberList";
import ChatWindow from "./ChatWindow";

interface Member {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadMessages: number;
}

interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatar: string;
  message: string;
  time: string;
  isOwnMessage: boolean;
}

const Messages: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Obtener el usuario actual
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  // Obtener la lista de miembros disponibles para chatear
  useEffect(() => {
    const fetchMembers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        // Manejar la falta de token, redirigir al login, etc.
        return;
      }

      try {
        let response;
        if (currentUser.role === "manager") {
          // Manager: Obtener todos los miembros de la organización
          response = await fetch(`http://localhost:8000/messages/members`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } else {
          // Worker: Obtener los miembros de su grupo asignado
          response = await fetch(
            `http://localhost:8000/messages/members?group_id=${currentUser.assignedGroupId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        }

        if (response.ok) {
          const data = await response.json();
          setMembers(data);
        } else {
          console.error("Error al obtener los miembros");
        }
      } catch (error) {
        console.error("Error en la petición:", error);
      }
    };

    fetchMembers();
  }, [currentUser]);

  // Manejar la selección de un miembro para chatear
  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    // Obtener los mensajes con este miembro
    fetchMessages(member.id);
  };

  // Obtener los mensajes con el miembro seleccionado
  const fetchMessages = async (memberId: number) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `http://localhost:8000/messages/conversation/${memberId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(
          data.map((msg: any) => ({
            ...msg,
            isOwnMessage: msg.senderId === currentUser.id,
          }))
        );
      } else {
        console.error("Error al obtener los mensajes");
      }
    } catch (error) {
      console.error("Error en la petición:", error);
    }
  };

  // Manejar el envío de un mensaje
  const handleSendMessage = async (messageText: string) => {
    if (!selectedMember) return;
    const token = localStorage.getItem("token");

    const newMessage = {
      senderId: currentUser.id,
      receiverId: selectedMember.id,
      message: messageText,
      time: new Date().toISOString(),
    };

    try {
      const response = await fetch(`http://localhost:8000/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newMessage),
      });

      if (response.ok) {
        // Actualizar la lista de mensajes
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: Date.now(),
            senderId: currentUser.id,
            senderName: currentUser.username,
            senderAvatar: currentUser.avatar_url,
            message: messageText,
            time: new Date().toISOString(),
            isOwnMessage: true,
          },
        ]);
      } else {
        console.error("Error al enviar el mensaje");
      }
    } catch (error) {
      console.error("Error en la petición:", error);
    }
  };

  return (
    <MDBContainer fluid className="py-5" style={{ backgroundColor: "#eee" }}>
      <MDBRow>
        <MDBCol md="4" lg="3" xl="3" className="mb-4 mb-md-0">
          <h5 className="font-weight-bold mb-3 text-center text-lg-start">
            Miembros
          </h5>
          <MemberList
            members={members}
            onSelectMember={handleSelectMember}
            selectedMember={selectedMember}
          />
        </MDBCol>

        <MDBCol md="8" lg="9" xl="9">
          {selectedMember ? (
            <ChatWindow
              messages={messages}
              onSendMessage={handleSendMessage}
              member={selectedMember}
            />
          ) : (
            <div className="text-center">
              <p>Selecciona un miembro para comenzar a chatear</p>
            </div>
          )}
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
};

export default Messages;
