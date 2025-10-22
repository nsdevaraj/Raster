import styled from '@emotion/styled';
import { useAppStore } from '@store/useAppStore.js';

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const Branding = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.span`
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.04em;
`;

const Subtitle = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => `${theme.spacing(2)} ${theme.spacing(4)}`} ;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const StatusIndicator = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ status, theme }) => {
    switch (status) {
      case 'processing':
        return theme.colors.accent;
      case 'success':
        return theme.colors.primary;
      case 'error':
        return '#ef4444';
      default:
        return theme.colors.textMuted;
    }
  }};
`;

function formatStatus(status) {
  if (!status) return 'idle';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function AppHeader() {
  const status = useAppStore((state) => state.status);

  return (
    <HeaderContainer>
      <Branding>
        <Title>Raster to SVG Studio</Title>
        <Subtitle>Trace, optimize, and export vector graphics instantly.</Subtitle>
      </Branding>
      <StatusBadge>
        <StatusIndicator status={status} />
        {formatStatus(status)}
      </StatusBadge>
    </HeaderContainer>
  );
}
