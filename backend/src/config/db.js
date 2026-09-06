import mongoose from "mongoose";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
  try {
    const srvRecords = await new Promise((resolve, reject) => {
      dns.resolveSrv(
        "_mongodb._tcp.nexusflow-dev.kkuzak9.mongodb.net",
        (error, records) => {
          if (error) reject(error);
          else resolve(records);
        }
      );
    });

    console.log("MongoDB SRV resolved:", srvRecords.length, "nodes");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;