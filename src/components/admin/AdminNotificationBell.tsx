import React from 'react';
import { CustomerServiceButton } from '@/components/notifications/CustomerServiceButton';

// This component is now deprecated and replaced by CustomerServiceButton
// Keeping for backward compatibility but redirecting to CustomerServiceButton
const AdminNotificationBell = ({ className = "" }) => {
  return <CustomerServiceButton />;
};

export default AdminNotificationBell;
