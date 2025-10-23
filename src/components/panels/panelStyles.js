import styled from '@emotion/styled';

export const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};
  padding: ${({ theme }) => theme.spacing(6)};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

export const PanelHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const PanelTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
`;

export const PanelBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(4)};

  p {
    margin: 0;
    line-height: 1.6;
  }
`;
