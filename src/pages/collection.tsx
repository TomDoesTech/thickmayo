import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { RecipeGrid } from "@/components/RecipeGrid";

export default function CollectionPage() {
  const recipes = useQuery(api.collections.getCollection);

  return (
    <div>
      <RecipeGrid recipes={recipes} />
    </div>
  );
}
