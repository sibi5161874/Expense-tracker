'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { feedbackSchema, type FeedbackInput } from '@repo/shared/schemas';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FileDropzone } from '@/components/shared/FileDropzone';

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_MESSAGE_LENGTH = 5000;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export default function HelpFeedbackPage() {
  const { user } = useAuth();
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FeedbackInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { name: '', email: '', message: '' },
  });

  useEffect(() => {
    if (!user) return;
    form.reset({
      name: (user.user_metadata?.full_name as string | undefined) ?? '',
      email: user.email ?? '',
      message: '',
    });
  }, [user, form]);

  useEffect(() => {
    if (!screenshotFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(screenshotFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [screenshotFile]);

  function handleScreenshotFile(file: File) {
    if (file.size > MAX_SCREENSHOT_BYTES) {
      toast.error('Screenshot is too large — max 5MB.');
      return;
    }
    setScreenshotFile(file);
  }

  async function onSubmit(data: FeedbackInput) {
    setIsSubmitting(true);
    try {
      const screenshot = screenshotFile
        ? {
            dataUrl: await readFileAsDataUrl(screenshotFile),
            filename: screenshotFile.name,
            contentType: screenshotFile.type,
          }
        : undefined;

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, screenshot }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Could not send feedback, please try again.');
      }

      toast.success('Thanks for the feedback — it just landed in the inbox.');
      form.setValue('message', '');
      setScreenshotFile(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send feedback, please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const messageLength = form.watch('message')?.length ?? 0;

  return (
    <div>
      <PageHeader title="Feedback" description="Found a bug or have an idea? Send it straight to the developer." />

      <div className="bg-card border-border/60 max-w-lg rounded-2xl border p-5 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea rows={5} maxLength={MAX_MESSAGE_LENGTH} {...field} />
                  </FormControl>
                  <p className="text-muted-foreground text-right text-xs">
                    {messageLength}/{MAX_MESSAGE_LENGTH}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <p className="text-sm font-medium">Screenshot (optional)</p>
              {screenshotFile ? (
                <div className="border-border/60 mt-1.5 flex items-center gap-3 rounded-xl border p-3">
                  {previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not a remote image
                    <img src={previewUrl} alt="Screenshot preview" className="size-12 rounded-lg object-cover" />
                  )}
                  <span className="text-muted-foreground flex-1 truncate text-sm">{screenshotFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setScreenshotFile(null)}
                    aria-label="Remove screenshot"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="mt-1.5">
                  <FileDropzone
                    onFile={handleScreenshotFile}
                    accept="image/*"
                    title="Attach a screenshot"
                    subtitle="PNG or JPG, up to 5MB"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
