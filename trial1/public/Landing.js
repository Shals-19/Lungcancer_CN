import React from 'react';

const Landing = () => {
  const handleNavigation = (file) => {
    window.location.href = `/${file}`;
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to the Communication App</h1>
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => handleNavigation('textchat.html')}
          style={{ margin: '10px', padding: '10px 20px', fontSize: '16px' }}
        >
          Text Chat
        </button>
        <button
          onClick={() => handleNavigation('videochat.html')}
          style={{ margin: '10px', padding: '10px 20px', fontSize: '16px' }}
        >
          Video Chat
        </button>
        <button
          onClick={() => handleNavigation('voicecall.html')}
          style={{ margin: '10px', padding: '10px 20px', fontSize: '16px' }}
        >
          Voice Call
        </button>
      </div>
    </div>
  );
};

export default Landing;