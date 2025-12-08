import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Box, Alert } from '@mui/material';
import SEO from '../components/SEO';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gold: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus({ type: 'success', message: 'Message sent successfully!' });
        // Reset form with all fields explicitly set to empty strings
        setFormData({
          name: '',
          email: '',
          gold: '',
          phone: '',
          message: ''
        });
      } else {
        const errorData = await response.json();
        setStatus({ type: 'error', message: errorData.message || 'Failed to send message. Please try again.' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus({ type: 'error', message: 'An error occurred. Please try again later.' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact Cyan Finance",
    "description": "Get in touch with Cyan Finance for gold loan inquiries, gold purchase, bank buy back services, and more. We're here to help you with all your financial needs.",
    "mainEntity": {
      "@type": "Organization",
      "name": "Cyan Finance",
      "url": "https://cyangold.in"
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <SEO
        title="Contact Us - Cyan Finance | Get in Touch"
        description="Get in touch with Cyan Finance for gold loan inquiries, gold purchase, bank buy back services, and more. We're here to help you with all your financial needs."
        keywords="gold loan, gold loan vizag, gold loan visakhapatnam, cyan gold, cyan finance, best gold loan provider, contact cyan finance, gold loan contact, cyan finance phone number, gold loan inquiry"
        url="/contact"
        structuredData={structuredData}
      />
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Contact Us
      </Typography>
      <Typography variant="body1" paragraph align="center">
        Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
      </Typography>

      {status.message && (
        <Alert severity={status.type as 'success' | 'error'} sx={{ mb: 3 }}>
          {status.message}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <TextField
          fullWidth
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Gold Amount"
          name="gold"
          type="number"
          value={formData.gold}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Message"
          name="message"
          multiline
          rows={4}
          value={formData.message}
          onChange={handleChange}
          margin="normal"
          required
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          sx={{ mt: 3 }}
        >
          Send Message
        </Button>
      </Box>
    </Container>
  );
};

export default Contact;