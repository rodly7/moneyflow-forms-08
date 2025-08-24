
import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Données d'exemple pour les revenus mensuels
const data = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Fév', revenue: 3000 },
  { name: 'Mar', revenue: 2000 },
  { name: 'Avr', revenue: 2780 },
  { name: 'Mai', revenue: 1890 },
  { name: 'Jun', revenue: 2390 },
  { name: 'Jul', revenue: 3490 },
];

export const LineChart = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke="#8884d8" 
          strokeWidth={2}
          dot={{ fill: '#8884d8' }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};
