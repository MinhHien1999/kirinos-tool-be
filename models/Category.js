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
      index: true,
    },

    description: String, // optional

    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null, // for subcategories
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// index SEO
CategorySchema.index({ name: "text"});

export default mongoose.models.Category ||
  mongoose.model("Category", CategorySchema);