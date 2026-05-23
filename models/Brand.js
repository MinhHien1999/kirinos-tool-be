import mongoose from "mongoose";

const { Schema } = mongoose;

const BrandSchema = new Schema(
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

    logo: String, // optional
  },
  {
    timestamps: true,
  }
);

// index SEO
BrandSchema.index({ name: "text", slug: "text" });

export default mongoose.models.Brand ||
  mongoose.model("Brand", BrandSchema);