import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseClient } from '@/hooks/useSupabaseClient';
import { useUserProfile } from '@/hooks/useUserProfile';

const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3MB

/** Uploads a profile picture to the "avatars" Storage bucket (public, one object per user at
 * "<user_id>/avatar.<ext>", overwritten on re-upload) and saves the resulting public URL onto
 * the user's profile — the first client-side Storage upload in this codebase, so this is a
 * self-contained place to keep that pattern rather than spreading it across components. */
export function useAvatarUpload() {
  const { user } = useAuth();
  const supabase = useSupabaseClient();
  const { saveProfile } = useUserProfile();
  const [isUploading, setIsUploading] = useState(false);

  async function uploadAvatar(file: File): Promise<void> {
    if (!user) throw new Error('Not authenticated');
    if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
    if (file.size > MAX_AVATAR_BYTES) throw new Error('Image is too large — max 3MB.');

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(path);
      // Cache-bust: same path every time (upsert:true), so without this the browser would
      // keep showing whatever it cached from the previous upload at that exact URL.
      await saveProfile({ avatar_url: `${publicUrl}?t=${Date.now()}` });
    } finally {
      setIsUploading(false);
    }
  }

  return { uploadAvatar, isUploading };
}
