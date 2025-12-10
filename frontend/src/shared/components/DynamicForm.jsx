import React, { useState } from 'react';

const DynamicForm = ({ schema, onSubmit, initialValues = {} }) => {
  const [formData, setFormData] = useState(initialValues);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="dynamic-form">
      {schema.fields.map((field) => (
        <div key={field.name} className="form-group">
          <label>{field.label}</label>
          {field.type === 'text' && (
            <input 
              type="text" 
              className="form-control"
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          )}
          {field.type === 'password' && (
            <input 
              type="password" 
              className="form-control"
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
            />
          )}
          {/* Add more types as needed */}
        </div>
      ))}
      <button type="submit" className="btn btn-primary">{schema.submitLabel || 'Submit'}</button>
    </form>
  );
};

export default DynamicForm;
