'use client';

import { useState } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Blobatar } from '@blobatar/react';
import { UserPlus, Users } from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface ContactSelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
}

/**
 * Freeform text field (same shape `cashbook.counterparty` always had) plus an assistive
 * contacts picker — typing a brand-new name still works exactly as before, the dropdown just
 * saves re-typing a counterparty used previously and shows each one with a Blobatar avatar.
 * Picking a contact, or adding a new one inline, just sets this field's string value; no
 * `contact_id` is stored anywhere, so every existing cashbook query keeps working unchanged.
 */
export function ContactSelectField<T extends FieldValues>({
  control,
  name,
  label = 'Counterparty',
  placeholder = 'e.g., John Doe, Company XYZ',
}: ContactSelectFieldProps<T>) {
  const { data: contacts, createContact, isCreating } = useContacts();
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const currentValue = typeof field.value === 'string' ? field.value : '';
        const filtered = (contacts ?? []).filter((c) =>
          c.name.toLowerCase().includes(currentValue.trim().toLowerCase())
        );
        const exactMatch = (contacts ?? []).some(
          (c) => c.name.toLowerCase() === currentValue.trim().toLowerCase()
        );

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <div className="relative">
                <Input placeholder={placeholder} {...field} value={currentValue} className="pr-10" />
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger
                    type="button"
                    className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-2 flex items-center"
                    aria-label="Pick a saved contact"
                  >
                    <Users className="size-4" />
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 space-y-1 p-2">
                    <div className="max-h-56 space-y-0.5 overflow-y-auto">
                      {filtered.length === 0 && (
                        <p className="text-muted-foreground px-2 py-3 text-center text-xs">
                          {contacts && contacts.length > 0 ? 'No matching contacts.' : 'No saved contacts yet.'}
                        </p>
                      )}
                      {filtered.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => {
                            field.onChange(contact.name);
                            setOpen(false);
                          }}
                          className="hover:bg-accent flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm"
                        >
                          <Blobatar name={contact.avatar_seed} className="size-6 shrink-0 rounded-full" />
                          <span className="truncate">{contact.name}</span>
                        </button>
                      ))}
                    </div>
                    {currentValue.trim() && !exactMatch && (
                      <button
                        type="button"
                        disabled={isCreating}
                        onClick={async () => {
                          const created = await createContact({ name: currentValue.trim() });
                          field.onChange(created.name);
                          setOpen(false);
                        }}
                        className="text-primary hover:bg-accent flex w-full items-center gap-2 rounded-lg border-t px-2 py-1.5 pt-2 text-left text-sm font-medium disabled:opacity-50"
                      >
                        <UserPlus className="size-4 shrink-0" />
                        <span className="truncate">Add &quot;{currentValue.trim()}&quot; as a contact</span>
                      </button>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
