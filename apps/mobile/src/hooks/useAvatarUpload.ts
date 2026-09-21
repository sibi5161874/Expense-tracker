import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useUserProfile } from "@/hooks/useUserProfile";

const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3MB

function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof globalThis.atob === "function") {
    const binaryString = globalThis.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  const len = base64.length;
  let validLen = len;
  if (base64.charAt(len - 1) === "=") validLen--;
  if (base64.charAt(len - 2) === "=") validLen--;

  const bytes = new Uint8Array(Math.floor((validLen * 3) / 4));
  let cur = 0;
  for (let i = 0; i < len; i += 4) {
    const a = lookup[base64.charCodeAt(i)];
    const b = lookup[base64.charCodeAt(i + 1)];
    const c = lookup[base64.charCodeAt(i + 2)];
    const d = lookup[base64.charCodeAt(i + 3)];

    bytes[cur++] = (a << 2) | (b >> 4);
    if (cur < bytes.length) bytes[cur++] = ((b & 15) << 4) | (c >> 2);
    if (cur < bytes.length) bytes[cur++] = ((c & 3) << 6) | d;
  }
  return bytes;
}

/**
 * Uploads a profile picture to the "avatars" Storage bucket (public, one object per user at
 * "<user_id>/avatar.<ext>", overwritten on re-upload) and saves the resulting public URL onto
 * the user's profile.
 */
export function useAvatarUpload() {
  const { user } = useAuth();
  const supabase = useSupabaseClient();
  const { saveProfile } = useUserProfile();
  const [isUploading, setIsUploading] = useState(false);

  async function pickAndUploadAvatar(): Promise<void> {
    if (!user) throw new Error("Not authenticated");

    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_AVATAR_BYTES) {
      throw new Error("Image is too large — max 3MB.");
    }

    setIsUploading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bytes = base64ToUint8Array(base64);
      const ext = asset.name.split(".").pop()?.toLowerCase() || "jpg";
      const mimeType = asset.mimeType || (ext === "png" ? "image/png" : "image/jpeg");
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, bytes, { upsert: true, contentType: mimeType });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      // Cache-bust query param so the fresh avatar shows immediately
      await saveProfile({ avatar_url: `${publicUrl}?t=${Date.now()}` });
    } finally {
      setIsUploading(false);
    }
  }

  return { pickAndUploadAvatar, isUploading };
}
