-- Create the database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS doctors_db;
USE doctors_db;

-- Drop existing tables (optional, to start fresh)
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
    gender ENUM('Male', 'Female') DEFAULT NULL
);

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Create appointments table
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATETIME NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Pending',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Create favorites table
CREATE TABLE favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doctor_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    UNIQUE (user_id, doctor_id) -- Prevent duplicate favorites
);

-- Insert sample data into doctors
INSERT INTO doctors (name, specialty, city, image, gender) VALUES
('Dr. Ahmed Ben Salah', 'Cardiology', 'Tunis', NULL, 'Male'),
('Dr. Fatima Zouaoui', 'Dentistry', 'Sousse', NULL, 'Female'),
('Dr. Mohamed Trabelsi', 'Pediatrics', 'Sfax', NULL, 'Male'),
('Dr. Leila Karray', 'Cardiology', 'Tunis', NULL, 'Female'),
('Dr. Samiha Trabelsi', 'Neurology', 'Tunis', NULL, 'Female'),
('Dr. Youssef Hamdi', 'Orthopedics', 'Sfax', NULL, 'Male'),
('Dr. Amina Gharbi', 'Gynecology', 'Sousse', NULL, 'Female'),
('Dr. Khaled Mansour', 'Dermatology', 'Monastir', NULL, 'Male'),
('Dr. Nour El Houda Belhaj', 'Oncology', 'Tunis', NULL, 'Female'),
('Dr. Hassen Chaabani', 'Psychiatry', 'Bizerte', NULL, 'Male'),
('Dr. Rim Jendoubi', 'Pediatrics', 'Sfax', NULL, 'Female'),
('Dr. Tarek Ben Ammar', 'Cardiology', 'Sousse', NULL, 'Male'),
('Dr. Sonia Kefi', 'Endocrinology', 'Tunis', NULL, 'Female'),
('Dr. Fathi Jelassi', 'Gastroenterology', 'Nabeul', NULL, 'Male');

-- Insert sample data into users (passwords are hashed examples from bcrypt)
INSERT INTO users (first_name, last_name, email, password) VALUES
('John', 'Doe', 'john.doe@example.com', '$2b$12$Kix...'), -- Replace with actual hash for 'password123'
('Jane', 'Smith', 'jane.smith@example.com', '$2b$12$Yix...'); -- Replace with actual hash for 'mypassword'

-- Insert sample data into appointments
INSERT INTO appointments (user_id, doctor_id, appointment_date, status) VALUES
(1, 1, '2025-03-01 10:00:00', 'Pending'),  -- John with Dr. Ahmed
(1, 2, '2025-03-02 14:00:00', 'Confirmed'), -- John with Dr. Fatima
(2, 4, '2025-03-03 09:30:00', 'Pending');  -- Jane with Dr. Leila

-- Insert sample data into favorites
INSERT INTO favorites (user_id, doctor_id) VALUES
(1, 1), -- John favorites Dr. Ahmed
(1, 4), -- John favorites Dr. Leila
(2, 2); -- Jane favorites Dr. Fatima

