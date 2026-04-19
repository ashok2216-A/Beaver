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

// Mock the API module
vi.mock("@/lib/api", () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from "@/lib/api";

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

  it("renders the agents list", async () => {
    (api.get as any).mockResolvedValue([
      { id: 1, name: "Stripe Payments Agent", base_url: "http://api.stripe.com", status: "live", created_at: new Date().toISOString(), endpoint_count: 5 },
      { id: 2, name: "Notion Workspace Bot", base_url: "http://api.notion.com", status: "draft", created_at: new Date().toISOString(), endpoint_count: 3 },
    ]);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>
    );
    
    expect(await screen.findByText(/Stripe Payments Agent/i)).toBeInTheDocument();
    expect(await screen.findByText(/Notion Workspace Bot/i)).toBeInTheDocument();
  });
});
