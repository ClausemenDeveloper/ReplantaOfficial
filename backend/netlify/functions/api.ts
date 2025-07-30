import serverless from "serverless-http";
import type { Handler } from "@netlify/functions";
import { createServer } from "../../server";

// Para garantir tipagem, instale: npm install --save-dev @types/serverless-http @netlify/functions

export const handler = serverless(createServer());
