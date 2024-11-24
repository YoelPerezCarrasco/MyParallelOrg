import React, { useState, useEffect, useMemo } from "react";
import { MDBContainer, MDBRow, MDBCol, MDBSpinner, MDBCardBody, MDBCard } from "mdb-react-ui-kit";
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

interface User {
  id: number;
  username: string;
  avatar_url: string;
}
const Messages: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);

   // Obtener el usuario actual usando useMemo
  const currentUser = useMemo(() => {
    return JSON.parse(localStorage.getItem('authTokens') || '{}');
  }, []);

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
        if (currentUser.is_manager == true) {
          // Manager: Obtener todos los miembros de la organización
          response = await fetch(`http://api/messages/messages/members`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } else {
          // Worker: Obtener los miembros de su grupo asignado
          response = await fetch(
            `http://api/messages/messages/members?group_id=${currentUser.group_id}`,
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
      }finally{
        setLoadingMembers(false);
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
  setLoadingMessages(true);
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(
      `http://api/messages/messages/conversation/${memberId}`,
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
          id: msg.id,
          senderId: msg.sender_id,
          senderName: msg.sender_name,
          senderAvatar: msg.sender_avatar,
          message: msg.message,
          time: new Date(msg.timestamp.replace(/\.\d+/, (match: string | any[]) => match.slice(0, 4))).toLocaleTimeString(),
          isOwnMessage: msg.sender_id === currentUser.id,
        }))
      );
    } else {
      console.error("Error al obtener los mensajes");
    }
  } catch (error) {
    console.error("Error en la petición:", error);
  } finally {
    setLoadingMessages(false);
  }

};

  // Manejar el envío de un mensaje
  const handleSendMessage = async (messageText: string) => {
    if (!selectedMember) return;
    const token = localStorage.getItem("token");

    const newMessage = {
      senderId: currentUser.id,
      receiver_id: selectedMember.id, // Cambiado a receiver_id
      message: messageText,
      time: new Date().toISOString(),
    };

    try {

      const responseUser = await fetch('http://api/auth/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataUser = await responseUser.json();
      if (responseUser.ok && dataUser.id) {
        setUser({
          id: dataUser.id,
          username: dataUser.username,
          avatar_url: dataUser.avatar_url,
        });
      }
      const response = await fetch(`http://api/messages/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newMessage),
      });
      if (response.ok) {
        // Validar que currentUser y user están definidos
        if (!currentUser || !user) {
          console.error("El usuario actual o el receptor no están definidos");
          return;
        }
      
        // Actualizar la lista de mensajes
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: Date.now(), // Generar un ID temporal único
            senderId: currentUser.id,
            senderName: currentUser.username,
            senderAvatar: user.avatar_url || "https://via.placeholder.com/60", // Avatar por defecto si falta
            message: messageText,
            time: new Date().toLocaleTimeString(), // Timestamp actual en formato ISO
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
    <MDBContainer fluid className="py-5" style={{ backgroundColor: "#f7f7f7" }}>
      <MDBRow>
        <MDBCol md="4" lg="4" xl="4" className="mb-8 mb-md-4">
          <MDBCard style={{ width: '100%', maxWidth: '1000px' }}>
            <MDBCardBody>
              <h5 className="mb-7">Chat Grupal</h5>
              {loadingMembers ? (
                <div className="text-center">
                  <MDBSpinner grow color="primary" />
                </div>
              ) : (
                <MemberList
                  members={members}
                  onSelectMember={handleSelectMember}
                  selectedMember={selectedMember}
                />
              )}
            </MDBCardBody>
          </MDBCard>
        </MDBCol>

        <MDBCol md="6" lg="8" xl="8">
          <MDBCard>
            <MDBCardBody style={{ height: '45vh'}}>
              {selectedMember ? (
                loadingMessages ? (
                  <div className="text-center">
                    <MDBSpinner grow color="primary" />
                  </div>
                ) : (
                  <ChatWindow
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    member={selectedMember}
                    currentUserId={currentUser?.id}
                  />
                )
              ) : (
                <div className="text-center">
                  <p>Selecciona un miembro para comenzar a chatear</p>
                </div>
              )}
            </MDBCardBody>
          </MDBCard>
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
};

export default Messages;