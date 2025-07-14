import React from 'react';
import './Navigation.css'; // Reuse styles if needed

const Header = ({
  title = '🎨 AI Image Generator',
  subtitle = 'Create stunning images with artificial intelligence | 🔐 Secure & Encrypted',
}) => (
  <header className="header">
    <h1>{title}</h1>
    <p>{subtitle}</p>
  </header>
);

export default Header; 