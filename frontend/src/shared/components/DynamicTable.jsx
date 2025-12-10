import React from 'react';

const DynamicTable = ({ schema, data, onAction }) => {
  return (
    <div className="dynamic-table-container">
      <table className="table">
        <thead>
          <tr>
            {schema.columns.map((col) => (
              <th key={col.field} style={{ width: col.width }}>{col.header}</th>
            ))}
            {schema.actions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex}>
              {schema.columns.map((col) => (
                <td key={col.field}>
                  {col.type === 'image' ? (
                    <img src={row[col.field]} alt="" style={{ height: '50px' }} />
                  ) : (
                    row[col.field]
                  )}
                </td>
              ))}
              {schema.actions && (
                <td>
                  {schema.actions.map((action) => (
                    <button 
                      key={action} 
                      className={`btn btn-sm btn-${action === 'delete' ? 'danger' : 'secondary'}`}
                      onClick={() => onAction(action, row)}
                    >
                      {action}
                    </button>
                  ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DynamicTable;
