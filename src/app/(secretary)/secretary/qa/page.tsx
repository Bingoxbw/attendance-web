"use client";

import { SecretaryShell } from "@/components/SecretaryShell";
import { QaBoard } from "@/components/QaBoard";

export default function SecretaryQaPage() {
  return (
    <SecretaryShell>
      <QaBoard canModerate={false} />
    </SecretaryShell>
  );
}
