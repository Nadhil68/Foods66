
import React from 'react';
import { useNotificationStore } from '../store/useStore';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';

const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotificationStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {notifications.map(notif => (
        <div 
          key={notif.id}
          role="alert"
          aria-live="assertive"
          className="pointer-events-auto bg-white rounded-lg shadow-lg border-l-4 p-4 min-w-[300px] max-w-sm flex items-start gap-3 animate-slideInRight transition-all"
          style={{
            borderColor: 
              notif.type === 'success' ? '#10B981' : 
              notif.type === 'warning' ? '#F59E0B' : 
              notif.type === 'error' ? '#EF4444' : '#3B82F6'
          }}
        >
          <div className={`mt-0.5 flex-shrink-0 ${
             notif.type === 'success' ? 'text-emerald-500' : 
             notif.type === 'warning' ? 'text-amber-500' : 
             notif.type === 'error' ? 'text-red-500' : 'text-blue-500'
          }`}>
            {notif.type === 'success' && <CheckCircle size={20} />}
            {notif.type === 'warning' && <AlertTriangle size={20} />}
            {notif.type === 'error' && <AlertCircle size={20} />}
            {notif.type === 'info' && <Info size={20} />}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1">{notif.title}</h4>
            <p className="text-gray-600 text-xs leading-relaxed">{notif.message}</p>
          </div>
          <button onClick={() => removeNotification(notif.id)} className="text-gray-400 hover:text-gray-600 transition p-1">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
