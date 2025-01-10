// boilerplate for express
const express = require("express");
const app = express();
const port = 3000;
const mysql = require('mysql2')
const cors = require("cors");
const dotenv = require("dotenv").config();

app.use(cors())

// Establish MySQL database connection
const connection = mysql.createConnection({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.DBNAME
});

connection.connect(err => {
    if (err) {
        console.error("Error connecting to the database:", err);
    } else {
        console.log("Connected to the MySQL database.");
    }
});

// Create an end point that displays all data of all pokemon
app.get('/all', (req, res) => {
    const query = `SELECT * FROM pokemon`;
    connection.query(query, (error, results) => {
        if (error) {
            console.error("Error executing query:", error);
        }
        res.send(results)
    });
});

// Create an end point that displays the names of all pokemon
app.get('/all/names', (req, res) => {
   const query =  `SELECT name FROM pokemon`
    connection.query(query, (error, results) => {
        if (error) {
            console.error("Error executing query:", error);
        }
        res.send(results)
    });
});

// Create an endpoint that displays the name of all pokemon with the parameter as primary type
// If a product cannot be found, the API will respond with a 404 status code and a message that informs the user
app.get('/:primary', (req, res) => {
    const params = req.params.primary
    const query =  `SELECT name FROM pokemon WHERE primary_type = ?`
    connection.query(query, [params], (error, results) => {
        if (error) {
            console.error("Error executing query:", error);
            res.status(404).send(`Error: Cannot fetch data ${error}`)
        }
        res.send(results)
    });
});

// Create an endpoint that displays all pokemon with a speed higher than the provided parameter
app.get('/all/:speed', (req, res) => {
    const speed = req.params.speed
    const query =  `SELECT name, speed FROM pokemon WHERE speed > ?`
    connection.query(query, [speed], (error, results) => {
        if (error) {
            console.error("Error executing query:", error);
            res.status(404).send(`Error: Cannot fetch data ${error}`)
        }
        res.send(results)
    });
});

// Create an endpoint that returns the Pokémon with the highest value for the specified stat.
// The available stats are "attack," "defense," "hp," "specialAttack," "specialDefense," and "speed."
app.get('/highest/:stat', (req, res) => {
    const stat = req.params.stat
    const allowedStats = ['attack', 'defense', 'hp', 'special_attack', 'special_defence', 'speed']
    const query =  `SELECT name, ${stat} FROM pokemon ORDER BY ${stat} DESC LIMIT 1`
    connection.query(query, [stat], (error, results) => {
        if (!allowedStats) {
            res.status(400).send("Bad request: Use another stat")
        }
        if (error) {
            console.error("Error executing query:", error);
            res.status(404).send(`Error: Cannot fetch data ${error}`)
        }
        res.send(results)
    });
});

// Create an endpoint that displays all pokemon with a speed higher than the average of the provided primary type
app.get('/average/:primaryType', (req, res) => {
    const primaryType = req.params.primaryType
    const query =  `
    WITH average_speed_by_primary_type AS (
    SELECT name, primary_type, speed, AVG(speed) OVER (PARTITION BY primary_type) AS avg_speed
    FROM pokemon
    )
    SELECT name, primary_type, speed, avg_speed
    FROM average_speed_by_primary_type
    WHERE speed > avg_speed AND primary_type = '${primaryType}'`
    connection.query(query, [primaryType], (error, results) => {
        if (error) {
            console.error("Error executing query:", error);
            res.status(404).send(`Error: Cannot fetch data ${error}`)
        }
        res.send(results)
    });
});

// Create an endpoint that displays the total of a provided pokemons stat
// I.E. if :name = Bulbasaur.
// Bulbasaur has the following stats: 45, 65, 65, 49, 49,45.
// Return the sum of those numbers.
app.get('/total/:name', (req, res) => {
    const name = req.params.name
    const query = `SELECT SUM(speed + special_defence + special_attack + defence + attack + hp) AS sum_of_stats
    FROM pokemon
    WHERE name = ?`
    connection.query(query, [name], (error, result) => {
        if (error) {
            console.error("Error executing query:", error);
            res.status(404).send(`Error: Cannot fetch data ${error}`)
        }
        res.send(result)
    });
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
});
