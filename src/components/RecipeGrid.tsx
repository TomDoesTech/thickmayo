import NextLink from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Doc } from "../../convex/_generated/dataModel";

function RecipeCard({ recipe }: { recipe: Doc<"recipes"> }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>
          {recipe.cuisine && (
            <p className="text-sm text-gray-500">{recipe.cuisine}</p>
          )}
          <NextLink href={`/recipes/${recipe.slug}`}>{recipe.title}</NextLink>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <CardDescription className="flex-1 mb-4">
          {recipe.description}
        </CardDescription>
        {recipe.prepTime && <p className="text-xs">Prep: {recipe.prepTime}</p>}
        {recipe.cookTime && <p className="text-xs">Cook: {recipe.cookTime}</p>}
      </CardContent>
    </Card>
  );
}

export function RecipeGrid({ recipes }: { recipes: Doc<"recipes">[] }) {
  if (!recipes) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {recipes?.map((r) => {
        if (!r) return null;
        return <RecipeCard key={r._id} recipe={r} />;
      })}
    </div>
  );
}
