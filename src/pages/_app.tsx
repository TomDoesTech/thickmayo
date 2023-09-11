import type { AppProps } from "next/app";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import "@/styles/globals.css";
import { Header } from "@/components/Header";

const convex = new ConvexReactClient(
  "https://diligent-hippopotamus-730.convex.cloud" as string
);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <Header />
        <main className="flex min-h-screen flex-col items-center justify-between p-24 w-full max-w-4xl m-auto">
          <Component {...pageProps} />
        </main>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
