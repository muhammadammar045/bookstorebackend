import dotenv from "dotenv"
import dbConnection from "./db/conn.js"
import app from "./app.js"

dotenv.config({
    path: "../.env"
})

dbConnection()
    .then(() => {
        app.listen(
            process.env.PORT || 5000,
            () => { console.log(`Server is Listening on Port : http://localhost:${process.env.PORT}`) }
        )
    })
    .catch((error) => {
        console.error(`MONGO CONNECTION FAILED : ${error}`)
        process.exit(1)
    })