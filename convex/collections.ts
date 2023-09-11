import { MutationCtx, QueryCtx, mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function getUserFromCtx(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  return user;
}

export const get = query({
  handler: async (ctx) => {
    console.log("ctx", await ctx.auth.getUserIdentity());
    return await ctx.db.query("recipes").collect();
  },
});

export const addToCollection = mutation({
  args: {
    recipeId: v.id("recipes"),
  },
  handler: async (ctx, { recipeId }) => {
    const user = await getUserFromCtx(ctx);

    if (!user) {
      throw new Error("Unauthenticated call to mutation");
    }

    const userId = user._id;

    if (!userId) {
      throw new Error("Not logged in");
    }

    return ctx.db.insert("userRecipe", { userId, recipeId });
  },
});

export const removeFromCollection = mutation({
  args: {
    recipeId: v.id("recipes"),
  },
  handler: async (ctx, { recipeId }) => {
    const user = await getUserFromCtx(ctx);

    if (!user) {
      return null;
    }

    const userRecipe = await ctx.db
      .query("userRecipe")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("recipeId"), recipeId))
      .first();

    if (!userRecipe) {
      return null;
    }

    return ctx.db.delete(userRecipe._id);
  },
});

export const getCollection = query({
  handler: async (ctx) => {
    const user = await getUserFromCtx(ctx);

    if (!user) {
      return [];
    }

    const userRecipes = await ctx.db
      .query("userRecipe")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();
    const recipeIds = userRecipes.map((i) => i.recipeId);
    const recipes = await Promise.all(recipeIds.map(ctx.db.get));

    return recipes;
  },
});

export const isInCollection = query({
  args: {
    recipeId: v.id("recipes"),
  },
  handler: async (ctx, { recipeId }) => {
    const user = await getUserFromCtx(ctx);

    if (!user) {
      return false;
    }

    const userRecipes = await ctx.db
      .query("userRecipe")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    const recipeIds = userRecipes.map((i) => i.recipeId);

    return recipeIds.includes(recipeId);
  },
});
