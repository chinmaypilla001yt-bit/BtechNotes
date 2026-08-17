import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
  onSubmit: (name: string) => Promise<void> | void;
}

export function EntityDialog({
  open,
  onOpenChange,
  title,
  description,
  label = "Name",
  placeholder = "e.g. Data Structures",
  initialValue = "",
  submitLabel = "Create",
  onSubmit,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setError(null);
    }
  }, [open, initialValue]);

  return (
    <Dialog open={open} onOpenChange={(next) => (busy ? undefined : onOpenChange(next))}>
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const name = value.trim();
            if (!name) {
              setError("Please enter a name.");
              return;
            }
            setBusy(true);
            try {
              await onSubmit(name);
              onOpenChange(false);
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          <div className="my-4 space-y-2">
            <Label htmlFor="entity-name">{label}</Label>
            <Input
              id="entity-name"
              autoFocus
              value={value}
              placeholder={placeholder}
              onChange={(event) => setValue(event.target.value)}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
