import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Link,
  IconButton,
  Paper
} from '@mui/material';
import {
  Facebook,
  Instagram,
  Twitter,
  LinkedIn,
  Email,
  Phone
} from '@mui/icons-material';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <Facebook />, url: '#' },
    { icon: <Instagram />, url: '#' },
    { icon: <Twitter />, url: '#' },
    { icon: <LinkedIn />, url: '#' },
  ];

  return (
    <Paper
      component="footer"
      sx={{
        py: 6,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[200],
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              About SmallJobs
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connect with local professionals and find the perfect job for your needs.
              Whether you're looking to hire or find work, SmallJobs is here to help.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/" color="inherit">
                Home
              </Link>
              <Link href="/jobs" color="inherit">
                Browse Jobs
              </Link>
              <Link href="/post-job" color="inherit">
                Post a Job
              </Link>
              <Link href="/about" color="inherit">
                About Us
              </Link>
              <Link href="/contact" color="inherit">
                Contact
              </Link>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Contact Us
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email />
                <Typography variant="body2">contact@smalljobs.com</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone />
                <Typography variant="body2">+1 (555) 123-4567</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          {socialLinks.map((link, index) => (
            <IconButton
              key={index}
              component={Link}
              href={link.url}
              target="_blank"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              {link.icon}
            </IconButton>
          ))}
        </Box>

        <Box sx={{ mt: 4, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
            © {currentYear} SmallJobs. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Paper>
  );
};

export default Footer;
