const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database
app.get("/api/test", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 AS Connected");

        res.json({
            success: true,
            message: "Database connected",
            data: rows[0]
        });

    } catch (err) {
        console.error("Database error:", err);

        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: err.message
        });
    }
});

// Data sensor terbaru
app.get("/api/sensor/latest", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT *
            FROM sensor_data
            ORDER BY id DESC
            LIMIT 1
        `);

        if (rows.length === 0) {
            return res.json({
                success: true,
                message: "No sensor data found",
                data: null
            });
        }

        res.json({
            success: true,
            message: "Success fetching latest sensor data",
            data: rows[0]
        });

    } catch (err) {
        console.error("Latest sensor error:", err);

        res.status(500).json({
            success: false,
            message: "Error fetching latest sensor data",
            error: err.message
        });
    }
});

// History sensor
app.get("/api/sensor/history", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT *
            FROM sensor_data
            ORDER BY id DESC
            LIMIT 100
        `);

        res.json({
            success: true,
            message: "Success fetching sensor history",
            data: rows
        });

    } catch (err) {
        console.error("History sensor error:", err);

        res.status(500).json({
            success: false,
            message: "Error fetching sensor history",
            error: err.message
        });
    }
});

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});