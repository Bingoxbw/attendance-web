"use client";

import { AppShell } from "@/components/AppShell";
import { QaBoard } from "@/components/QaBoard";

export default function AdminQaPage() {
  return (
    <AppShell>
      <QaBoard canModerate />
    </AppShell>
  );
}
