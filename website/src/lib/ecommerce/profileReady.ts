export function isProfileReadyForWelcome(profile: {
  fullName?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  postalCode?: string | null;
}) {
  return Boolean(
    profile.fullName?.trim() &&
      profile.phone?.trim() &&
      profile.addressLine1?.trim() &&
      profile.city?.trim() &&
      profile.postalCode?.trim()
  );
}
