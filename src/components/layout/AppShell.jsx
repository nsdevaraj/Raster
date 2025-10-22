import styled from '@emotion/styled';

const Shell = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: ${({ theme }) => `${theme.layout.sidebarWidth} 1fr`};
  grid-template-rows: ${({ theme }) => `${theme.layout.headerHeight} 1fr`};
  grid-template-areas:
    'header header'
    'sidebar content';
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
    grid-template-rows: ${({ theme }) => `${theme.layout.headerHeight} auto auto`};
    grid-template-areas:
      'header'
      'sidebar'
      'content';
  }
`;

const HeaderRegion = styled.header`
  grid-area: header;
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing(6)} ${({ theme }) => theme.spacing(8)};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  box-shadow: ${({ theme }) => theme.shadows.inset};
  position: sticky;
  top: 0;
  z-index: 10;
`;

const SidebarRegion = styled.aside`
  grid-area: sidebar;
  padding: ${({ theme }) => theme.spacing(8)};
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  overflow-y: auto;

  @media (max-width: 960px) {
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const ContentRegion = styled.section`
  grid-area: content;
  padding: ${({ theme }) => theme.spacing(10)};
  overflow-y: auto;
`;

export function AppShell({ header, sidebar, children }) {
  return (
    <Shell>
      {header ? <HeaderRegion>{header}</HeaderRegion> : null}
      {sidebar ? <SidebarRegion>{sidebar}</SidebarRegion> : null}
      <ContentRegion>{children}</ContentRegion>
    </Shell>
  );
}
