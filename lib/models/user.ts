import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
    },
    plan: {
      type: String,
      enum: ["free", "pro", "one-time"],
      default: "free",
      index: true,
    },
    /** null = unlimited (Pro). Otherwise remaining analyses for free / one-time. */
    analysesRemaining: {
      type: Number,
      default: 2,
    },
    /** Unused purchased one-time analyses. Drains before free analyses on use. */
    paidAnalysesRemaining: {
      type: Number,
      default: 0,
    },
    /** When the monthly free/pro allowance resets. null for one-time / never-resetting. */
    planResetAt: {
      type: Date,
      default: null,
    },
    /** One-time pack expires never; set once purchased. */
    oneTimePurchasedAt: {
      type: Date,
      default: null,
    },
    /** Razorpay order id of the latest in-flight / last purchase. */
    razorpayOrderId: {
      type: String,
      default: null,
    },
    /** Razorpay subscription id when pro was purchased as a subscription. */
    razorpaySubscriptionId: {
      type: String,
      default: null,
    },
    /** Target analysis id for a pending ₹199 full-analysis unlock. */
    razorpayAnalysisId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Payment callbacks look users up by pending order/subscription id; index them.
userSchema.index({ razorpayOrderId: 1 });
userSchema.index({ razorpaySubscriptionId: 1 });

export type User = InferSchemaType<typeof userSchema>;

const UserModel: Model<User> =
  (models.User as Model<User>) ?? model<User>("User", userSchema);

export default UserModel;
