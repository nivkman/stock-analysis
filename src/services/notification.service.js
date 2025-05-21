// Service for handling notifications and alerts
import nodemailer from 'nodemailer';
import chalk from 'chalk';
import config from '../config/index.config.js';

/**
 * Set up email notification system
 * @returns {Object|boolean} Notification service object or false if not configured
 */
export const setupNotifications = () => {
  const { user, pass, notificationEmail, service } = config.email;
  
  if (!user || !pass || !notificationEmail) {
    console.log(chalk.yellow('Email notifications not configured. Add credentials to .env file.'));
    return false;
  }
  
  const transporter = nodemailer.createTransport({
    service,
    auth: { user, pass }
  });
  
  return {
    /**
     * Send a notification email for a stock signal
     * @param {string} stock Stock symbol
     * @param {string} signal Signal type ('buy', 'sell', 'hold')
     * @param {number} price Current stock price
     * @param {Array} reasons Reasons for the signal
     */
    sendNotification: (stock, signal, price, reasons) => {
      const subject = `${stock} - ${signal.toUpperCase()} Signal`;
      const html = `
        <h2>${stock} - ${signal.toUpperCase()} Signal</h2>
        <p>Current Price: $${price.toFixed(2)}</p>
        <h3>Reasons:</h3>
        <ul>
          ${reasons.map(reason => `<li>${reason}</li>`).join('')}
        </ul>
        <p>This is an automated notification from your Stock Projector CLI.</p>
      `;
      
      const mailOptions = {
        from: user,
        to: notificationEmail,
        subject,
        html
      };
      
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Email error:', error);
        } else {
          console.log('Email notification sent');
        }
      });
    }
  };
};
