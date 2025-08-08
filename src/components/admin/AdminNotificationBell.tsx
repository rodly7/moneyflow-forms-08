
import React from 'react';
import { SimpleCustomerServiceButton } from '@/components/notifications/SimpleCustomerServiceButton';

// Ce composant est maintenant remplacé par le système de service client
// Il redirige vers SimpleCustomerServiceButton pour une expérience unifiée
const AdminNotificationBell = ({ className = "" }) => {
  return <SimpleCustomerServiceButton />;
};

export default AdminNotificationBell;
