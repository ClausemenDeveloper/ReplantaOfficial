import serverless from "serverless-http"; // This import is correct, the issue is likely with missing type definitions.

import { createServer } from "../../server";

export const handler = serverless(createServer());
