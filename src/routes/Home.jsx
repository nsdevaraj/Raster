import styled from '@emotion/styled';
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@components/panels/panelStyles.js';
import { VectorPreviewPanel } from '@components/panels/VectorPreviewPanel.jsx';
import { useTraceWorker } from '@hooks/useTraceWorker.js';
import { useAppStore } from '@store/useAppStore.js';

const WorkspaceGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(6)};
`;

const StatusDetails = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)};
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const MetaLine = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export function Home() {
  useTraceWorker();
  const { raster, status } = useAppStore((state) => ({
    raster: state.raster,
    status: state.status,
  }));

  return (
    <WorkspaceGrid>
      <Panel>
        <PanelHeader>
          <PanelTitle>Workflow Overview</PanelTitle>
        </PanelHeader>
        <PanelBody>
          <p>
            Bring your raster assets to life as responsive vector graphics. Upload an image, fine-tune the tracing
            parameters, and inspect the optimized SVG output in real time.
          </p>
          <StatusDetails>
            <MetaLine>
              <span>Status</span>
              <strong>{status}</strong>
            </MetaLine>
            <MetaLine>
              <span>Source</span>
              <strong>{raster ? raster.name : 'No file selected'}</strong>
            </MetaLine>
          </StatusDetails>
        </PanelBody>
      </Panel>
      <VectorPreviewPanel />
    </WorkspaceGrid>
  );
}
