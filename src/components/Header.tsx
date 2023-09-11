import NextLink from "next/link";
import { Lobster } from "next/font/google";
import { SignInButton } from "@clerk/clerk-react";
import { useConvexAuth } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { AddDialog } from "./AddDialog";
import useStoreUserEffect from "@/hooks/useStoreUserEffect";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { AiOutlineSearch } from "react-icons/ai";
import { useRouter } from "next/router";
import { useState } from "react";

const lobster = Lobster({
  weight: "400",
  subsets: ["latin"],
});

export function Header() {
  const [query, setQuery] = useState("");
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();

  useStoreUserEffect();

  function search() {
    console.log({ query });
    const encoded = encodeURIComponent(query);
    console.log("encoded", encoded);
    // shallow push

    router.push(`?search=${encoded}`, undefined, {
      shallow: true,
    });
  }

  return (
    <header className="w-full relative">
      <div className="text-center w-full max-w-4xl m-auto">
        <p className="text-8xl font-bold leading-none">
          <span className={lobster.className}>Thick</span> Mayo
        </p>
        <p className="mb-4">Recipes without the life story</p>
        <div className="w-full max-w-md m-auto flex">
          <Input
            type="search"
            placeholder="Search..."
            onChange={(e) => setQuery(e.currentTarget.value)}
            value={query}
            className="mr-2"
          />
          <Button onClick={search} variant="ghost">
            <AiOutlineSearch className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="absolute top-0 w-full bg-white/80 border-b-2 px-2 py-2 flex justify-between">
        <nav className="w-full max-w-4xl m-auto flex justify-between">
          <ul className="flex space-x-4">
            <li>
              <NextLink href="/">Home</NextLink>
            </li>
            <li>
              <NextLink href="/collection">Collection</NextLink>
            </li>
          </ul>
          <ul>
            {!isAuthenticated && !isLoading && (
              <li>
                <SignInButton mode="modal" />
              </li>
            )}
            {isAuthenticated && (
              <li>
                <AddDialog />
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
