import styled from '@emotion/styled';
import { UploadPanel } from '@components/panels/UploadPanel.jsx';
import { ConversionSettingsPanel } from '@components/panels/ConversionSettingsPanel.jsx';

const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(6)};
`;

export function Sidebar() {
  return (
    <SidebarContainer>
      <UploadPanel />
      <ConversionSettingsPanel />
    </SidebarContainer>
  );
}
