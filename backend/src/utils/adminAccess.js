export function grantConfiguredAdminRole(user, configuredEmails = process.env.ADMIN_EMAILS) {
  const email = user.email?.trim().toLowerCase();
  const allowedEmails = new Set(
    (configuredEmails || '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );

  if (!email || !allowedEmails.has(email) || user.roles.includes('admin')) {
    return false;
  }

  user.roles.push('admin');
  return true;
}
