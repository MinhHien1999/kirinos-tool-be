import mongoose from "mongoose";

const { Schema } = mongoose;

const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    description: String, // optional

    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null, // for subcategories
    },
  },
  {
    timestamps: true,
  }
);

// index SEO
CategorySchema.index({ name: "text", slug: "text" });

export default mongoose.models.Category ||
  mongoose.model("Category", CategorySchema);