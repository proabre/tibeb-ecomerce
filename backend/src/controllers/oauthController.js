import { randomBytes, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import { cookieOptions } from "../middleware/authMiddleware.js";

const stateCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth",
  maxAge: 10 * 60 * 1000,
};

const providerConfig = {
  google: {
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
    callbackPath: "/api/auth/google/callback",
    stateCookie: "oauth_state_google",
  },
  facebook: {
    clientId: () => process.env.FACEBOOK_APP_ID,
    clientSecret: () => process.env.FACEBOOK_APP_SECRET,
    callbackPath: "/api/auth/facebook/callback",
    stateCookie: "oauth_state_facebook",
  },
};

function getProviderConfig(provider) {
  const config = providerConfig[provider];
  const apiBaseUrl = process.env.API_BASE_URL;

  if (!config || !config.clientId() || !config.clientSecret() || !apiBaseUrl) {
    throw new Error(`${provider} sign-in is not configured`);
  }

  return {
    ...config,
    clientId: config.clientId(),
    clientSecret: config.clientSecret(),
    callbackUrl: new URL(config.callbackPath, apiBaseUrl).toString(),
  };
}

function frontendRedirect(result) {
  const clientUrl = process.env.CLIENT_URL;
  if (!clientUrl) throw new Error("Client URL is not configured");

  const redirectUrl = new URL("/", clientUrl);
  redirectUrl.searchParams.set("oauth", result);
  return redirectUrl.toString();
}

function clearStateCookie(res, cookieName) {
  res.clearCookie(cookieName, {
    ...stateCookieOptions,
    maxAge: undefined,
  });
}

function stateMatches(received, expected) {
  if (typeof received !== "string" || typeof expected !== "string") return false;
  const receivedBytes = Buffer.from(received);
  const expectedBytes = Buffer.from(expected);
  return (
    receivedBytes.length === expectedBytes.length &&
    timingSafeEqual(receivedBytes, expectedBytes)
  );
}

export function beginOAuth(provider) {
  return (req, res) => {
    let config;
    try {
      config = getProviderConfig(provider);
    } catch {
      if (process.env.CLIENT_URL) {
        return res.redirect(302, frontendRedirect("error"));
      }
      return res.status(503).json({
        message: `${provider} sign-in is not configured on this server.`,
      });
    }

    const state = randomBytes(32).toString("base64url");
    res.cookie(config.stateCookie, state, stateCookieOptions);

    const authorizationUrl =
      provider === "google"
        ? new URL("https://accounts.google.com/o/oauth2/v2/auth")
        : new URL(
            `https://graph.facebook.com/${process.env.FACEBOOK_GRAPH_VERSION || "v22.0"}/dialog/oauth`,
          );
    authorizationUrl.search = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.callbackUrl,
      response_type: "code",
      scope:
        provider === "google" ? "openid email profile" : "email public_profile",
      state,
      ...(provider === "google" ? { prompt: "select_account" } : {}),
    }).toString();

    return res.redirect(302, authorizationUrl.toString());
  };
}

async function exchangeGoogleCode(code, config) {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.callbackUrl,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResponse.ok) throw new Error("Google token exchange failed");

  const tokens = await tokenResponse.json();
  if (typeof tokens.access_token !== "string") {
    throw new Error("Google did not return an access token");
  }

  const profileResponse = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } },
  );
  if (!profileResponse.ok) throw new Error("Google profile lookup failed");
  const profile = await profileResponse.json();

  if (
    typeof profile.sub !== "string" ||
    typeof profile.email !== "string" ||
    profile.email_verified !== true ||
    typeof profile.name !== "string"
  ) {
    throw new Error("Google did not return a verified email profile");
  }

  return {
    id: profile.sub,
    email: profile.email.toLowerCase(),
    name: profile.name,
    avatar: typeof profile.picture === "string" ? profile.picture : null,
  };
}

async function exchangeFacebookCode(code, config) {
  const graphVersion = process.env.FACEBOOK_GRAPH_VERSION || "v22.0";
  const tokenUrl = new URL(
    `https://graph.facebook.com/${graphVersion}/oauth/access_token`,
  );
  tokenUrl.search = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.callbackUrl,
    code,
  }).toString();

  const tokenResponse = await fetch(tokenUrl);
  if (!tokenResponse.ok) throw new Error("Facebook token exchange failed");
  const tokens = await tokenResponse.json();
  if (typeof tokens.access_token !== "string") {
    throw new Error("Facebook did not return an access token");
  }

  const debugUrl = new URL(
    `https://graph.facebook.com/${graphVersion}/debug_token`,
  );
  debugUrl.search = new URLSearchParams({
    input_token: tokens.access_token,
    access_token: `${config.clientId}|${config.clientSecret}`,
  }).toString();
  const debugResponse = await fetch(debugUrl);
  if (!debugResponse.ok) throw new Error("Facebook token verification failed");
  const debugResult = await debugResponse.json();
  const tokenData = debugResult.data;
  if (
    tokenData?.is_valid !== true ||
    tokenData.app_id !== config.clientId ||
    typeof tokenData.user_id !== "string"
  ) {
    throw new Error("Facebook returned an invalid application token");
  }

  const profileUrl = new URL(`https://graph.facebook.com/${graphVersion}/me`);
  profileUrl.search = new URLSearchParams({
    fields: "id,name,email,picture.type(large)",
    access_token: tokens.access_token,
  }).toString();
  const profileResponse = await fetch(profileUrl);
  if (!profileResponse.ok) throw new Error("Facebook profile lookup failed");
  const profile = await profileResponse.json();

  if (
    typeof profile.id !== "string" ||
    profile.id !== tokenData.user_id ||
    typeof profile.email !== "string" ||
    typeof profile.name !== "string"
  ) {
    throw new Error("Facebook did not return an email profile");
  }

  return {
    id: profile.id,
    email: profile.email.toLowerCase(),
    name: profile.name,
    avatar: typeof profile.picture?.data?.url === "string"
      ? profile.picture.data.url
      : null,
  };
}

async function findOrCreateOAuthUser(provider, profile) {
  const providerField = provider === "google" ? "googleId" : "facebookId";
  let user = await User.findOne({ [providerField]: profile.id }).select(
    "+passwordHash +googleId +facebookId",
  );

  if (!user) {
    user = await User.findOne({ email: profile.email }).select(
      "+passwordHash +googleId +facebookId",
    );
    if (user) {
      if (user[providerField] && user[providerField] !== profile.id) {
        throw new Error("This email is already linked to another provider account");
      }
      user[providerField] = profile.id;
      user.isEmailVerified = true;
      if (!user.avatar && profile.avatar) user.avatar = profile.avatar;
      await user.save();
    } else {
      user = await User.create({
        name: profile.name.trim().slice(0, 100),
        email: profile.email,
        [providerField]: profile.id,
        avatar: profile.avatar,
        roles: ["customer"],
        status: "active",
        isEmailVerified: true,
      });
    }
  }

  if (user.status !== "active") {
    throw new Error("This account is not active");
  }

  user.lastLoginAt = new Date();
  await user.save();
  return user;
}

export function completeOAuth(provider) {
  return async (req, res) => {
    const config = providerConfig[provider];
    if (!config) return res.status(404).end();

    const state = req.query.state;
    const expectedState = req.cookies?.[config.stateCookie];
    clearStateCookie(res, config.stateCookie);

    if (
      req.query.error ||
      typeof req.query.code !== "string" ||
      !stateMatches(state, expectedState)
    ) {
      return res.redirect(302, frontendRedirect("error"));
    }

    try {
      const configured = getProviderConfig(provider);
      const profile =
        provider === "google"
          ? await exchangeGoogleCode(req.query.code, configured)
          : await exchangeFacebookCode(req.query.code, configured);
      const user = await findOrCreateOAuthUser(provider, profile);
      const token = jwt.sign(
        { sub: user._id.toString() },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || "1d",
          algorithm: "HS256",
        },
      );

      res.cookie("token", token, cookieOptions());
      return res.redirect(302, frontendRedirect("success"));
    } catch (error) {
      console.error(`OAuth ${provider} callback failed (${error.name}).`);
      return res.redirect(302, frontendRedirect("error"));
    }
  };
}
