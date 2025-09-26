import React from 'react';

const TabPanel = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="tab-panel">
      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <i className={tab.icon}></i>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabPanel;
