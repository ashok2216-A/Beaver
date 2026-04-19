import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./Dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe("Dashboard Page", () => {
  it("renders the welcome message", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/Welcome back, Jamie/i)).toBeInTheDocument();
  });

  it("renders the statistics cards", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/Active agents/i)).toBeInTheDocument();
    expect(screen.getByText(/Messages today/i)).toBeInTheDocument();
  });

  it("renders the agents list", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/Stripe Payments Agent/i)).toBeInTheDocument();
    expect(screen.getByText(/Notion Workspace Bot/i)).toBeInTheDocument();
  });
});
