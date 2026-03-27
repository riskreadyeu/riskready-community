import { useState } from 'react';
import { EnableDisableToggle } from '@/components/shared/EnableDisableToggle';
import { disableControl, enableControl, Control } from '@/lib/controls-api';

interface ControlEnableDisableProps {
  control: Control;
  /** Called after state changes successfully */
  onStateChange?: (updatedControl: Control) => void;
}

/**
 * Enable/disable toggle for a Control
 * Handles API calls and state updates
 */
export function ControlEnableDisable({
  control,
  onStateChange,
}: ControlEnableDisableProps) {
  const [currentControl, setCurrentControl] = useState(control);

  const handleDisable = async (reason: string) => {
    const updated = await disableControl(control.id, reason);
    setCurrentControl(updated);
    onStateChange?.(updated);
  };

  const handleEnable = async () => {
    const updated = await enableControl(control.id);
    setCurrentControl(updated);
    onStateChange?.(updated);
  };

  return (
    <EnableDisableToggle
      applicable={currentControl.applicable}
      enabled={currentControl.enabled}
      justificationIfNa={currentControl.justificationIfNa}
      disabledReason={currentControl.disabledReason}
      disabledAt={currentControl.disabledAt}
      disabledBy={currentControl.disabledBy}
      onDisable={handleDisable}
      onEnable={handleEnable}
      entityType="control"
      entityName={`${currentControl.controlId} - ${currentControl.name}`}
    />
  );
}
