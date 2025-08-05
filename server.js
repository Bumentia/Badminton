// server.js: Backend server using Node.js, Express, and MySQL

const express = require('express');
const cors = require('cors');
const mysql = require('mysql');

const app = express();
const port = process.env.PORT || 3001; // Use environment variable for port

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Enable JSON body parsing

// ** IMPORTANT: REPLACE THE FOLLOWING PLACEHOLDERS WITH YOUR ACTUAL DATABASE CREDENTIALS **
// These credentials are for your hosted MySQL database, NOT localhost.
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'YOUR_DATABASE_HOST', // e.g., 'us-west-2.rds.amazonaws.com'
    user: 'YOUR_DATABASE_USER',   // e.g., 'admin'
    password: 'YOUR_DATABASE_PASSWORD', // e.g., 'your-strong-password'
    database: 'YOUR_DATABASE_NAME' // e.g., 'badminton_booking'
});

// Endpoint to fetch all bookings
app.get('/api/bookings', (req, res) => {
    const query = 'SELECT id, studentName, parentName, phone, coach, day, selectedDays, time, registrationType, paymentStatus, timestamp FROM bookings';
    pool.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching data from MySQL:', error);
            return res.status(500).json({ error: 'Failed to fetch bookings' });
        }
        res.status(200).json(results);
    });
});

// Endpoint to add new bookings
app.post('/api/bookings', (req, res) => {
    const newBookings = req.body;
    if (!Array.isArray(newBookings) || newBookings.length === 0) {
        return res.status(400).json({ error: 'Invalid data format. Expected an array of bookings.' });
    }

    const query = 'INSERT INTO bookings (studentName, parentName, phone, coach, day, selectedDays, time, registrationType, paymentStatus) VALUES ?';
    const values = newBookings.map(booking => [
        booking.studentName,
        booking.parentName,
        booking.phone,
        booking.coach,
        booking.registrationType === 'weekly' ? booking.day : null,
        booking.registrationType === 'monthly' ? JSON.stringify(booking.selectedDays) : null,
        booking.time,
        booking.registrationType,
        booking.paymentStatus
    ]);

    pool.query(query, [values], (error, results) => {
        if (error) {
            console.error('Error inserting data into MySQL:', error);
            return res.status(500).json({ error: 'Failed to save bookings' });
        }
        res.status(201).json({ message: 'Bookings saved successfully', insertId: results.insertId });
    });
});


// Endpoint to update payment status
app.put('/api/bookings/:id', (req, res) => {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    
    if (!paymentStatus) {
        return res.status(400).json({ error: 'Payment status is required' });
    }

    const query = 'UPDATE bookings SET paymentStatus = ? WHERE id = ?';
    pool.query(query, [paymentStatus, id], (error, results) => {
        if (error) {
            console.error('Error updating payment status:', error);
            return res.status(500).json({ error: 'Failed to update payment status' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        res.status(200).json({ message: 'Payment status updated successfully' });
    });
});


// Endpoint to delete a booking
app.delete('/api/bookings/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM bookings WHERE id = ?';
    pool.query(query, [id], (error, results) => {
        if (error) {
            console.error('Error deleting data from MySQL:', error);
            return res.status(500).json({ error: 'Failed to cancel registration' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        res.status(200).json({ message: 'Registration cancelled successfully' });
    });
});

// Check database connection and start server
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL...');
    connection.release();

    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
});