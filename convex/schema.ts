import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),

  recipes: defineTable({
    title: v.string(),
    description: v.string(),
    cuisine: v.string(),
    slug: v.string(),
    cookTime: v.string(),
    ingredients: v.array(v.string()),
    method: v.array(v.string()),
    nutritionalInfo: v.string(),
    prepTime: v.string(),
    tags: v.array(v.string()),
    source: v.string(),
    user: v.id("users"),
    embedding: v.array(v.float64()),
  })
    .index("by_slug", ["slug"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["cuisine", "title", "description", "tags"],
    }),

  userRecipe: defineTable({
    userId: v.id("users"),
    recipeId: v.id("recipes"),
  })
    .index("by_user", ["userId"])
    .index("by_recipe", ["recipeId"]),

  comment: defineTable({
    user: v.id("users"),
    recipe: v.id("recipes"),
    text: v.string(),
    createdAt: v.string(),
  }),
});
