import NextLink from "next/link";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/router";
import { Checkbox } from "@/components/ui/checkbox";
import { AddToCollection } from "@/components/AddToCollection";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AiOutlineSend, AiOutlineUser } from "react-icons/ai";
import { useState } from "react";
import { LucideChefHat } from "lucide-react";

export default function RecipePage() {
  const [chefThinking, setChefThinking] = useState(false);
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);

  const slug = router.query.recipeSlug as string;

  const recipe = useQuery(api.recipes.getBySlug, {
    slug,
  });

  const askTheChef = useAction(api.recipes.askTheChef);

  async function ask() {
    setChefThinking(true);
    const payload = {
      role: "user",
      content: question,
    };

    setMessages((m) => [...m, payload]);
    setQuestion("");

    const result = await askTheChef({
      recipeId: recipe._id,
      messages: [...messages, payload],
    });

    setMessages((m) => [
      ...m,
      payload,
      {
        role: "system",
        content: result,
      },
    ]);

    setChefThinking(false);
  }

  if (!recipe) {
    return null;
  }

  return (
    <div>
      <Head>
        <title>{recipe?.title}</title>
      </Head>
      <article className="w-full max-w-4xl m-auto">
        <header className="flex content-between w-full">
          <h1 className="text-3xl mb-8 flex-1">{recipe?.title}</h1>
          <AddToCollection recipeId={recipe._id} />
        </header>

        <section className="mb-4 border-b-2 pb-4">
          <h2 className="text-2xl mb-4">Ingredients</h2>
          <ol>
            {recipe?.ingredients.map((i: string, index: number) => {
              return (
                <li
                  key={`ingredient__${index}`}
                  className="flex items-center mb-2"
                >
                  <Checkbox className="mr-2" />
                  {i}
                </li>
              );
            })}
          </ol>
        </section>

        <section className="mb-4 border-b-2 pb-4">
          <h2 className="text-2xl mb-4">Method</h2>

          <ol className="list-decimal ml-4">
            {recipe?.method.map((i: string, index: number) => {
              return (
                <li key={`method__${index}`} className="mb-2">
                  <Checkbox className="mr-2" />
                  {i}
                </li>
              );
            })}
          </ol>
        </section>

        <section>
          {(recipe.tags || []).map((tag: string, index: number) => {
            return (
              <span
                key={`tag__${index}`}
                className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs text-gray-700 mr-2 mb-2"
              >
                {tag}
              </span>
            );
          })}
        </section>

        <p className="text-sm text-gray-400">
          Source:{" "}
          <span>
            <NextLink
              href={recipe.source}
              target="_blank"
              rel="noopener noreferrer nofollow"
            >
              {recipe.source}
            </NextLink>{" "}
          </span>
        </p>
      </article>

      <section className="w-full max-w-4xl m-auto mt-8">
        <h2 className="text-2xl mb-4">Ask the chef</h2>

        {messages.map((m, index) => {
          return (
            <div key={`message__${index}`} className="flex mb-4">
              <div className="flex-1 flex mr-4">
                <div>
                  {m.role === "system" ? (
                    <LucideChefHat className="text-5xl" />
                  ) : (
                    <AiOutlineUser className="text-2xl" />
                  )}
                </div>

                <p className="ml-4">{m.content}</p>
              </div>
            </div>
          );
        })}

        {chefThinking && (
          <div className="flex mb-4">
            <div className="flex-1 flex mr-4">
              <div>
                <LucideChefHat className="text-5xl" />
              </div>
              <p className="ml-4">
                The chef is thinking
                {Array.from({ length: 3 }).map((_, index) => {
                  return (
                    <span key={`thinking__${index}`} className="animate-ping">
                      .
                    </span>
                  );
                })}
              </p>
            </div>
          </div>
        )}

        <div className="flex">
          <Input
            placeholder="What is the total prep and cooking time?"
            onChange={(e) => setQuestion(e.target.value)}
            value={question}
          />
          <Button variant="outline" size="icon" onClick={ask}>
            <AiOutlineSend />
          </Button>
        </div>
      </section>
    </div>
  );
}
