const path = require('path');
const services = {}; // Cache for loaded services

const GenericController = {
  handle: async (req, res, handlerName) => {
    try {
      const [serviceName, methodName] = handlerName.split('.');
      
      // Lazy load service
      if (!services[serviceName]) {
        try {
          // Adjust path to application/services
          const ServiceClass = require(`../../application/services/${serviceName}`);
          services[serviceName] = new ServiceClass();
        } catch (e) {
          console.error(`Service ${serviceName} not found:`, e);
          return res.status(500).json({ error: "Service configuration error" });
        }
      }

      const service = services[serviceName];
      if (!service[methodName]) {
        console.error(`Method ${methodName} not found in ${serviceName}`);
        return res.status(500).json({ error: "Method configuration error" });
      }

      // Execute logic
      await service[methodName](req, res);
    } catch (error) {
      console.error(`Controller Error (${handlerName}):`, error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  }
};

module.exports = GenericController;
