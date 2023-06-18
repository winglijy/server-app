const express = require('express')
const app = express()
const port = 3001

const Pool = require('pg').Pool
require('dotenv').config()

const Configuration = require('openai').Configuration
const openAiConfig = new Configuration({
    apiKey: process.env.OPEN_AI_KEY 
});
const OpenAIApi = require('openai').OpenAIApi
const openAi = new OpenAIApi(openAiConfig);

// Create a new instance of the Pool
const pool = new Pool({
    // user: 'jing',
    // host: 'localhost',
    // database: 'my_app',
    // password: '',

    user: process.env.DB_USER,
    host: process.env.DB_URL,
    database: process.env.DB_DB,
    password: process.env.DB_PASS,

    // Only enable this code for render.com deployment
    ssl: {
        rejectUnauthorized: false, // Accept self-signed certificates or use a valid CA-signed certificate
      },
    port: 5432, // Replace with your PostgreSQL port


});
console.log("pool user name: ", pool.username);
app.use(express.json()); // Add this line to parse JSON data

const cors = require('cors');
app.use(cors());

app.get('/', (req, res) => {
    res.status(200).send('Hello World!');
})

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log("user name: ", username)

    // Perform the database insert operation here
    // Perform the database insert operation
    const query = {
        text: 'select count(*) from users2 where username = $1 and password = $2',
        values: [username, password],
    };

    pool.query(query)
        .then((result) => {
            const count = result.rows[0].count;
            console.log('Resulting row count is ', count);
            if (count > 0) {
                console.log('Login successful');
                res.sendStatus(200);
            } else {
                console.log('Login failed');
                res.sendStatus(401); // Unauthorized
            }
        })
        .catch((error) => {
            console.error('Error during login:', error);
            res.sendStatus(500);
        });
})

app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;

    console.log('Received registration request:');
    console.log('Username:', username);
    console.log('Email:', email);
    console.log('Password:', password);

    // alert(`Registration successful! Username: ${first_name}, password: ${password}`);

    // Perform the database insert operation here
    // Perform the database insert operation
    const query = {
        text: 'INSERT INTO users2 (username, email, password) VALUES ($1, $2, $3)',
        values: [username, email, password],
    };

    pool.query(query)
        .then(() => {
            console.log('Registration successful');
            res.sendStatus(200);
        })
        .catch((error) => {
            console.error('Error during registration:', error);
            res.sendStatus(500);
        });
  
    // Send a response back to the client
    // res.sendStatus(200);
  });

app.post("/chat", async (req, res) => {
    // const clientMessage = req.body;
    const { clientMessage } = req.body;

    console.log("client message:", clientMessage)

    // res.status(200).json({ completion: "test completion."});

    const chatCompletion = await openAi.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: "You are empathetic listerner, and a Cognitive Behavioral Therapist, your kind and open approach to CBT allows users to confide in you. You ask questions one by one and collect the user's responses to implement the following steps of CBT. Help the user identify troubling situations or conditions in their life. Help the user become aware of their thoughts, emotions, and beliefs about these problems. Using the user's answers to the questions, you identify and categorize negative or inaccurate thinking that is causing the user anguish into one or more of the following CBT-defined categories. Using the user's answers, you ask them to reframe their negative thoughts with your expert advice. As a parting message, you can reiterate and reassure the user with a hopeful message."
            },
            clientMessage
        ],
        temperature: 0.7
    });

    console.log("OpenAI return:", chatCompletion.data.choices[0].message)
    res.status(200).json({ completion: chatCompletion.data.choices[0].message });
});

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
})