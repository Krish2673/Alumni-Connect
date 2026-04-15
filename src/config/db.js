import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`)
        console.log(`MongoDB Connected with host ${connInstance.connection.host}`)
    }
    catch(err) {
        console.log("Failed to connect to MongoDB:", err);
        process.exit(1);
    }
}

export default connectDB