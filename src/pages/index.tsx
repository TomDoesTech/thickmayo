import { useAction, useQuery } from "convex/react";
import { Inter } from "next/font/google";
import { api } from "../../convex/_generated/api";
import { RecipeGrid } from "@/components/RecipeGrid";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

function WithSearch({ search }: { search: string }) {
  const [isLoading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const action = useAction(api.recipes.search);

  useEffect(() => {
    async function run() {
      setLoading(true);
      const res = await action({
        search,
      });

      setRecipes(res);
      setLoading(false);
    }

    run();
  }, [search, action]);

  return (
    <div className="w-full">
      <h2 className="mb-4">Search: {search}</h2>

      <RecipeGrid recipes={recipes} />
    </div>
  );
}

function ListAllRecipes() {
  const recipes = useQuery(api.recipes.get);
  return (
    <div>
      <RecipeGrid recipes={recipes} />
    </div>
  );
}

export default function Home() {
  const router = useRouter();

  const searchQuery = router.query.search as string;

  if (searchQuery) {
    return <WithSearch search={searchQuery} />;
  }

  return <ListAllRecipes />;
}
