import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      maxlength: 254,
    },

    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      maxlength: 20,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    roles: {
      type: [String],
      enum: ["customer", "seller", "admin", "delivery"],
      default: ["customer"],
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "suspended", "pending"],
      default: "active",
      index: true,
    },

    avatar: {
      type: String,
      default: null,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.pre("validate", function () {
  if (!this.email && !this.phone) {
    this.invalidate(
      "email",
      "Provide at least an email address or phone number.",
    );
  }

  if (this.roles?.length === 0) {
    this.invalidate("roles", "At least one role is required.");
  }
});

userSchema.index({ status: 1, createdAt: -1 });

const User = mongoose.model("User", userSchema);

export default User;
