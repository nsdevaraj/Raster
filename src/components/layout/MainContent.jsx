import styled from '@emotion/styled';

const Container = styled.main`
  max-width: ${({ theme }) => theme.layout.maxWidth || '1200px'};
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(6)};
`;

export function MainContent({ children }) {
  return <Container>{children}</Container>;
}
