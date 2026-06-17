import { createFileRoute } from '@tanstack/react-router';

import { PlaygroundApp } from '#/components/playground/playground-app';

export const Route = createFileRoute('/')({
  component: IndexPage,
});

function IndexPage() {
  return <PlaygroundApp />;
}
