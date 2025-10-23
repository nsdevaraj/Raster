import styled from '@emotion/styled';
import { Panel, PanelBody, PanelHeader, PanelTitle } from './panelStyles.js';
import { useAppStore } from '@store/useAppStore.js';

const Control = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
  font-size: 0.875rem;
`;

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing(2)} ${theme.spacing(3)}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: rgba(15, 23, 42, 0.45);
  color: ${({ theme }) => theme.colors.text};

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const Range = styled.input`
  width: 100%;
`;

const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing(2)} ${theme.spacing(3)}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: rgba(15, 23, 42, 0.45);
  color: ${({ theme }) => theme.colors.text};
  appearance: none;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

const ToggleRow = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(4)};
  padding: ${({ theme }) => `${theme.spacing(3)} ${theme.spacing(4)}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: rgba(15, 23, 42, 0.35);
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &[data-active='true'] {
    background: rgba(56, 189, 248, 0.12);
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

export function ConversionSettingsPanel() {
  const { settings, updateSettings } = useAppStore((state) => ({
    settings: state.settings,
    updateSettings: state.updateSettings,
  }));

  const handleChange = (event) => {
    const { name, value, type } = event.target;
    const normalizedValue = type === 'range' || type === 'number' ? Number(value) : value;
    updateSettings({ [name]: normalizedValue });
  };

  const handleToggle = (key) => () => {
    updateSettings({ [key]: !settings[key] });
  };

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Conversion Settings</PanelTitle>
      </PanelHeader>
      <PanelBody>
        <Control>
          <span>Threshold ({settings.threshold})</span>
          <Range
            type="range"
            name="threshold"
            min="0"
            max="255"
            step="1"
            value={settings.threshold}
            onChange={handleChange}
          />
        </Control>
        <Control>
          <span>Turd Size</span>
          <Input
            type="number"
            name="turdSize"
            min="0"
            step="1"
            value={settings.turdSize}
            onChange={handleChange}
          />
        </Control>
        <Control>
          <span>Optimization Tolerance</span>
          <Input
            type="number"
            name="optTolerance"
            min="0"
            step="0.1"
            value={settings.optTolerance}
            onChange={handleChange}
          />
        </Control>
        <Control>
          <span>Turn Policy</span>
          <Select name="turnPolicy" value={settings.turnPolicy} onChange={handleChange}>
            <option value="black">Black</option>
            <option value="white">White</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="minority">Minority</option>
            <option value="majority">Majority</option>
          </Select>
        </Control>
        <ToggleRow
          type="button"
          data-active={String(settings.color)}
          aria-pressed={settings.color}
          onClick={handleToggle('color')}
        >
          <span>Color Tracing</span>
          <span>{settings.color ? 'Enabled' : 'Disabled'}</span>
        </ToggleRow>
        <Control>
          <span>Optimize Precision</span>
          <Input
            type="number"
            name="optimizePrecision"
            min="0"
            step="1"
            value={settings.optimizePrecision}
            onChange={handleChange}
          />
        </Control>
      </PanelBody>
    </Panel>
  );
}
