import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

export function AddToCollection({ recipeId }: { recipeId: string }) {
  const { isAuthenticated } = useConvexAuth();

  const add = useMutation(api.collections.addToCollection);
  const remove = useMutation(api.collections.removeFromCollection);
  const isInCollection = useQuery(api.collections.isInCollection, {
    recipeId,
  });

  function handleAddToCollection() {
    add({ recipeId });
  }

  function handleRemoveFromCollection() {
    remove({ recipeId });
  }

  if (!isAuthenticated || isInCollection === undefined) {
    return null;
  }

  if (isInCollection) {
    return (
      <Button onClick={handleRemoveFromCollection} variant="ghost" size="icon">
        <AiFillHeart className="fill-red-600 text-4xl" />
      </Button>
    );
  }

  return (
    <Button onClick={handleAddToCollection} variant="ghost" size="icon">
      <AiOutlineHeart className="fill-red-500 text-4xl" />
    </Button>
  );
}
