import React, { useState } from 'react';
import { Mail, Phone, Send, Facebook, Instagram, Twitter } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Thank you ${formData.name}! Your message has been sent.`);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-content">
          
       
          <div className="contact-form-side">
            <h2 className="footer-heading">Message Us</h2>
            <form onSubmit={handleSubmit} className="footer-form">
              <input 
                type="text" 
                placeholder="Your Name" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
              />
              <input 
                type="email" 
                placeholder="Your Email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required 
              />
              <textarea 
                placeholder="Your Message" 
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                required
              ></textarea>
              <button type="submit" className="btn-footer-send">
                Send <Send size={16} />
              </button>
            </form>
          </div>

          
          <div className="contact-info-side">
            <div className="contact-block">
              <h3 className="sub-heading">Call us on</h3>
              <div className="contact-item">
                <Phone size={18} />
                <span>1234-567-890</span>
              </div>
            </div>

            <div className="contact-block">
              <h3 className="sub-heading">Email us on</h3>
              <div className="contact-item">
                <Mail size={18} />
                <span>shopsphere@gmail.com</span>
              </div>
            </div>

            <div className="contact-block">
              <h3 className="sub-heading">Follow us on</h3>
              <div className="footer-social-row">
                <a href="#" className="social-circle"><Twitter size={18} /></a>
                <a href="#" className="social-circle"><Instagram size={18} /></a>
                <a href="#" className="social-circle"><Facebook size={18} /></a>
              </div>
            </div>
          </div>

        </div>
        
        <div className="footer-bottom-bar">
          <p>&copy; 2026 Shop Sphere</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;