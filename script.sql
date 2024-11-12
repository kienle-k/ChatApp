CREATE DATABASE IF NOT EXISTS chatAppDB;

USE chatAppDB;

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups table
CREATE TABLE IF NOT EXISTS `groups` (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);



-- Chat messages table
CREATE TABLE IF NOT EXISTS `chat_messages` (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT,
    receiver_group_id INT,
    message TEXT NOT NULL,
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




-- Create example users
INSERT IGNORE INTO `users` (username, email, password)
VALUES ('admin_example', 'admin@example.com', 'securepassword');

INSERT IGNORE INTO `users` (username, email, password)
VALUES ('user2_example', 'user2@example.com', 'user2_password');

INSERT IGNORE INTO `users` (username, email, password)
VALUES ('user3_example', 'user3@example.com', 'user3_password');


-- Create group + chat
INSERT IGNORE INTO `groups` (group_name)
VALUES ('Study Group');

-- Assuming user with ID 2 and 3 exist
INSERT IGNORE INTO `group_members` (group_id, user_id)
VALUES (1, 2);  -- User 2 joins Study Group

INSERT IGNORE INTO `group_members` (group_id, user_id)
VALUES (1, 3);  -- User 3 joins Study Group

-- Create example chat message (individual)
INSERT IGNORE INTO `chat_messages` (sender_id, receiver_id, message)
VALUES (2, 3, 'Hi there! How are you?');

-- Create example group message
INSERT IGNORE INTO `chat_messages` (sender_id, receiver_group_id, message)
VALUES (2, 1, 'Hello everyone, welcome to the group!');  -- Group ID referenced correctly

-- Create example for sending file (individual)
INSERT IGNORE INTO `files` (sender_id, receiver_id, file_name, file_url, file_type, file_size)
VALUES (2, 3, 'holiday_photo.jpg', 'https://example.com/files/holiday_photo.jpg', 'image/jpeg', 102400);

-- Create example of sending file to group
INSERT IGNORE INTO `files` (sender_id, receiver_group_id, file_name, file_url, file_type, file_size)
VALUES (2, 1, 'team_meeting_agenda.pdf', 'https://example.com/files/team_meeting_agenda.pdf', 'application/pdf', 204800);
