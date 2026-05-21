import React from 'react';

function Layout({ children }) {
  return (
    <div>
      <h1>Vite React Application</h1>
      {children}
    </div>
  );
}

export default Layout;