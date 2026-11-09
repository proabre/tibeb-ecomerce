import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const bankInstitutions = new Set([
  "commercial_bank_of_ethiopia",
  "awash_bank",
  "cooperative_bank_of_oromia",
  "enat_bank",
  "amhara_bank",
]);

const payoutMethods = new Set(["telebirr", "cbe_birr", "bank_transfer"]);

function getEncryptionKey(key = process.env.PAYOUT_ACCOUNT_ENCRYPTION_KEY) {
  if (!key) {
    const error = new Error("Payout account encryption is not configured.");
    error.statusCode = 503;
    throw error;
  }

  if (!/^[\da-f]{64}$/i.test(key)) {
    const error = new Error(
      "PAYOUT_ACCOUNT_ENCRYPTION_KEY must be a 32-byte hexadecimal key.",
    );
    error.statusCode = 503;
    throw error;
  }

  return Buffer.from(key, "hex");
}

export function normalizePayoutAccount(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Provide valid payout account details." };
  }

  const { method, institution: rawInstitution } = input;
  const accountName =
    typeof input.accountName === "string" ? input.accountName.trim() : "";
  const rawAccountNumber =
    typeof input.accountNumber === "string" ? input.accountNumber.trim() : "";

  if (!payoutMethods.has(method)) {
    return { error: "Select a supported payout method." };
  }

  if (accountName.length < 2 || accountName.length > 150) {
    return { error: "Account holder name must be between 2 and 150 characters." };
  }

  const accountNumber = rawAccountNumber.replace(/[\s-]/g, "");
  const validNumber =
    method === "bank_transfer"
      ? /^\d{6,34}$/.test(accountNumber)
      : /^\+?\d{9,15}$/.test(accountNumber);

  if (!validNumber) {
    return {
      error:
        method === "bank_transfer"
          ? "Enter a bank account number containing 6 to 34 digits."
          : "Enter a valid mobile money phone number.",
    };
  }

  const institution =
    typeof rawInstitution === "string" && rawInstitution
      ? rawInstitution
      : null;

  if (
    (method === "bank_transfer" &&
      (!institution || !bankInstitutions.has(institution))) ||
    (method !== "bank_transfer" && institution !== null)
  ) {
    return {
      error:
        method === "bank_transfer"
          ? "Select a supported bank."
          : "A bank must only be selected for bank transfer.",
    };
  }

  return {
    value: {
      provider: "chapa",
      method,
      institution,
      accountName,
      accountNumber,
    },
  };
}

export function encryptPayoutAccountNumber(value, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(key), iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);

  return [
    "v1",
    iv.toString("hex"),
    cipher.getAuthTag().toString("hex"),
    ciphertext.toString("hex"),
  ].join(":");
}

export function decryptPayoutAccountNumber(encrypted, key) {
  const [version, ivHex, authTagHex, ciphertextHex] = encrypted.split(":");

  if (
    version !== "v1" ||
    !/^[\da-f]{24}$/i.test(ivHex || "") ||
    !/^[\da-f]{32}$/i.test(authTagHex || "") ||
    !/^(?:[\da-f]{2})+$/i.test(ciphertextHex || "")
  ) {
    throw new Error("Stored payout account number is invalid.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(key),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
