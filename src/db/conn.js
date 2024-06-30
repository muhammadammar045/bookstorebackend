import mongoose from "mongoose"
import { DB_NAME } from "../constants/constants.js"

const dbConnection = async () => {
    try {
        const db = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`Database HostName : ${db.connection.host}`)
        console.log(`Connected to Database ${DB_NAME} Successfully`)
    } catch (error) {
        console.error(`Database Connection Failed : ${error}`)
    }
}

export default dbConnection;