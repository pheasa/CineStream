import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { updateClientConfig } from '../../config/client';

interface ConfigLoaderProps {
  children: React.ReactNode;
}

/**
 * Component that fetches the latest dynamic configuration from the server
 * and updates the global clientConfig before rendering the app.
 */
export const ConfigLoader: React.FC<ConfigLoaderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      try {
        // Fetch public config from the API
        const response = await axios.get('/api/config');
        if (response.data) {
          updateClientConfig(response.data);
        }
      } catch (error) {
        console.warn('Failed to fetch dynamic config, using build-time defaults.', error);
      } finally {
        setIsReady(true);
      }
    }

    fetchConfig();
  }, []);

  if (!isReady) {
    // Show a minimal loader while settings are being fetched
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
};
