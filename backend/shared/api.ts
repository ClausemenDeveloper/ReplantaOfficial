
/**
 * Shared code between client and server
 * Useful to share types and pure functions between client and server
 *
 */


export interface SharedUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "client" | "collaborator";
}

