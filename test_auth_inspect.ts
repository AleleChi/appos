// @ts-nocheck
import { auth } from "./api/_lib/auth";

async function test() {
  console.log("BETTER_AUTH_URL Env in test:", process.env.BETTER_AUTH_URL);
  
  const fn = auth.options?.trustedOrigins;
  if (typeof fn === "function") {
    const fakeRequest = new Request("http://localhost:3000/api/auth/signup", {
      headers: {
        "x-original-origin": "https://ais-dev-xzkkrcqbafb7so277yu7yz-698460065788.europe-west2.run.app",
        "x-original-referer": "https://ais-dev-xzkkrcqbafb7so277yu7yz-698460065788.europe-west2.run.app/"
      }
    });
    console.log("Testing getDynamicTrustedOrigins with fake request...");
    const result = fn(fakeRequest);
    console.log("Resulting trusted origins:", result);
  } else {
    console.log("trustedOrigins is not a function:", fn);
  }
  
  process.exit(0);
}

test();

