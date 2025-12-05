/**
 * This converts a Uint8Array into URL safe base64
 *
 * This shoudl be equivalent to Ruby's `Base64.urlsafe_encode64`.
 * See [this relevant bit from Doorkeeper][1].
 *
 * [1]: https://github.com/doorkeeper-gem/doorkeeper/blob/0aa94c5a82035ec4840785156760a2930e5de27a/lib/doorkeeper/models/access_grant_mixin.rb#L92
 */
export const urlSafeBase64 = (arr: Uint8Array) => {
  const arrAsString = String.fromCharCode(...arr);

  // We need to be browser compatible so we use btoa
  const base64 = btoa(arrAsString);

  return base64.replace(/\+/g, '-').replace(/\//g, '_');
};
