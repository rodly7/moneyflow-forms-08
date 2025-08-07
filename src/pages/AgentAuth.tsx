
import React from 'react';
import AgentAuthForm from '@/components/auth/AgentAuthForm';

const AgentAuth = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-600/10 via-teal-600/10 to-green-600/10"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-emerald-400/30 to-teal-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-teal-400/30 to-green-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-green-300/20 to-emerald-300/20 rounded-full blur-3xl animate-bounce-gentle"></div>
        
        {/* Floating particles */}
        <div className="absolute top-10 left-10 w-3 h-3 bg-emerald-400/70 rounded-full animate-pulse shadow-lg"></div>
        <div className="absolute top-20 right-20 w-4 h-4 bg-teal-400/70 rounded-full animate-pulse delay-500 shadow-lg"></div>
        <div className="absolute bottom-20 left-20 w-2 h-2 bg-green-400/70 rounded-full animate-pulse delay-1000 shadow-lg"></div>
        <div className="absolute bottom-10 right-10 w-5 h-5 bg-emerald-300/70 rounded-full animate-pulse delay-1500 shadow-lg"></div>
      </div>
      
      <AgentAuthForm />
    </div>
  );
};

export default AgentAuth;
