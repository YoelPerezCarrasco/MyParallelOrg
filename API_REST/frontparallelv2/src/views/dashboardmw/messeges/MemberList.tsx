import React from 'react';
import {
  MDBCard,
  MDBCardBody,
  MDBTypography,
  MDBListGroup,
  MDBListGroupItem,
  MDBBadge,
  MDBIcon
} from 'mdb-react-ui-kit';

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

const MemberList: React.FC<MemberListProps> = ({ members, onSelectMember, selectedMember }) => {
  return (
    <MDBCard style={{ width: '100%', maxWidth: '1000px' }}> {/* Ancho máximo ajustado */}
      <MDBCardBody>
        <h5 className="font-weight-bold mb-3 text-center text-lg-start">Miembros</h5>
        <MDBListGroup flush className="mb-0">
          {members.map((member) => (
            <MDBListGroupItem
              key={member.id}
              className={`p-2 border-bottom ${
                selectedMember?.id === member.id ? 'bg-light' : ''
              }`}
              onClick={() => onSelectMember(member)}
              style={{ cursor: 'pointer', minWidth: '100%' }} // Asegurar que ocupe el 100%
            >
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex flex-row align-items-center">
                  <img
                    src={member.avatar || 'https://via.placeholder.com/60'}
                    alt="avatar"
                    className="rounded-circle shadow-1-strong me-3"
                    width="50"
                  />
                  <div style={{ minWidth: '0', width: '100%' }}>
                    <p className="fw-bold mb-0" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {member.name}
                    </p>
                    <p className="small text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {member.lastMessage}
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <p className="small text-muted mb-1">{member.lastMessageTime}</p>
                  {member.unreadMessages > 0 && (
                    <MDBBadge color="danger" className="float-end">
                      {member.unreadMessages}
                    </MDBBadge>
                  )}
                </div>
              </div>
            </MDBListGroupItem>
          ))}
        </MDBListGroup>
      </MDBCardBody>
    </MDBCard>
  );
};

export default MemberList;
