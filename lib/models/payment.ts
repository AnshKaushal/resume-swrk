import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const paymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    kind: {
      type: String,
      enum: ["unlock", "one-time", "pro"],
      required: true,
      index: true,
    },
    /** Amount in rupees. */
    amount: {
      type: Number,
      required: true,
    },
    orderId: {
      type: String,
      default: null,
    },
    paymentId: {
      type: String,
      default: null,
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    analysisId: {
      type: String,
      default: null,
    },
    /** Set when a payment.refunded webhook revokes the entitlement. */
    refunded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Unique sparse indexes make recordPayment's find-then-create dedupe race-safe:
// concurrent webhook + confirm writes for the same order/payment/subscription
// can't double-insert and inflate revenue.
paymentSchema.index({ orderId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ paymentId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ subscriptionId: 1 }, { unique: true, sparse: true });

export type Payment = InferSchemaType<typeof paymentSchema>;

const PaymentModel: Model<Payment> =
  (models.Payment as Model<Payment>) ??
  model<Payment>("Payment", paymentSchema);

export default PaymentModel;
