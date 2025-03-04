-- Drop the database (optional, comment out if you want to keep other tables not managed here)
DROP DATABASE IF EXISTS doctors_db;

-- Create the database
CREATE DATABASE doctors_db;
USE doctors_db;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS doctors;

-- Create doctors table
CREATE TABLE doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(50) NOT NULL,
    city VARCHAR(50) NOT NULL,
    image VARCHAR(200),
    gender ENUM('Male', 'Female'),
    address VARCHAR(255),
    phone VARCHAR(20)
);

-- Create users table with is_doctor and doctor_id
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_doctor BOOLEAN DEFAULT FALSE,
    doctor_id INT,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Create appointments table
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATETIME NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Pending',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Create favorites table
CREATE TABLE favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    UNIQUE KEY unique_favorite (user_id, doctor_id) -- Prevent duplicate favorites
);

-- Insert sample doctors
INSERT INTO doctors (name, specialty, city, image, gender, address, phone) VALUES
    ('Dr. Ahmed Ben Salah', 'Cardiology', 'Tunis', NULL, 'Male', '123 Tunis St', '555-0101'),
    ('Dr. Fatima Zouaoui', 'Dentistry', 'Sousse', NULL, 'Female', '456 Sousse Rd', '555-0102'),
    ('Dr. Leila Khelifi', 'Pediatrics', 'Sfax', NULL, 'Female', '789 Sfax Ave', '555-0103');

-- Insert sample users
INSERT INTO users (first_name, last_name, email, password, is_doctor, doctor_id) VALUES
    ('John', 'Doe', 'john.doe@example.com', '$2b$12$Y38/DBOQWeVbUT4k1QARYO7p6jbMZDitPxauGYgNoBV147Wsiw9ry', FALSE, NULL), -- Regular user (hashed password: 'password123')
    ('Jane', 'Doe', 'jane.doe@example.com', '$2b$12$MpJmK6HgMHAVZ.bklVc9BeWlJARypI8pzaHqHwFNIAsCq93D0quVW', FALSE, NULL), -- Regular user (hashed password: 'password456')
    ('Ahmed', 'Ben Salah', 'ahmed.bensalah@example.com', '$2b$12$KMrxd4qFG6KDVeqQ0ujKluwbK/GLwIftCzAdFCZ7gOQnoAqcP/VZm', TRUE, 1); -- Doctor user (hashed password: 'doctor123')

-- Insert sample appointments
INSERT INTO appointments (user_id, doctor_id, appointment_date, status) VALUES
    (1, 1, '2025-03-03 08:00:00', 'Pending'), -- John books with Dr. Ahmed
    (2, 1, '2025-03-03 09:00:00', 'Pending'), -- Jane books with Dr. Ahmed
    (1, 2, '2025-03-04 10:00:00', 'Confirmed'); -- John books with Dr. Fatima

-- Insert sample favorites
INSERT INTO favorites (user_id, doctor_id) VALUES
    (1, 2), -- John favorites Dr. Fatima
    (2, 3); -- Jane favorites Dr. Leila

-- Verify the data
SELECT * FROM doctors;
SELECT * FROM users;
SELECT * FROM appointments;
SELECT * FROM favorites;