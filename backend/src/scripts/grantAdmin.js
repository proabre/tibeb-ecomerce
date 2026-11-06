import "dotenv/config";

import mongoose from "mongoose";
import User from "../models/User.js";

const email = process.argv[2]?.trim().toLowerCase();

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Usage: npm run admin:grant -- <account-email>");
}

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is required to grant admin access.");
}

try {
  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOneAndUpdate(
    { email },
    { $addToSet: { roles: "admin" } },
    { returnDocument: "after", runValidators: true },
  ).select("name email roles status");

  if (!user) {
    throw new Error(`No account found for ${email}. Create the account before granting admin access.`);
  }

  console.log(
    `Admin role granted to ${user.email}. Current roles: ${user.roles.join(", ")}.`,
  );
  console.log("Sign out and sign back in to refresh the account's role in the app.");
} finally {
  await mongoose.disconnect();
}
