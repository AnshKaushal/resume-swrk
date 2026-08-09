import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    excerpt: {
      type: String,
      default: "",
    },
    /** Markdown body. */
    content: {
      type: String,
      required: true,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    published: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    author: {
      type: String,
      default: "SWRK",
    },
  },
  {
    timestamps: true,
  }
);

// Published-blog listings filter by published and sort by publishedAt.
blogSchema.index({ published: 1, publishedAt: -1 });

export type BlogPost = InferSchemaType<typeof blogSchema>;

const BlogModel: Model<BlogPost> =
  (models.BlogPost as Model<BlogPost>) ??
  model<BlogPost>("BlogPost", blogSchema);

export default BlogModel;
