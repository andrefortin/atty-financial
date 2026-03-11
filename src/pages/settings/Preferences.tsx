import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const Preferences: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Display Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-gray-600">Use dark theme for the interface</p>
                </div>
                <input type="checkbox" className="h-5 w-5 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Compact View</p>
                  <p className="text-sm text-gray-600">Show more items per page</p>
                </div>
                <input type="checkbox" className="h-5 w-5 rounded" defaultChecked />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">Notification Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive email alerts for important events</p>
                </div>
                <input type="checkbox" className="h-5 w-5 rounded" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Browser Notifications</p>
                  <p className="text-sm text-gray-600">Show in-app notifications</p>
                </div>
                <input type="checkbox" className="h-5 w-5 rounded" defaultChecked />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline">Reset to Defaults</Button>
            <Button>Save Preferences</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
