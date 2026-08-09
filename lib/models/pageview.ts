import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const pageViewSchema = new Schema(
  {
    path: {
      type: String,
      required: true,
      index: true,
    },
    referrer: {
      type: String,
      default: "",
    },
    ua: {
      type: String,
      default: "",
    },
    /** Hashed IP so we can de-duplicate without storing raw IPs. */
    ipHash: {
      type: String,
      default: "",
    },
    clerkId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

pageViewSchema.index({ createdAt: 1 });
// Page views are analytics noise after ~90 days; expire them automatically.
pageViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
// Admin overview counts per-path and per-IP hashes over time windows.
pageViewSchema.index({ path: 1, createdAt: -1 });
pageViewSchema.index({ ipHash: 1, createdAt: -1 });

export type PageView = InferSchemaType<typeof pageViewSchema>;

const PageViewModel: Model<PageView> =
  (models.PageView as Model<PageView>) ??
  model<PageView>("PageView", pageViewSchema);

export default PageViewModel;
