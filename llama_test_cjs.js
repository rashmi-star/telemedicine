const fetch = require('node-fetch');

const apiKey = "LLM|1050039463644017|ZZzxjun1klZ76kW0xu5Zg4BW5-o";
const url = "https://api.llama.com/v1/chat/completions";
const body = {
  model: "Llama-4-Maverick-17B-128E-Instruct-FP8",
  messages: [
    { role: "user", content: "Hello Llama! Can you give me a quick intro?" }
  ]
};

fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  },
  body: JSON.stringify(body)
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err)); 