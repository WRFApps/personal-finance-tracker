
import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App.tsx';
import Modal from './ui/Modal.tsx';
import Button from './ui/Button.tsx';
import { DashboardWidgetConfigItem } from '../types.ts';
import { DEFAULT_DASHBOARD_WIDGET_CONFIG } from '../constants.ts';

interface DashboardCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DashboardCustomizationModal: React.FC<DashboardCustomizationModalProps> = ({ isOpen, onClose }) => {
  const context = useContext(AppContext);
  const [widgetsConfig, setWidgetsConfig] = useState<DashboardWidgetConfigItem[]>([]);

  useEffect(() => {
    if (isOpen && context?.userSettings.dashboardWidgets) {
        // Ensure all default widgets are present in the local state for configuration
        const currentWidgetIds = new Set(context.userSettings.dashboardWidgets.map(w => w.id));
        const newWidgetsToAdd = DEFAULT_DASHBOARD_WIDGET_CONFIG.filter(dw => !currentWidgetIds.has(dw.id));
        
        let combinedWidgets = [...context.userSettings.dashboardWidgets];
        if (newWidgetsToAdd.length > 0) {
            let maxOrder = Math.max(0, ...context.userSettings.dashboardWidgets.map(w => w.order));
            combinedWidgets = [
                ...combinedWidgets,
                ...newWidgetsToAdd.map(nw => ({...nw, order: ++maxOrder, isVisible: nw.isVisible})) // Use default visibility
            ];
        }
        // Ensure all widgets have a default name if missing
        combinedWidgets = combinedWidgets.map(w => ({
            ...w,
            name: w.name || DEFAULT_DASHBOARD_WIDGET_CONFIG.find(dw => dw.id === w.id)?.name || 'Unknown Widget'
        }));

        setWidgetsConfig(combinedWidgets.sort((a, b) => a.order - b.order));
    } else if (isOpen) { // Fallback if userSettings.dashboardWidgets is undefined for some reason
        setWidgetsConfig([...DEFAULT_DASHBOARD_WIDGET_CONFIG].sort((a,b) => a.order - b.order));
    }
  }, [isOpen, context?.userSettings.dashboardWidgets]);

  if (!context) return null;
  const { updateDashboardWidgetSettings, notifySuccess, notifyError, notifyInfo } = context;

  const handleVisibilityChange = (id: string) => {
    setWidgetsConfig(prev =>
      prev.map(widget =>
        widget.id === id ? { ...widget, isVisible: !widget.isVisible } : widget
      )
    );
  };

  const handleMoveWidget = (id: string, direction: 'up' | 'down') => {
    setWidgetsConfig(prevConfig => {
      const newConfig = [...prevConfig];
      const widgetIndex = newConfig.findIndex(w => w.id === id);
      if (widgetIndex === -1) return newConfig;

      const targetIndex = direction === 'up' ? widgetIndex - 1 : widgetIndex + 1;
      if (targetIndex < 0 || targetIndex >= newConfig.length) return newConfig; // Out of bounds

      // Swap order numbers
      const tempOrder = newConfig[widgetIndex].order;
      newConfig[widgetIndex].order = newConfig[targetIndex].order;
      newConfig[targetIndex].order = tempOrder;
      
      // Re-sort by new order to reflect change
      return newConfig.sort((a, b) => a.order - b.order);
    });
  };

  const handleSaveChanges = () => {
    // Ensure order is contiguous from 1
    const sortedWidgets = [...widgetsConfig].sort((a, b) => a.order - b.order);
    const finalWidgets = sortedWidgets.map((widget, index) => ({
        ...widget,
        order: index + 1
    }));
    updateDashboardWidgetSettings(finalWidgets);
    onClose();
  };
  
  const handleResetToDefaults = () => {
    setWidgetsConfig([...DEFAULT_DASHBOARD_WIDGET_CONFIG].sort((a,b) => a.order - b.order));
    notifyInfo("Dashboard layout reset to defaults. Save to apply.");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customize Dashboard Widgets" size="lg">
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Select which widgets to display on your dashboard and change their order.
      </p>
      <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
        {widgetsConfig.map((widget, index) => (
          <div
            key={widget.id}
            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`widget-toggle-${widget.id}`}
                checked={widget.isVisible}
                onChange={() => handleVisibilityChange(widget.id)}
                className="form-checkbox h-5 w-5 text-primary focus:ring-primary border-gray-300 dark:border-gray-500 rounded mr-3"
              />
              <label htmlFor={`widget-toggle-${widget.id}`} className="text-gray-700 dark:text-gray-200 select-none">
                {widget.name}
              </label>
            </div>
            <div className="flex items-center space-x-1.5">
              <Button
                iconOnly
                variant="light"
                size="xs"
                onClick={() => handleMoveWidget(widget.id, 'up')}
                disabled={index === 0}
                title="Move Up"
              >
                <i className="fas fa-arrow-up"></i>
              </Button>
              <Button
                iconOnly
                variant="light"
                size="xs"
                onClick={() => handleMoveWidget(widget.id, 'down')}
                disabled={index === widgetsConfig.length - 1}
                title="Move Down"
              >
                <i className="fas fa-arrow-down"></i>
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-between items-center">
        <Button variant="outline" onClick={handleResetToDefaults} size="sm" leftIcon={<i className="fas fa-undo"></i>}>
            Reset to Defaults
        </Button>
        <div className="flex space-x-3">
            <Button variant="light" onClick={onClose} size="sm">Cancel</Button>
            <Button variant="primary" onClick={handleSaveChanges} size="sm" leftIcon={<i className="fas fa-save"></i>}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
};

export default DashboardCustomizationModal;
