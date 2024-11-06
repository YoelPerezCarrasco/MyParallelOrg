// components/Message.tsx
import React from "react";
import { MDBCard, MDBCardHeader, MDBCardBody, MDBIcon } from "mdb-react-ui-kit";

interface MessageProps {
  senderName: string;
  senderAvatar: string;
  message: string;
  time: string;
  isOwnMessage: boolean;
}

const Message: React.FC<MessageProps> = ({
  senderName,
  senderAvatar,
  message,
  time,
  isOwnMessage,
}) => {
  return (
    <li className="d-flex justify-content-between mb-4">
      {!isOwnMessage && (
        <img
          src={senderAvatar}
          alt="avatar"
          className="rounded-circle d-flex align-self-start me-3 shadow-1-strong"
          width="60"
        />
      )}
      <MDBCard className={isOwnMessage ? "w-100" : ""}>
        <MDBCardHeader className="d-flex justify-content-between p-3">
          <p className="fw-bold mb-0">{senderName}</p>
          <p className="text-muted small mb-0">
            <MDBIcon far icon="clock" /> {time}
          </p>
        </MDBCardHeader>
        <MDBCardBody>
          <p className="mb-0">{message}</p>
        </MDBCardBody>
      </MDBCard>
      {isOwnMessage && (
        <img
          src={senderAvatar}
          alt="avatar"
          className="rounded-circle d-flex align-self-start ms-3 shadow-1-strong"
          width="60"
        />
      )}
    </li>
  );
};

export default Message;
