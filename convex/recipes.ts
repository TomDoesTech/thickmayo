import OpenAI from "openai";
import { customAlphabet } from "nanoid";
import { internal } from "./_generated/api";
import {
  MutationCtx,
  QueryCtx,
  action,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

const nanoid = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  6
);

function toSlug(input: string, maxLength = 60) {
  let slug = input
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length > maxLength) {
    slug = slug.slice(0, maxLength);
  }

  return `${slug}-${nanoid()}`;
}

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
});

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

export const fetchResults = internalQuery({
  args: { ids: v.array(v.id("recipes")) },
  handler: async (ctx, args) => {
    const results = [];
    for (const id of args.ids) {
      const doc = await ctx.db.get(id);
      if (doc === null) {
        continue;
      }

      results.push(doc);
    }
    return results;
  },
});

export const search = action({
  args: {
    search: v.string(),
  },
  handler: async (ctx, args) => {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: args.search,
    });

    const results = await ctx.vectorSearch("recipes", "by_embedding", {
      vector: embedding.data[0].embedding,
      limit: 16,
    });

    const recipes: Array<Doc<"recipes">> = await ctx.runQuery(
      internal.recipes.fetchResults,
      { ids: results.map((result) => result._id) }
    );

    return recipes;
  },
});

export const get = query({
  handler: async (ctx) => {
    return await ctx.db.query("recipes").collect();
  },
});

export const getBySlug = query({
  args: {
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.slug) {
      return null;
    }

    const res = await ctx.db
      .query("recipes")
      .filter((q) => q.eq(q.field("slug"), args.slug))
      .first();

    return res;
  },
});

export const getBySource = internalQuery({
  args: {
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.source) {
      return null;
    }

    const res = await ctx.db
      .query("recipes")
      .filter((q) => q.eq(q.field("source"), args.source))
      .first();

    return res;
  },
});

export const insertRecipe = internalMutation({
  args: {
    source: v.string(),
    embedding: v.array(v.float64()),
    recipe: v.object({
      title: v.string(),
      description: v.string(),
      cuisine: v.string(),
      cookTime: v.string(),
      ingredients: v.array(v.string()),
      method: v.array(v.string()),
      nutritionalInfo: v.string(),
      prepTime: v.string(),
      tags: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getUserFromCtx(ctx);

    if (!user) {
      return null;
    }

    const payload = {
      ...args.recipe,
      slug: toSlug(args.recipe.title),
      user: user._id,
      source: args.source,
      embedding: args.embedding,
    };

    try {
      const _id = await ctx.db.insert("recipes", payload);

      return { _id, ...payload };
    } catch (e: any) {
      throw new Error(e.message);
    }
  },
});

export const addToCollection = internalMutation({
  args: {
    recipeId: v.id("recipes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("userRecipe", {
      userId: args.userId,
      recipeId: args.recipeId,
    });
  },
});

export const add = action({
  args: {
    url: v.string(),
  },
  handler: async (ctx, { url }) => {
    const user = await ctx.runQuery(internal.users.getUser);

    if (!user) {
      throw new Error("Unauthenticated call to mutation");
    }

    const sourceUrl = new URL(url).href;

    const existing = await ctx.runQuery(internal.recipes.getBySource, {
      source: sourceUrl,
    });

    if (existing) {
      await ctx.runMutation(internal.recipes.addToCollection, {
        recipeId: existing._id,
        userId: user._id,
      });

      return existing;
    }

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You will be provided a link to a recipe. You will need to visit the page and extract the recipe. The recipe should be returned in JSON format and match the following schema:
          {
            title: v.string(),
            description: v.string(),
            cuisine: v.string(),
            cookTime: v.string(),
            ingredients: v.array(v.string()),
            method: v.array(v.string()),
            nutritionalInfo: v.string(),
            prepTime: v.string(),
            tags: v.array(v.string()),
          }

          If the page does not contain a recipe, please return null, otherwise make sure you always return valid JSON. Provide a maximum of 3 tags and make the description a maximum of 100 characters.
          `,
        },
        { role: "user", content: url },
      ],
      model: "gpt-4",
    });

    const message = completion.choices[0].message.content;
    if ([null, "null"].includes(message) || !message) {
      throw new Error("No recipe found");
    }

    let recipeJson = null;
    try {
      recipeJson = JSON.parse(message);
    } catch (e) {
      throw new Error("Invalid JSON");
    }
    const embeddingInput = [
      recipeJson.title,
      recipeJson.description,
      recipeJson.cuisine,
      recipeJson.cookTime,
      recipeJson.tags.join(" "),
    ];

    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: embeddingInput,
    });

    // insert the recipe
    const recipe = await ctx.runMutation(internal.recipes.insertRecipe, {
      recipe: recipeJson,
      source: sourceUrl,
      embedding: embedding.data[0].embedding,
    });

    console.log("recipeId", recipe._id);

    await ctx.runMutation(internal.recipes.addToCollection, {
      recipeId: recipe._id,
      userId: user._id,
    });

    return recipe;
  },
});

export const fetchByIds = internalQuery({
  args: {
    id: v.id("recipes"),
  },
  handler: async (ctx, args) => {
    const res = await ctx.db
      .query("recipes")
      .filter((q) => q.eq(q.field("_id"), args.id))
      .first();

    return res;
  },
});

export const askTheChef = action({
  args: {
    recipeId: v.id("recipes"),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("system")),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const recipe = await ctx.runQuery(internal.recipes.fetchByIds, {
      id: args.recipeId,
    });

    if (recipe.length === 0) {
      throw new Error("Recipe not found");
    }

    const payload = [
      {
        role: "system",
        content: `Here is a recipe for ${recipe.title} with description ${
          recipe.description
        }
        Ingredients:
        ${recipe.ingredients.join("\n")}
        Method:
        ${recipe.method.join("\n")}
       The original recipe can be found at ${recipe.source}
        `,
      },
    ];

    // @ts-ignore

    for (const message of args.messages) {
      payload.push(message);
    }

    console.log("payload", payload);

    const completion = await openai.chat.completions.create({
      messages: payload,
      model: "gpt-4",
    });

    const message = completion.choices[0].message.content;

    return message;
  },
});
