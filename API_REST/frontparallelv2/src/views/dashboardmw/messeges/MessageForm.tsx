// components/MessageForm.tsx
import React from "react";
import { MDBTextArea, MDBBtn } from "mdb-react-ui-kit";

interface MessageFormProps {
  onSendMessage: (message: string) => void;
}

const MessageForm: React.FC<MessageFormProps> = ({ onSendMessage }) => {
  const [message, setMessage] = React.useState("");

  const handleSend = () => {
    if (message.trim() !== "") {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <>
      <MDBTextArea
        label="Mensaje"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <MDBBtn color="info" rounded className="float-end mt-2" onClick={handleSend}>
        Enviar
      </MDBBtn>
    </>
  );
};

export default MessageForm;
