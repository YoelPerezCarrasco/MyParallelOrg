import React, { useState, ChangeEvent } from 'react';
import axios from 'axios';
import Marquee from "./magicui/marquee";
import ReviewCard from "./ReviewCard";

interface User {
    id: number;
    username: string;
    avatar_url: string;
    html_url: string;
}

const MarqueeDemo: React.FC = () => {
    const [orgName, setOrgName] = useState<string>('');
    const [users, setUsers] = useState<User[]>([]);

    const fetchOrgUsers = () => {
        axios.get<{ users: User[] }>(`http://localhost:8000/org-users/${orgName}`)
            .then(response => {
                setUsers(response.data.users);
            })
            .catch(error => {
                console.error("There was an error fetching the users from GitHub!", error);
            });
    };

    const handleOrgNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setOrgName(e.target.value);
    };

    const handleFetchUsers = () => {
        if (orgName) {
            fetchOrgUsers();
        }
    };

    const firstRow = users.slice(0, Math.ceil(users.length / 2));
    const secondRow = users.slice(Math.ceil(users.length / 2));

    return (
        <div className="container">
            <div className="input-section">
                <input
                    type="text"
                    value={orgName}
                    onChange={handleOrgNameChange}
                    placeholder="GitHub organization"
                    className="input"
                />
                <button onClick={handleFetchUsers} className="button">
                    Aceptar
                </button>
            </div>
            <div className="marquee-section">
                <Marquee pauseOnHover className="[--duration:20s]">
                    {firstRow.map((user) => (
                        <ReviewCard
                            key={user.id}
                            img={user.avatar_url}
                            name={user.username}
                            username={user.username}
                            body="This is a GitHub user."
                        />
                    ))}
                </Marquee>
                <Marquee reverse pauseOnHover className="[--duration:20s]">
                    {secondRow.map((user) => (
                        <ReviewCard
                            key={user.id}
                            img={user.avatar_url}
                            name={user.username}
                            username={user.username}
                            body="This is a GitHub user."
                        />
                    ))}
                </Marquee>
            </div>
            <div className="gradient-left"></div>
            <div className="gradient-right"></div>
        </div>
    );
};

export default MarqueeDemo;
