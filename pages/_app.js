import Head from "next/head";
import { UserProvider } from "@auth0/nextjs-auth0/client";

import { Outfit } from "next/font/google";

import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

import "../styles/globals.css";

config.autoAddCss = false;

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

function App({ Component, pageProps }) {
  return (
    <>
      <UserProvider>
        <Head>
          <link rel="icon" href="/favicon.png" />
        </Head>
        <main className={`${outfit.variable} font-body`}>
          <Component {...pageProps} />
        </main>
      </UserProvider>
    </>
  );
}

export default App;
