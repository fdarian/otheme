import { createFileRoute } from '@tanstack/react-router';

import { Button } from '#/components/ui/button';

export const Route = createFileRoute('/')({
  component: IndexPage,
});

function IndexPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <h1 className="font-sans text-4xl font-semibold tracking-tight text-foreground">
        otheme playground
      </h1>
      <p className="text-muted-foreground">Theme preview and customization.</p>
      <Button>Get started</Button>
    </main>
  );
}
