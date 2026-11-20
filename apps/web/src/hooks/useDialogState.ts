"use client";

import * as React from "react";

export interface UseDialogStateOptions {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Hook to manage smooth enter/exit animations for modals that are conditionally
 * rendered by their parent component. It holds local open state so Base-UI can
 * play its exit transition before firing the parent's unmount callback.
 */
export function useDialogState({ onSuccess, onCancel }: UseDialogStateOptions) {
  const [open, setOpen] = React.useState(true);
  const isSuccessRef = React.useRef(false);

  const handleClose = React.useCallback(() => {
    setOpen(false);
  }, []);

  const handleSuccess = React.useCallback(() => {
    isSuccessRef.current = true;
    setOpen(false);
  }, []);

  const onOpenChangeComplete = React.useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        if (isSuccessRef.current) {
          onSuccess?.();
        } else {
          onCancel?.();
        }
      }
    },
    [onSuccess, onCancel]
  );

  return {
    open,
    setOpen,
    handleClose,
    handleSuccess,
    onOpenChangeComplete,
  };
}
