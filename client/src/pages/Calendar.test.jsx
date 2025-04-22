import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Calendar from './Calendar';

const renderCalendar = () => {
  return render(
    <BrowserRouter>
      <Calendar />
    </BrowserRouter>
  );
};

describe('Calendar', () => {
  it('renders calendar page with title and buttons', () => {
    renderCalendar();
    
    // Check for title
    expect(screen.getByText('Anime Calendar')).toBeInTheDocument();
    
    // Check for view buttons
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
    
    // Check for empty state message
    expect(screen.getByText('No upcoming episodes found. Add shows to your watch list to see them here!')).toBeInTheDocument();
  });
}); 