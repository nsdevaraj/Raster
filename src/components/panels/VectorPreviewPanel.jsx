import styled from '@emotion/styled';
import { Panel, PanelBody, PanelHeader, PanelTitle } from './panelStyles.js';
import { useAppStore } from '@store/useAppStore.js';

const Placeholder = styled.div`
  display: grid;
  place-items: center;
  min-height: 360px;
  border: 2px dashed rgba(148, 163, 184, 0.25);
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textMuted};
  background: rgba(15, 23, 42, 0.2);
  text-align: center;
  padding: ${({ theme }) => theme.spacing(8)};
  font-size: 0.95rem;
`;

const SvgPreviewContainer = styled.div`
  display: flex;
  justify-content: center;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing(6)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  max-height: 540px;
  overflow: auto;
`;

const SvgWrapper = styled.div`
  width: 100%;
  max-width: 720px;

  svg {
    width: 100%;
    height: auto;
  }
`;

const ExportButton = styled.button`
  align-self: flex-start;
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(6)}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.background};
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`;

export function VectorPreviewPanel() {
  const { vector } = useAppStore((state) => ({
    vector: state.vector,
  }));

  const handleExport = () => {
    if (!vector) return;
    const blob = new Blob([vector], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'vectorized.svg';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Vector Preview</PanelTitle>
        {vector ? <ExportButton onClick={handleExport}>Export SVG</ExportButton> : null}
      </PanelHeader>
      <PanelBody>
        {vector ? (
          <SvgPreviewContainer>
            <SvgWrapper dangerouslySetInnerHTML={{ __html: vector }} />
          </SvgPreviewContainer>
        ) : (
          <Placeholder>
            Upload a raster image to generate a vector preview. Conversion results and optimization analytics will appear
            here.
          </Placeholder>
        )}
      </PanelBody>
    </Panel>
  );
}
