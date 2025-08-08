
import React, { useState } from 'react';
import { Bug, Play, Trash2, Wifi, Database, Bell, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotificationDebugger } from '@/hooks/useNotificationDebugger';

const NotificationDebugPanel = () => {
  const {
    debugEvents,
    isDebugging,
    setIsDebugging,
    testSupabaseConnection,
    testRealtimeConnection,
    clearDebugEvents
  } = useNotificationDebugger();

  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white hover:bg-blue-700"
      >
        <Bug className="w-4 h-4 mr-2" />
        Debug Notifs
      </Button>
    );
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'connection':
        return 'text-blue-600 bg-blue-50';
      case 'data':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'connection':
        return <Wifi className="w-3 h-3" />;
      case 'data':
        return <Database className="w-3 h-3" />;
      case 'error':
        return <Bell className="w-3 h-3" />;
      default:
        return <Bug className="w-3 h-3" />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 z-50">
      <Card className="shadow-2xl border-2 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-blue-600" />
              Debug Notifications
            </div>
            <div className="flex gap-1">
              <Button
                onClick={() => setIsDebugging(!isDebugging)}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
              >
                {isDebugging ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
              <Button
                onClick={() => setIsVisible(false)}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
              >
                ✕
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {/* Boutons de test */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button
              onClick={testSupabaseConnection}
              variant="outline"
              size="sm"
              className="text-xs h-8"
            >
              <Database className="w-3 h-3 mr-1" />
              Test DB
            </Button>
            <Button
              onClick={testRealtimeConnection}
              variant="outline"
              size="sm"
              className="text-xs h-8"
            >
              <Wifi className="w-3 h-3 mr-1" />
              Test RT
            </Button>
          </div>

          {/* Liste des événements */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {debugEvents.length === 0 ? (
              <div className="text-center text-gray-500 text-xs py-4">
                Aucun événement de debug
                <br />
                Cliquez sur "Test DB" pour commencer
              </div>
            ) : (
              debugEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-2 rounded text-xs border-l-2 ${getEventColor(event.type)}`}
                >
                  <div className="flex items-start gap-2">
                    {getEventIcon(event.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs opacity-75">
                          {event.timestamp}
                        </span>
                        <span className="font-medium">
                          {event.message}
                        </span>
                      </div>
                      {event.data && (
                        <pre className="mt-1 text-xs opacity-75 overflow-hidden">
                          {JSON.stringify(event.data, null, 2).slice(0, 200)}
                          {JSON.stringify(event.data).length > 200 && '...'}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          {debugEvents.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <Button
                onClick={clearDebugEvents}
                variant="outline"
                size="sm"
                className="w-full text-xs h-6"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Vider les logs
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationDebugPanel;
