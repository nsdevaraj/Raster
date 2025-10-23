import { AppShell } from '@components/layout/AppShell.jsx';
import { AppHeader } from '@components/layout/AppHeader.jsx';
import { Sidebar } from '@components/layout/Sidebar.jsx';
import { MainContent } from '@components/layout/MainContent.jsx';
import { AppRoutes } from '@routes/AppRoutes.jsx';

export default function App() {
  return (
    <AppShell header={<AppHeader />} sidebar={<Sidebar />}>
      <MainContent>
        <AppRoutes />
      </MainContent>
    </AppShell>
  );
}
