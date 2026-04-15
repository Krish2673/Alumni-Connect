import dotenv from "dotenv"
import app from "./src/app.js"
import connectDB from "./src/config/db.js"

dotenv.config()

// Leading/trailing spaces after `=` in .env break JWT verification and CORS matching.
for (const key of [
  "JWT_SECRET",
  "REFRESH_TOKEN_SECRET",
  "MONGODB_URI",
  "DB_NAME",
  "CORS_ORIGIN",
  "PORT",
]) {
  if (typeof process.env[key] === "string") {
    process.env[key] = process.env[key].trim()
  }
}

if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
  console.error("Set JWT_SECRET and REFRESH_TOKEN_SECRET in .env (no spaces after =).")
  process.exit(1)
}

const Port = Number(process.env.PORT) || 8000

connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.log("Error:", err)
      throw err
    })

    app.listen(Port, () => {
      console.log(`Server is running on port ${Port}`)
    })
  })
  .catch((err) => {
    console.log("Failed to connect to DB:", err)
  })