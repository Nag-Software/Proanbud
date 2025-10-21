import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import SignupForm from '../SignupForm';

global.fetch = jest.fn();

describe('SignupForm', () => {

  beforeEach(() => {

    fetch.mockClear();

  });

  it('validates required fields', async () => {

    render(<SignupForm />);

    fireEvent.click(screen.getByText('Send inn'));

    await waitFor(() => {

      expect(screen.getByText('Firma er påkrevd')).toBeInTheDocument();

    });

  });

  it('submits form successfully', async () => {

    fetch.mockResolvedValueOnce({ ok: true });

    render(<SignupForm />);

    fireEvent.change(screen.getByLabelText('Firma'), { target: { value: 'Test Firma' } });

    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Test Navn' } });

    fireEvent.change(screen.getByLabelText('Stillings-tittel'), { target: { value: 'CEO' } });

    fireEvent.change(screen.getByLabelText('E-post'), { target: { value: 'test@example.com' } });

    fireEvent.change(screen.getByLabelText('Antall forslag per måned'), { target: { value: '1-10' } });

    fireEvent.change(screen.getByLabelText('Ønsket starttidspunkt'), { target: { value: '2025-11-01' } });

    fireEvent.click(screen.getByLabelText('Ja, jeg vil laste ned pilotavtalen'));

    fireEvent.click(screen.getByText('Send inn'));

    await waitFor(() => {

      expect(fetch).toHaveBeenCalledWith('/api/pilot-signup', expect.any(Object));

    });

  });

});