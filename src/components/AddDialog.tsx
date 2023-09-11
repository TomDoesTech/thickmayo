import { Inter } from "next/font/google";
import { AiFillPlusSquare } from "react-icons/ai";
import { Lobster } from "next/font/google";
import { SignInButton } from "@clerk/clerk-react";
import { useAction, useConvexAuth, useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "./ui/input";
import { api } from "../../convex/_generated/api";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";
import { Close } from "@radix-ui/react-dialog";

export function AddDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const add = useAction(api.recipes.add);

  const form = useForm({
    defaultValues: {
      url: "",
    },
  });

  async function onSubmit(e) {
    setIsLoading(true);

    try {
      const result = await add(e);

      if (result.slug) {
        router.push(`/recipes/${result.slug}`);
      }
    } catch (e) {
    } finally {
      form.reset();
      setIsLoading(false);
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <AiFillPlusSquare className="text-3xl fill-primary cursor-pointer" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add recipe</DialogTitle>
          <DialogDescription>
            Provide a URL to a recipe and we'll make it readable.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel />
                  <FormControl>
                    <Input
                      disabled={isLoading}
                      placeholder="https://www.bbcgoodfood.com/recipes/vegan-chocolate-cake"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="w-full flex justify-end">
              <Button disabled={isLoading} type="submit">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Make it readable
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
