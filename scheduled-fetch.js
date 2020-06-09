require("dotenv").config();
const fetch = require("node-fetch");

const authHeader = `Basic ${Buffer.from(`${process.env.USERNAME}:${process.env.PASSWORD}`).toString("base64")}`;
fetch("https://api.smart-me.com/api/Devices", {
    "method": "GET",
    "headers": {
        "Authorization": authHeader,
        "Accept": "application/json"
    }
}).then(res => res.json()).then(body => {
    console.log(JSON.stringify(body, null, 2));
})