// components/MemberList.tsx
import React from "react";
import { MDBCard, MDBCardBody, MDBTypography } from "mdb-react-ui-kit";

interface Member {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadMessages: number;
}

interface MemberListProps {
  members: Member[];
  onSelectMember: (member: Member) => void;
  selectedMember: Member | null;
}

const MemberList: React.FC<MemberListProps> = ({
  members,
  onSelectMember,
  selectedMember,
}) => {
  return (
    <MDBCard>
      <MDBCardBody>
        <MDBTypography listUnStyled className="mb-0">
          {members.map((member) => (
            <li
              key={member.id}
              className={`p-2 border-bottom ${
                selectedMember && selectedMember.id === member.id
                  ? "bg-info text-white"
                  : ""
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => onSelectMember(member)}
            >
              <div className="d-flex justify-content-between">
                <div className="d-flex flex-row">
                  <img
                    src={member.avatar}
                    alt="avatar"
                    className="rounded-circle d-flex align-self-center me-3 shadow-1-strong"
                    width="60"
                  />
                  <div className="pt-1">
                    <p className="fw-bold mb-0">{member.name}</p>
                    <p className="small text-muted">{member.lastMessage}</p>
                  </div>
                </div>
                <div className="pt-1">
                  <p className="small text-muted mb-1">
                    {member.lastMessageTime}
                  </p>
                  {member.unreadMessages > 0 && (
                    <span className="badge bg-danger float-end">
                      {member.unreadMessages}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </MDBTypography>
      </MDBCardBody>
    </MDBCard>
  );
};

export default MemberList;
