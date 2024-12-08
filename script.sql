DROP DATABASE chatAppDB;

CREATE DATABASE IF NOT EXISTS chatAppDB;


USE chatAppDB;

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    profile_picture VARCHAR(255)
);

-- Groups table
CREATE TABLE IF NOT EXISTS `groups` (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    group_picture VARCHAR(255)
);

-- Group member table
CREATE TABLE IF NOT EXISTS `group_members` (
    user_id INT NOT NULL,
    group_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, group_id),  -- Composite primary key
    FOREIGN KEY (group_id) REFERENCES `groups`(group_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES `users`(id) ON DELETE CASCADE
);


-- Chat messages table
CREATE TABLE IF NOT EXISTS `chat_messages` (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT,
    receiver_group_id INT,
    message TEXT NOT NULL,
    iv VARCHAR(32),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receiver_group_id) REFERENCES `groups`(group_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES `users`(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES `users`(id) ON DELETE CASCADE
);

-- Files table
CREATE TABLE IF NOT EXISTS `files` (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT,  -- If the file is sent to an individual
    receiver_group_id INT, -- If the file is sent to a group
    file_name VARCHAR(255) NOT NULL,  -- Name of the file
    file_url VARCHAR(255) NOT NULL,  -- URL or path where the file is stored
    file_type VARCHAR(50) NOT NULL,  -- MIME type, e.g., image/jpeg, application/pdf
    file_size BIGINT NOT NULL,  -- File size in bytes
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Timestamp of when the file was sent
    FOREIGN KEY (receiver_group_id) REFERENCES `groups`(group_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES `users`(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES `users`(id) ON DELETE CASCADE
);


INSERT INTO `users` (username, email, password, profile_picture) 
VALUES (
    'AI', 
    'ai@example.com', 
    '$2b$10$5HcYkTyrcWOTIFIDHQax6eiCvsdDkBQ4fxKqvz6iXTV5pkpk7QdYm',
    NULL
);

INSERT INTO `users` (username, email, password, profile_picture) 
VALUES (
    'user1', 
    'user1@example.com', 
    '$2b$10$wcpGVGLWMqpvIcxEcTeDb.pzs0CoPtVOCObTY0a3tEtELNrPTJbBq',
    NULL
);

INSERT INTO `users` (username, email, password, profile_picture) 
VALUES (
    'user2', 
    'user2@example.com', 
    '$2b$10$8IFnZ.l7NioeE1y4EX2DXeWBfKKCls7Lkq1Rv/muCzNMu.1eaQyFG',
    NULL
);

INSERT INTO `users` (username, email, password, profile_picture) 
VALUES (
    'user3', 
    'user3@example.com', 
    '$2b$10$9u5qwItj127eMGNkpqJhyuKJU1CqfzIGejkOvyghCHVl1rTPGW8O2',
    NULL
);

INSERT INTO `chat_messages` (sender_id, receiver_id, message, sent_at)
VALUES (2, 3, 'Hey, whats up?', NOW());

INSERT INTO `chat_messages` (sender_id, receiver_id, message, sent_at)
VALUES (2, 4, "Hey, how's your day going?", NOW());


INSERT INTO `chat_messages` (sender_id, receiver_id, message, sent_at)
VALUES (3, 2, 'Not much, how about you?', NOW());

INSERT INTO `chat_messages` (sender_id, receiver_id, message, sent_at)
VALUES (4, 2, 'Pretty good, thanks for asking! How about you?', NOW());



INSERT INTO `chat_messages` (sender_id, receiver_id, message, sent_at)
VALUES (1, 2, 'Hello there, how can I help you?', NOW());

INSERT INTO `chat_messages` (sender_id, receiver_id, message, sent_at)
VALUES (1, 3, 'Hello there, how can I help you?', NOW());

INSERT INTO `chat_messages` (sender_id, receiver_id, message, sent_at)
VALUES (1, 4, 'Hello there, how can I help you?', NOW());