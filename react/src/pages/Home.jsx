import React from 'react';
import {
  Container,
  Typography,
  Box,
} from '@mui/material';
import Navigation from '../components/Navigation';

const Home = () => {
  return (
    <div className="page-container">
      <Navigation />
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome to Home Page
          </Typography>
          {/* Add your home page content here */}
        </Box>
      </Container>
    </div>
  );
};

export default Home;
