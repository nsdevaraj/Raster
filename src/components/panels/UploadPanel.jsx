import { useRef, useState } from 'react';
import styled from '@emotion/styled';
import clsx from 'clsx';
import { Panel, PanelBody, PanelHeader, PanelTitle } from './panelStyles.js';
import { useAppStore } from '@store/useAppStore.js';

const HiddenFileInput = styled.input`
  display: none;
`;

const DropZone = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(12)};
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: rgba(15, 23, 42, 0.35);
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;

  &:hover,
  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary};
    background: rgba(56, 189, 248, 0.08);
    color: ${({ theme }) => theme.colors.text};
  }

  &.has-file {
    border-style: solid;
    color: ${({ theme }) => theme.colors.text};
  }

  &.is-dragging {
    border-style: solid;
    border-color: ${({ theme }) => theme.colors.primary};
    background: rgba(56, 189, 248, 0.14);
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Hint = styled.span`
  font-size: 0.875rem;
  text-align: center;
`;

const FileDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ResetButton = styled.button`
  align-self: flex-end;
  padding: ${({ theme }) => `${theme.spacing(2)} ${theme.spacing(4)}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid transparent;
  cursor: pointer;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  transition: all 0.18s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

export function UploadPanel() {
  const inputRef = useRef(null);
  const { raster, setRaster, reset } = useAppStore((state) => ({
    raster: state.raster,
    setRaster: state.setRaster,
    reset: state.reset,
  }));
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event) => {
    const input = event.target;
    const [file] = input.files ?? [];
    if (!file) return;
    setRaster(file);
    input.value = '';
  };

  const openFileDialog = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const [file] = event.dataTransfer?.files ?? [];
    if (!file) return;
    setRaster(file);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    setIsDragging(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFileDialog();
    }
  };

  const handleReset = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setIsDragging(false);
    reset();
  };

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Raster Source</PanelTitle>
        {raster ? (
          <ResetButton type="button" onClick={handleReset}>
            Reset
          </ResetButton>
        ) : null}
      </PanelHeader>
      <PanelBody>
        <DropZone
          role="button"
          tabIndex={0}
          aria-label="Upload a raster image"
          className={clsx({ 'is-dragging': isDragging, 'has-file': Boolean(raster) })}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onKeyDown={handleKeyDown}
          onClick={openFileDialog}
        >
          <HiddenFileInput
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/bmp,image/tiff"
            onChange={handleFileChange}
            aria-hidden="true"
          />
          <Hint>
            {raster ? 'Replace raster image (PNG, JPEG, BMP, TIFF, WEBP)' : 'Click to upload or drop a raster image'}
          </Hint>
        </DropZone>
        {raster ? (
          <FileDetails>
            <span>
              <strong>File:</strong> {raster.name}
            </span>
            <span>
              <strong>Size:</strong> {(raster.size / 1024).toFixed(1)} KB
            </span>
            <span>
              <strong>Type:</strong> {raster.type || 'Unknown'}
            </span>
          </FileDetails>
        ) : null}
      </PanelBody>
    </Panel>
  );
}
