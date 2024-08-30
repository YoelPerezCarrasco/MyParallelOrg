import React, { useState, useEffect } from 'react';
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
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        axios.get<User[]>('http://localhost:8000/users/')
            .then(response => {
                setUsers(response.data);
            })
            .catch(error => {
                console.error("There was an error fetching the users!", error);
            });
    }, []);

    const firstRow = users.slice(0, Math.ceil(users.length / 2));
    const secondRow = users.slice(Math.ceil(users.length / 2));

    return (
        <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background py-20 md:shadow-xl">
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
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white dark:from-background"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white dark:from-background"></div>
        </div>
    );
};

export default MarqueeDemo;
