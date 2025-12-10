import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import apiConfig from '../../config/api.config.json';
import { useAuth } from '../../context/AuthContext';

export const useConfigApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const request = async (endpointKey, params = {}, body = null) => {
    setLoading(true);
    setError(null);
    try {
      const keys = endpointKey.split('.');
      let config = apiConfig;
      for (const key of keys) {
        config = config[key];
      }

      if (!config) throw new Error(\`Endpoint \${endpointKey} not found in config\`);

      let url = config.url;
      // Replace params in URL (e.g., :id)
      Object.keys(params).forEach(key => {
        url = url.replace(\`:\${key}\`, params[key]);
      });

      const response = await axios({
        method: config.method,
        url,
        data: body,
        params: config.method === 'GET' ? params : undefined
      });

      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { request, loading, error };
};
