import React from 'react';
import { useFirmStore } from '../../store/useFirmStore';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button, Input } from '../ui';
import { cn } from '../../utils/formatters';

export interface FirmSettingsProps {
  editing?: boolean;
  onEdit?: () => void;
}

export const FirmSettings: React.FC<FirmSettingsProps> = ({
  editing = false,
  onEdit = () => {},
}) => {
  const firmSettings = useFirmStore((state) => state.firmSettings);

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Firm Settings</CardTitle>
        <div className="flex items-center gap-2">
          {editing ? (
            <Button variant="ghost" size="sm" onClick={handleEdit}>Cancel</Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleEdit}>Edit</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Firm Information */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Firm Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firm-name" className="text-sm font-medium text-gray-700">Firm Name</label>
              <input
                id="firm-name"
                type="text"
                defaultValue={firmSettings.firmName}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label htmlFor="firm-address" className="text-sm font-medium text-gray-700">Firm Address</label>
              <input
                id="firm-address"
                type="text"
                defaultValue={firmSettings.firmAddress}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firm-city" className="text-sm font-medium text-gray-700">Firm City</label>
              <input
                id="firm-city"
                type="text"
                defaultValue={firmSettings.firmCity}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label htmlFor="firm-state" className="text-sm font-medium text-gray-700">Firm State</label>
              <input
                id="firm-state"
                type="text"
                defaultValue={firmSettings.firmState}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firm-zip" className="text-sm font-medium text-gray-700">Firm ZIP</label>
              <input
                id="firm-zip"
                type="text"
                defaultValue={firmSettings.firmZip}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label htmlFor="firm-phone" className="text-sm font-medium text-gray-700">Firm Phone</label>
              <input
                id="firm-phone"
                type="tel"
                defaultValue={firmSettings.firmPhone}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firm-email" className="text-sm font-medium text-gray-700">Firm Email</label>
              <input
                id="firm-email"
                type="email"
                defaultValue={firmSettings.firmEmail}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label htmlFor="firm-license" className="text-sm font-medium text-gray-700">Firm License Number</label>
              <input
                id="firm-license"
                type="text"
                defaultValue={firmSettings.firmLicenseNumber}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firm-establishment-date" className="text-sm font-medium text-gray-700">Firm Establishment Date</label>
              <input
                id="firm-establishment-date"
                type="date"
                defaultValue={firmSettings.dateEstablished}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label htmlFor="routing-number" className="text-sm font-medium text-gray-700">Routing Number</label>
              <input
                id="routing-number"
                type="text"
                defaultValue={firmSettings.routingNumber}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        {/* Line of Credit Settings */}
        <div className="space-y-3 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Line of Credit</h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="bar-number" className="text-sm font-medium text-gray-700">Bar Number</label>
              <input
                id="bar-number"
                type="text"
                defaultValue={firmSettings.barNumber}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label htmlFor="operating-account" className="text-sm font-medium text-gray-700">Operating Account</label>
              <input
                id="operating-account"
                type="text"
                defaultValue={firmSettings.operatingAccount}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label htmlFor="aba-number" className="text-sm font-medium text-gray-700">ABA Number</label>
              <input
                id="aba-number"
                type="text"
                defaultValue={firmSettings.abaNumber}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label htmlFor="wire-transfer-instructions" className="text-sm font-medium text-gray-700">Wire Transfer Instructions</label>
              <textarea
                id="wire-transfer-instructions"
                defaultValue={firmSettings.wireTransferInstructions}
                disabled={!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={3}
              />
            </div>
          </div>

        {editing && (
          <div className="pt-4 border-t border-gray-200">
            <Button variant="primary" className="w-full">
              Save Settings
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
