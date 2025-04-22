import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from './Home';

describe('Home Page', () => {
  it('renders the header text', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    const headerElement = screen.getByText(/Welcome to Anime Tracker/i);
    expect(headerElement).toBeInTheDocument();
  });
  
  it('renders the description text', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    const descriptionElement = screen.getByText(/Track your favorite anime shows and never miss an episode/i);
    expect(descriptionElement).toBeInTheDocument();
  });
  
  it('renders the feature cards', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    const trackShowsElement = screen.getByText(/Track Shows/i);
    const stayUpdatedElement = screen.getByText(/Stay Updated/i);
    
    expect(trackShowsElement).toBeInTheDocument();
    expect(stayUpdatedElement).toBeInTheDocument();
  });
}); 