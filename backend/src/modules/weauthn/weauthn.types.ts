// auto-generated
// src/modules/weauthn/weauthn.types.ts

export interface RegisterCredentialInput {
  userId: string;
}

export interface VerifyRegistrationInput {
  userId: string;
  credential: any;
}

export interface AuthenticateInput {
  credential: any;
}