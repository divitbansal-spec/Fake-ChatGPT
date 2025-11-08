import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/save", (req, res) => {
    fs.writeFileSync("data.json", JSON.stringify(req.body, null, 2));
    res.send({ success: true });
});

app.get("/load", (req, res) => {
    if (fs.existsSync("data.json")) {
        const data = JSON.parse(fs.readFileSync("data.json"));
        res.send(data);
    } else {
        res.send({});
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));
